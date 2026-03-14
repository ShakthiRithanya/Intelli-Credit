
import sys
import os
import uuid
import json
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.scripts.predict_with_explanations import predict_with_shap, predict_with_overrides
from backend.scripts.generate_cam import CAMGenerator
from backend.db import COMPANIES, MASTER_REGISTRY, REGISTRY_PATH
from backend.database import (
    init_db, create_application, update_ai_score, get_application,
    get_all_applications, officer_decide, borrower_accept, borrower_review_request
)

from backend.processors.explainability import build_explanation, get_feature_snippets
from backend.utils.pdf_generator import generate_pdf_from_markdown

# ── Init DB on startup ─────────────────────────────────────────────────────────
init_db()

app = FastAPI(title="Intelli-Credit API v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic models ──────────────────────────────────────────────────────────
class SimulationRequest(BaseModel):
    overrides: Dict[str, Any]

class OfficerDecisionRequest(BaseModel):
    decision: str           # "approve" | "reject" | "pending_review"
    notes: str = ""
    final_sanctioned: Optional[float] = None
    final_rate: Optional[float] = None

# ─── Pricing helper ───────────────────────────────────────────────────────────
PRICING = {
    "low_risk":    {"rate": 9.5,  "factor": 0.95, "text": "Strong GST growth and clean credit history qualify you for our best rates.",       "status": "approved"},
    "medium_risk": {"rate": 13.5, "factor": 0.80, "text": "Stable revenues but minor EMI flags; approved at a moderate risk premium.",         "status": "approved"},
    "high_risk":   {"rate": 18.0, "factor": 0.40, "text": "Elevated litigation and cash flow risks. Limited sanction offered.",               "status": "rejected"},
}

def ai_pricing(risk_class: str, requested_amount: float):
    p = PRICING.get(risk_class, PRICING["medium_risk"])
    return p["status"], requested_amount * p["factor"], p["rate"], p["text"]

# ─── INTERNAL COMPANY ENDPOINTS ───────────────────────────────────────────────
# @app.get("/")
# def read_root():
#     return {"message": "Intelli-Credit API is running"}

@app.get("/companies")
def get_companies():
    """Returns the unified list of existing portfolio companies + approved borrower applications."""
    results = []
    
    # 1. Add static enterprise portfolio
    for cid, info in COMPANIES.items():
        pred = predict_with_shap(cid)
        if "risk_class" not in pred:
            print(f"Error predicting for {cid}: {pred.get('error', 'Unknown Error')}")
            # Fallback to some defaults so the UI doesn't crash
            results.append({
                "company_id": cid,
                "name": info["name"],
                "sector": info["sector"],
                "risk_class": "medium_risk",
                "confidence": 0.5,
                "cam_ready": False,
                "is_new_application": False
            })
            continue

        results.append({
            "company_id": cid,
            "name": info["name"],
            "sector": info["sector"],
            "risk_class": pred["risk_class"],
            "confidence": pred["confidence"],
            "cam_ready": True,
            "is_new_application": False
        })
        
    # 2. Add approved/accepted borrower applications from DB
    db_apps = get_all_applications()
    for app in db_apps:
        if app["status"] in ("approved", "accepted"):
            # Use AI results from DB if available, else re-run prediction
            risk_class = app["ai_risk_class"]
            confidence = app["ai_confidence"]
            
            # If DB values are missing (unlikely after scoring), fallback
            if not risk_class:
                p = predict_with_shap(app["company_id"])
                risk_class = p["risk_class"]
                confidence = p["confidence"]

            results.append({
                "company_id": app["application_id"], # Use app ID as the entry key
                "name": app["company_name"],
                "sector": app["sector"],
                "risk_class": risk_class,
                "confidence": confidence,
                "cam_ready": True,
                "is_new_application": True,
                "app_status": app["status"]
            })
            
    return results

def _get_enriched_summary(cid: str, company_id_label: str, name: str, sector: str, overrides: Dict[str, Any] = None):
    """Helper to build the standard enriched company summary with metrics, SHAP, and 5C scores."""
    if overrides:
        result = predict_with_overrides(cid, overrides)
    else:
        result = predict_with_shap(cid)

    import json as _json
    import os as _os
    base_dir = _os.path.dirname(_os.path.abspath(__file__))
    vectors_path = _os.path.join(base_dir, "data", "raw", "integrated_feature_vectors.json")
    with open(vectors_path) as f:
        vectors = _json.load(f)
    feat_row = next((v for v in vectors if v["company_id"] == cid), {}).copy()

    # Apply overrides to feat_row if present for the 5C and metrics calculation
    if overrides:
        for k, v in overrides.items():
            if k in feat_row:
                feat_row[k] = v

    # Build five C scores
    def clamp(v, lo=0.0, hi=1.0): return max(lo, min(hi, float(v)))
    gst_growth = float(feat_row.get("gst_growth_6m", 0))
    emi_bounce = float(feat_row.get("bank_emi_bounce_count", 0))
    litigation  = float(feat_row.get("litigation_risk_score", 0))
    itr_margin  = float(feat_row.get("itr_profit_margin", 0))
    pos_flags   = float(feat_row.get("positive_flags_count", 0))
    mgmt_qual   = float(feat_row.get("management_quality_score", 0))
    
    ext_litigation = float(feat_row.get("external_litigation_risk_score", 0))
    ext_gov = float(feat_row.get("external_governance_risk_score", 0))
    ext_headwind = float(feat_row.get("external_headwind_score", 0))
    
    gst_mismatch = int(feat_row.get("gst_mismatch_score", 0))
    mismatch_labels = {0: "LOW", 1: "MEDIUM", 2: "HIGH"}
    cibil = float(feat_row.get("cibil_commercial_score", 0))

    five_c = {
        "character":  clamp(0.5 + mgmt_qual * 0.1 + pos_flags * 0.05 - litigation * 0.15 - ext_litigation * 0.1 - ext_gov * 0.1 - (0.1 if cibil < 600 else 0)),
        "capacity":   clamp(0.4 + gst_growth * 1.5 + itr_margin * 0.5 - gst_mismatch * 0.1),
        "capital":    clamp(0.55 - litigation * 0.1 - emi_bounce * 0.1),
        "collateral": clamp(0.5 + gst_growth * 0.5),
        "conditions": clamp(0.6 + gst_growth * 0.4 - emi_bounce * 0.05 - ext_headwind * 0.1),
    }

    return {
        "company_id":    company_id_label,
        "name":          name,
        "sector":        sector,
        "risk_class":    result["risk_class"],
        "confidence":    result["confidence"],
        "metrics": {
            "gst_growth_6m":          gst_growth,
            "gst_avg_monthly_sales":  float(feat_row.get("gst_avg_monthly_sales", 0)),
            "bank_emi_bounce_count":  int(emi_bounce),
            "litigation_risk_score":  int(litigation),
            "itr_profit_margin":      itr_margin,
            "external_litigation_risk_score": int(ext_litigation),
            "external_governance_risk_score": int(ext_gov),
            "external_headwind_score": int(ext_headwind),
            "gst_mismatch_score": gst_mismatch,
            "gst_mismatch_flag": mismatch_labels.get(gst_mismatch, "LOW"),
            "cibil_commercial_score": cibil,
            "gstr_2a_itc_amount": float(feat_row.get("gstr_2a_itc_amount", 0)),
            "gstr_3b_itc_claimed": float(feat_row.get("gstr_3b_itc_claimed", 0))
        },
        "shap":          result["explanation"],
        "five_c_scores": five_c,
    }

@app.get("/companies/{company_id}/summary")
def get_summary(company_id: str):
    """Returns the enriched summary for a portfolio company or an approved application."""
    name, sector, cid = "", "", company_id
    if company_id.startswith("APP_"):
        row = get_application(company_id)
        if not row: raise HTTPException(status_code=404, detail="App not found")
        name, sector, cid = row["company_name"], row["sector"], row["company_id"]
    elif company_id in COMPANIES:
        name, sector, cid = COMPANIES[company_id]["name"], COMPANIES[company_id]["sector"], company_id
    else:
        # Fallback for dynamic companies
        row = next((c for c in get_all_applications() if c["application_id"] == company_id), None)
        if row:
             name, sector, cid = row["company_name"], row["sector"], row["company_id"]
        else:
            raise HTTPException(status_code=404, detail="ID not found")

    return _get_enriched_summary(cid, company_id, name, sector)

@app.get("/companies/{company_id}/external-intel")
def get_external_intel(company_id: str):
    import json
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))
    nlp_path = os.path.join(base_dir, "data", "raw", "nlp_extractions.json")
    with open(nlp_path) as f:
        data = json.load(f)
    
    # Use real CID if it's an app
    cid = company_id
    if company_id.startswith("APP_"):
        row = get_application(company_id)
        if row: cid = row["company_id"]

    # Filter for external items with meta
    results = []
    for entry in data:
        if entry["company_id"] == cid and "external_meta" in entry:
            results.append({
                "source_type": entry["external_meta"]["source_type"],
                "source_name": entry["external_meta"]["source_name"],
                "headline": entry["external_meta"]["headline"],
                "published_date": entry["external_meta"]["published_date"],
                "risk_summary": entry["risk_items"][0]["snippet"] if entry["risk_items"] else "No specific risk extracted."
            })
    
    return results

@app.get("/companies/{company_id}/explanation")
def get_company_explanation(company_id: str):
    # Use real CID if it's an app
    cid = company_id
    if company_id.startswith("APP_"):
        row = get_application(company_id)
        if row: cid = row["company_id"]
    return build_explanation(cid)

@app.get("/companies/{company_id}/feature-snippets")
def get_company_feature_snippets(company_id: str, feature: str):
    # Use real CID if it's an app
    cid = company_id
    if company_id.startswith("APP_"):
        row = get_application(company_id)
        if row: cid = row["company_id"]
    return get_feature_snippets(cid, feature)

@app.get("/companies/{company_id}/ratios")
def get_company_ratios(company_id: str):
    cid = company_id
    if company_id.startswith("APP_"):
        row = get_application(company_id)
        if row: cid = row["company_id"]
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    ratios_path = os.path.join(base_dir, "data", "raw", "financial_ratios.json")
    if os.path.exists(ratios_path):
        with open(ratios_path) as f:
            data = json.load(f)
        for entry in data:
            if entry["company_id"] == cid:
                return entry["ratios"]
    return []

@app.get("/portfolio/companies")
def get_portfolio_companies():
    """Returns a list of all companies with portfolio-relevant metrics."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    vectors_path = os.path.join(base_dir, "data", "raw", "integrated_feature_vectors.json")
    ratios_path = os.path.join(base_dir, "data", "raw", "financial_ratios.json")
    
    if not os.path.exists(vectors_path):
        return []

    with open(vectors_path) as f:
        vectors = json.load(f)
    
    ratios_lookup = {}
    if os.path.exists(ratios_path):
        with open(ratios_path) as f:
            ratios_data = json.load(f)
            for entry in ratios_data:
                # Get the latest ratio entry
                if entry.get("ratios"):
                    ratios_lookup[entry["company_id"]] = entry["ratios"][-1]
                
    portfolio = []
    # Mocking some exposure data for demo
    exposures = {
        "CID_001": {"req": 120000000, "sanc": 110000000},
        "CID_002": {"req": 80000000, "sanc": 80000000},
        "CID_003": {"req": 45000000, "sanc": 35000000},
        "CID_004": {"req": 30000000, "sanc": 25000000},
        "CID_005": {"req": 50000000, "sanc": 40000000},
        "CID_006": {"req": 60000000, "sanc": 45000000}
    }
    
    for v in vectors:
        cid = v["company_id"]
        pred = predict_with_shap(cid, use_hybrid=True)
        
        if "risk_class" not in pred:
            continue

        # Risk Score Mapping: 0-100
        # Low=0-33, Med=34-66, High=67-100
        conf = pred["confidence"]
        if pred["risk_class"] == "low_risk":
            score = (1 - conf) * 33
        elif pred["risk_class"] == "medium_risk":
            score = 33 + (1 - conf) * 33
        else:
            score = 66 + conf * 34
            
        ratio = ratios_lookup.get(cid, {})
        exp = exposures.get(cid, {"req": 0, "sanc": 0})
        
        info = COMPANIES.get(cid, {"name": f"Enterprise_{cid}", "sector": "General Manufacturing"})
        
        portfolio.append({
            "company_id": cid,
            "name": info["name"],
            "sector": info["sector"],
            "risk_class": pred["risk_class"],
            "risk_score": round(score, 1),
            "requested_amount": exp["req"],
            "sanctioned_amount": exp["sanc"],
            "cibil_commercial_score": v.get("cibil_commercial_score", 0),
            "gst_mismatch_flag": {0: "LOW", 1: "MEDIUM", 2: "HIGH"}.get(v.get("gst_mismatch_score", 0), "LOW"),
            "external_litigation_risk_score": v.get("external_litigation_risk_score", 0),
            "dscr_proxy": ratio.get("dscr_proxy", 0),
            "interest_coverage_proxy": ratio.get("interest_coverage_proxy", 0)
        })
    return portfolio

@app.get("/portfolio/summary")
def get_portfolio_summary():
    """Returns aggregated high-level portfolio metrics."""
    companies = get_portfolio_companies()
    
    total_exposure = sum(c["sanctioned_amount"] for c in companies)
    risk_counts = {"low_risk": 0, "medium_risk": 0, "high_risk": 0}
    cibil_sum = 0
    high_gst_count = 0
    
    for c in companies:
        rc = c["risk_class"]
        if rc in risk_counts:
            risk_counts[rc] += 1
        cibil_sum += c["cibil_commercial_score"]
        if c["gst_mismatch_flag"] == "HIGH":
            high_gst_count += 1
            
    avg_cibil = round(cibil_sum / len(companies)) if companies else 0
            
    return {
        "total_exposure": total_exposure,
        "company_count": len(companies),
        "by_risk_class": risk_counts,
        "avg_cibil_score": avg_cibil,
        "high_gst_mismatch_count": high_gst_count
    }

@app.get("/companies/{company_id}/cam")
def get_cam(company_id: str):
    cid = company_id
    if company_id.startswith("APP_"):
        row = get_application(company_id)
        if not row: raise HTTPException(404)
        cid = row["company_id"]
    elif company_id not in COMPANIES:
        raise HTTPException(404)
        
    gen = CAMGenerator()
    cam_data = gen.generate_cam(cid)
    return {"company_id": company_id, "cam_markdown": cam_data["cam_markdown"]}

@app.get("/companies/{company_id}/export-pdf")
def export_cam_pdf(company_id: str):
    cid = company_id
    if company_id.startswith("APP_"):
        row = get_application(company_id)
        if not row: raise HTTPException(404)
        cid = row["company_id"]
        name = row["company_name"]
    elif company_id in COMPANIES:
        cid = company_id
        name = COMPANIES[company_id]["name"]
    else:
        raise HTTPException(404)
        
    gen = CAMGenerator()
    cam_data = gen.generate_cam(cid)
    markdown = cam_data["cam_markdown"]
    
    # Generate unique filename
    filename = f"CAM_{company_id}_{uuid.uuid4().hex[:6]}.pdf"
    temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp")
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    
    path = os.path.join(temp_dir, filename)
    generate_pdf_from_markdown(markdown, path)
    
    return FileResponse(
        path, 
        media_type="application/pdf", 
        filename=f"Credit_Memo_{name.replace(' ', '_')}.pdf"
    )

@app.get("/companies/{company_id}/documents")
def get_company_documents(company_id: str):
    import json
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))
    docs_path = os.path.join(base_dir, "data", "documents.json")
    
    if not os.path.exists(docs_path):
        return []
        
    with open(docs_path) as f:
        all_docs = json.load(f)
        
    # Use real CID if it's an app
    cid = company_id
    if company_id.startswith("APP_"):
        row = get_application(company_id)
        if row: cid = row["company_id"]

    return [d for d in all_docs if d["company_id"] == cid or d["company_id"] == company_id]

@app.get("/companies/{company_id}/document-extraction-demo")
def get_extraction_demo(company_id: str):
    import json
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))
    nlp_path = os.path.join(base_dir, "data", "raw", "nlp_extractions.json")
    with open(nlp_path) as f:
        data = json.load(f)
    
    # Use real CID if it's an app
    cid = company_id
    if company_id.startswith("APP_"):
        row = get_application(company_id)
        if row: cid = row["company_id"]

    # 1. Look for specific OCR demo match (Legacy Textiles etc)
    match = next((item for item in data if item["company_id"] == cid and "ocr_demo" in item), None)
    
    if match:
        risk_item = match["risk_items"][0] if match.get("risk_items") else None
        return {
            "company_id": company_id,
            "document": {
                "document_id": "DEMO_OCR",
                "filename": match["ocr_demo"]["source_doc"],
                "doc_type": "Legal Notice",
                "doc_quality": match["ocr_demo"]["doc_quality"],
                "page": match["ocr_demo"]["page"]
            },
            "ocr_snippet": match["ocr_demo"]["raw_ocr"],
            "clean_snippet": risk_item["snippet"] if risk_item else match["ocr_demo"]["ocr_snippet"],
            "risk_item": risk_item
        }

    # 2. Look for any NLP risk item for this company that isn't external
    match = next((item for item in data if item["company_id"] == cid and "external_meta" not in item), None)
    if match and match.get("risk_items"):
        risk_item = match["risk_items"][0]
        return {
            "company_id": company_id,
            "document": {
                "document_id": "DEMO_NLP",
                "filename": risk_item.get("source_doc", "Internal Document"),
                "doc_type": risk_item.get("risk_type", "Operational"),
                "doc_quality": "text",
                "page": risk_item.get("page", 1)
            },
            "ocr_snippet": "[OCR LAYER NOT ACTIVE FOR BORN-DIGITAL PDF]",
            "clean_snippet": risk_item["snippet"],
            "risk_item": risk_item
        }
    
    return {"no_extraction_demo_available": True}

@app.post("/companies/{company_id}/simulate")
def simulate(company_id: str, request: SimulationRequest):
    name, sector, cid = "", "", company_id
    if company_id.startswith("APP_"):
        row = get_application(company_id)
        if not row: raise HTTPException(404)
        name, sector, cid = row["company_name"], row["sector"], row["company_id"]
    elif company_id in COMPANIES:
        name, sector, cid = COMPANIES[company_id]["name"], COMPANIES[company_id]["sector"], company_id
    else:
        raise HTTPException(status_code=404, detail="ID not found")
        
    # Get full baseline
    baseline = _get_enriched_summary(cid, company_id, name, sector)
    # Get full simulated
    simulated = _get_enriched_summary(cid, company_id, name, sector, overrides=request.overrides)
    
    return {
        "company_id": company_id,
        "baseline":  baseline,
        "simulated": simulated,
        "delta": {"risk_class_change": f"{baseline['risk_class']} -> {simulated['risk_class']}"},
        "summary_text": f"Risk moved from {baseline['risk_class'].upper()} to {simulated['risk_class'].upper()}.",
    }


# ─── PORTFOLIO + ANALYTICS ────────────────────────────────────────────────────
@app.get("/portfolio/stats")
def get_portfolio_stats():
    import json
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))
    vectors_path = os.path.join(base_dir, "data", "raw", "integrated_feature_vectors.json")
    with open(vectors_path) as f:
        vectors = json.load(f)
        
    classes = ["low_risk", "medium_risk", "high_risk"]
    distribution = {"low_risk": 0, "medium_risk": 0, "high_risk": 0}
    total_revenue = 0
    sectors: Dict[str, int] = {}
    
    # 1. Process static vectors - Filtered by active COMPANIES
    for v in vectors:
        cid = v["company_id"]
        if cid in COMPANIES:
            rc = classes[v["risk_label"]]
            distribution[rc] += 1
            total_revenue += v.get("gst_avg_monthly_sales", 0) * 12
            sec = COMPANIES[cid]["sector"]
            sectors[sec] = sectors.get(sec, 0) + 1
            
    # 2. Add approved borrower applications
    db_apps = get_all_applications()
    approved_count = 0
    for app in db_apps:
        if app["status"] in ("approved", "accepted"):
            rc = app["ai_risk_class"] or "medium_risk"
            if rc in distribution:
                distribution[rc] += 1
            
            # Find the actual GST sales for this company from vectors
            cid = app["company_id"]
            feat = next((v for v in vectors if v["company_id"] == cid), {})
            total_revenue += feat.get("gst_avg_monthly_sales", 0) * 12
            
            sec = app["sector"] or "Other"
            sectors[sec] = sectors.get(sec, 0) + 1
            approved_count += 1

    return {
        "total_accounts": len(COMPANIES) + approved_count,
        "risk_distribution": [
            {"name": "Low Risk",    "value": distribution["low_risk"],    "color": "#10b981"},
            {"name": "Medium Risk", "value": distribution["medium_risk"], "color": "#f59e0b"},
            {"name": "High Risk",   "value": distribution["high_risk"],   "color": "#ef4444"},
        ],
        "total_portfolio_revenue": total_revenue,
        "sector_concentration": [{"name": k, "value": v} for k, v in sectors.items()],
    }

@app.get("/analytics/trends")
def get_analytics():
    import json
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))
    vectors_path = os.path.join(base_dir, "data", "raw", "integrated_feature_vectors.json")
    with open(vectors_path) as f:
        vectors = json.load(f)
    avg_growth  = sum(v.get("gst_growth_6m", 0) for v in vectors) / len(vectors)
    avg_bounces = sum(v.get("bank_emi_bounce_count", 0) for v in vectors) / len(vectors)
    return {
        "market_sentiment": "Positive",
        "avg_gst_growth":   round(avg_growth, 4),
        "avg_emi_bounces":  round(avg_bounces, 2),
        "growth_trend": [
            {"month": "Oct", "growth": 0.05}, {"month": "Nov", "growth": 0.08},
            {"month": "Dec", "growth": 0.12}, {"month": "Jan", "growth": 0.09},
            {"month": "Feb", "growth": 0.15}, {"month": "Mar", "growth": round(avg_growth, 4)},
        ],
        "risk_by_sector": [
            {"sector": "IT", "score": 85}, {"sector": "Retail", "score": 72},
            {"sector": "Mfg", "score": 45}, {"sector": "Agro", "score": 68},
        ],
    }

# ─── BORROWER PORTAL ──────────────────────────────────────────────────────────
@app.post("/borrower/applications")
async def create_borrower_application(
    company_name: str = Form(...),
    sector: str = Form(...),
    gstin: str = Form(...),
    requested_amount: float = Form(...),
    loan_purpose: str = Form(...),
    contact_email: str = Form(...),
    annual_report: Optional[UploadFile] = File(None),
    bank_statements: List[UploadFile] = File(None),
    legal_docs: List[UploadFile] = File(None)
):
    app_id = f"APP_{uuid.uuid4().hex[:8].upper()}"

    # Verify GSTIN and retrieve financial mapped ID (Twin Identity) from MASTER REGISTRY
    mapped_cid = None
    for cid, info in MASTER_REGISTRY.items():
        if info["gstin"] == gstin.strip().upper():
            mapped_cid = cid
            break

    if not mapped_cid:
        # User entered unknown data — Reject by design as "improper dataset"
        data = {
            "company_id": "UNKNOWN", "company_name": company_name,
            "sector": sector, "gstin": gstin, "requested_amount": requested_amount,
            "loan_purpose": loan_purpose, "contact_email": contact_email,
        }
        create_application(app_id, data)
        # officer_decide(app_id, "reject", "Auto-rejected: GSTIN not found in digital registry. Deep financial profile missing.", 0, 0)
        return {
            "application_id": app_id,
            "status": "rejected",
            "message": "We could not verify your deep financial profile for GSTIN " + gstin
        }

    # SUCCESS: Valid financial twin found
    data = {
        "company_id": mapped_cid, "company_name": company_name,
        "sector": sector, "gstin": gstin, "requested_amount": requested_amount,
        "loan_purpose": loan_purpose, "contact_email": contact_email,
    }
    create_application(app_id, data)

    # Scoring the twin profile
    try:
        prediction = predict_with_shap(mapped_cid)
        status, sanctioned, rate, summary = ai_pricing(prediction["risk_class"], requested_amount)
        update_ai_score(app_id, prediction["risk_class"], prediction["confidence"],
                        sanctioned, rate, summary)
        
        # Register documents in the virtual document store
        import json
        import os
        base_dir = os.path.dirname(os.path.abspath(__file__))
        docs_path = os.path.join(base_dir, "data", "documents.json")
        all_docs = []
        if os.path.exists(docs_path):
            with open(docs_path) as f: all_docs = json.load(f)
        
        def add_file(f, category):
            if not f or not f.filename: return
            all_docs.append({
                "company_id": app_id, 
                "document_id": f"DOC_{uuid.uuid4().hex[:6].upper()}",
                "filename": f.filename,
                "doc_type": category,
                "doc_quality": "text" if f.filename.lower().endswith(".pdf") else "scanned",
                "uploaded_at": datetime.utcnow().isoformat()
            })

        if annual_report: add_file(annual_report, "Annual Report")
        for f in bank_statements: add_file(f, "Bank Statement")
        for f in legal_docs: add_file(f, "Legal Notice")
        
        with open(docs_path, "w") as fw:
            json.dump(all_docs, fw, indent=2)

    except Exception as e:
        print(f"Scoring error: {e}")

    return {
        "application_id": app_id,
        "status": "under_review",
        "message": "Financial profile verified. AI scoring engine is processing your application. Documents uploaded will be visible to the Credit Officer.",
        "estimated_decision_time": "AI Decisioning Complete. Final review pending with Credit Officer."
    }

@app.get("/borrower/applications/{application_id}")
def get_borrower_status(application_id: str):
    row = get_application(application_id)
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")

    # Use officer decision if set, else fall back to AI score
    if row.get("officer_decision") in ("approve", "reject"):
        status = row["status"]
        sanctioned = row["final_sanctioned"] or row["ai_sanctioned_amount"] or 0
        rate = row["final_rate"] or row["ai_interest_rate"] or 0
        risk_class = row["ai_risk_class"] or "medium_risk"
        summary = row["officer_notes"] or row["ai_summary"] or "Your application is under review."
    else:
        status = row["status"]
        sanctioned = row["ai_sanctioned_amount"] or 0
        rate = row["ai_interest_rate"] or 0
        risk_class = row["ai_risk_class"] or "medium_risk"
        summary = row["ai_summary"] or "Your application is being processed by our AI engine."

    return {
        "application_id": application_id,
        "company_name": row["company_name"],
        "status": status,
        "requested_amount": row["requested_amount"],
        "sanctioned_amount": sanctioned,
        "indicative_interest_rate": rate,
        "risk_class": risk_class,
        "summary_for_borrower": summary,
        "officer_notes": row.get("officer_notes", ""),
        "created_at": row["created_at"],
    }

@app.post("/borrower/applications/{application_id}/accept")
def borrower_accept_offer(application_id: str):
    row = get_application(application_id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    borrower_accept(application_id)
    return {"message": "Offer accepted. Digital signing links sent to your email."}

@app.post("/borrower/applications/{application_id}/review-requested")
def borrower_request_review(application_id: str):
    row = get_application(application_id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    borrower_review_request(application_id)
    return {"message": "Review requested. A credit officer will contact you within 24 hours."}

# ─── OFFICER PORTAL — Application Management ──────────────────────────────────
@app.get("/officer/applications")
def list_officer_applications(status: Optional[str] = None):
    """Officer sees all borrower-submitted applications with AI scores."""
    rows = get_all_applications(status_filter=status)
    results = []
    for r in rows:
        results.append({
            "application_id": r["application_id"],
            "company_name":   r["company_name"],
            "sector":         r["sector"],
            "gstin":          r["gstin"],
            "requested_amount": r["requested_amount"],
            "loan_purpose":   r["loan_purpose"],
            "contact_email":  r["contact_email"],
            "ai_risk_class":  r["ai_risk_class"] or "pending",
            "ai_confidence":  r["ai_confidence"] or 0,
            "ai_sanctioned_amount": r["ai_sanctioned_amount"] or 0,
            "ai_interest_rate": r["ai_interest_rate"] or 0,
            "ai_summary":     r["ai_summary"] or "",
            "status":         r["status"],
            "officer_decision": r["officer_decision"] or "",
            "officer_notes":  r["officer_notes"] or "",
            "final_sanctioned": r["final_sanctioned"] or 0,
            "final_rate":     r["final_rate"] or 0,
            "created_at":     r["created_at"],
            "updated_at":     r["updated_at"],
        })
    return results

@app.post("/officer/applications/{application_id}/decide")
def officer_make_decision(application_id: str, body: OfficerDecisionRequest):
    """Officer approves/rejects with custom terms."""
    row = get_application(application_id)
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")

    final_sanctioned = body.final_sanctioned or row.get("ai_sanctioned_amount", 0)
    final_rate = body.final_rate or row.get("ai_interest_rate", 0)

    officer_decide(application_id, body.decision, body.notes, final_sanctioned, final_rate)
    return {
        "application_id": application_id,
        "decision": body.decision,
        "final_sanctioned": final_sanctioned,
        "final_rate": final_rate,
        "message": f"Decision '{body.decision}' recorded successfully.",
    }

@app.get("/debug/registry")
def debug_registry():
    return {
        "loaded": len(MASTER_REGISTRY) > 0,
        "count": len(MASTER_REGISTRY),
        "first_5_keys": list(MASTER_REGISTRY.keys())[:5],
        "registry_path": str(REGISTRY_PATH) if 'REGISTRY_PATH' in globals() else "NOT DEFINED"
    }

# ─── SERVE FRONTEND ───────────────────────────────────────────────────────────
# Path to the frontend dist folder
frontend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")

if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
    
    @app.exception_handler(404)
    async def not_found_exception_handler(request, exc):
        # Catch 404s and return index.html (SPA routing)
        return FileResponse(os.path.join(frontend_path, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

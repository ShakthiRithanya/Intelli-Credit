
import sys
import os
import uuid
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
from backend.db import COMPANIES, MASTER_REGISTRY
from backend.database import (
    init_db, create_application, update_ai_score, get_application,
    get_all_applications, officer_decide, borrower_accept, borrower_review_request
)

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
@app.get("/")
def read_root():
    return {"message": "Intelli-Credit API is running"}

@app.get("/companies")
def get_companies():
    """Returns the unified list of existing portfolio companies + approved borrower applications."""
    results = []
    
    # 1. Add static enterprise portfolio
    for cid, info in COMPANIES.items():
        pred = predict_with_shap(cid)
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

    five_c = {
        "character":  clamp(0.5 + mgmt_qual * 0.1 + pos_flags * 0.05 - litigation * 0.15),
        "capacity":   clamp(0.4 + gst_growth * 1.5 + itr_margin * 0.5),
        "capital":    clamp(0.55 - litigation * 0.1 - emi_bounce * 0.1),
        "collateral": clamp(0.5 + gst_growth * 0.5),
        "conditions": clamp(0.6 + gst_growth * 0.4 - emi_bounce * 0.05),
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
        raise HTTPException(status_code=404, detail="ID not found")

    return _get_enriched_summary(cid, company_id, name, sector)

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
    files: List[UploadFile] = File(None)
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
        officer_decide(app_id, "reject", "Auto-rejected: GSTIN not found in digital registry. Deep financial profile missing.", 0, 0)
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
    except Exception as e:
        print(f"Scoring error: {e}")

    return {
        "application_id": app_id,
        "status": "under_review",
        "message": "Financial profile verified. AI scoring engine is processing your application."
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

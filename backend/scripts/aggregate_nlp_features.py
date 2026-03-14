import json
from collections import defaultdict

def aggregate_nlp_features():
    # 1. Load Extracted Risks
    with open("d:/bank/backend/data/raw/nlp_extractions.json", "r") as f:
        nlp_data = json.load(f)

    # 2. Load Existing Numeric Features
    with open("d:/bank/backend/data/raw/feature_vectors.json", "r") as f:
        feature_vectors = json.load(f)

    # Risk Severity Mapping
    severity_map = {"high": 3, "medium": 2, "low": 1}

    # Aggregate NLP scores per company
    comp_nlp_scores = defaultdict(lambda: {
        "litigation_risk_score": 0,
        "management_quality_score": 0,
        "sector_risk_score": 0,
        "positive_flags_count": 0,
        "external_litigation_risk_score": 0,
        "external_governance_risk_score": 0,
        "external_headwind_score": 0
    })

    for entry in nlp_data:
        cid = entry["company_id"]
        for item in entry["risk_items"]:
            rtype = item["risk_type"]
            sev = item["severity"]
            category = item.get("source_category", "internal")
            
            # Map score
            score = severity_map.get(sev.lower(), 0)
            
            if category == "internal":
                if rtype == "litigation":
                    comp_nlp_scores[cid]["litigation_risk_score"] = max(comp_nlp_scores[cid]["litigation_risk_score"], score)
                elif rtype == "management_quality":
                    comp_nlp_scores[cid]["management_quality_score"] = max(comp_nlp_scores[cid]["management_quality_score"], score)
                elif rtype == "sector_headwinds":
                    comp_nlp_scores[cid]["sector_risk_score"] = max(comp_nlp_scores[cid]["sector_risk_score"], score)
            else:
                # External Category
                if rtype == "litigation":
                    comp_nlp_scores[cid]["external_litigation_risk_score"] = max(comp_nlp_scores[cid]["external_litigation_risk_score"], score)
                elif rtype == "management_quality":
                    comp_nlp_scores[cid]["external_governance_risk_score"] = max(comp_nlp_scores[cid]["external_governance_risk_score"], score)
                elif rtype == "sector_headwinds":
                    comp_nlp_scores[cid]["external_headwind_score"] = max(comp_nlp_scores[cid]["external_headwind_score"], score)

            # Handle positive signals
            if sev == "low" and category == "internal":
                comp_nlp_scores[cid]["positive_flags_count"] += 1

    # 3. Merge with the original feature vector
    updated_vectors = []
    for f in feature_vectors:
        cid = f["company_id"]
        nlp = comp_nlp_scores[cid]
        
        # Calculate GST Mismatch Features
        g2a = f.get("gstr_2a_itc_amount", 0)
        g3b = f.get("gstr_3b_itc_claimed", 0)
        itc_gap = g3b - g2a
        itc_gap_ratio = itc_gap / max(g2a, 1e-6)
        
        mismatch_score = 0 # LOW
        if itc_gap_ratio > 0.20:
            mismatch_score = 2 # HIGH
        elif itc_gap_ratio > 0.05:
            mismatch_score = 1 # MEDIUM
            
        # Merge dictionaries
        updated_f = {**f, **nlp, "gst_mismatch_score": mismatch_score}
        updated_vectors.append(updated_f)

    # 4. Save Final Integrated Vector
    with open("d:/bank/backend/data/raw/integrated_feature_vectors.json", "w") as f:
        json.dump(updated_vectors, f, indent=4)

    print(f"Successfully aggregated NLP and Indian Context features into integrated_feature_vectors.json for {len(updated_vectors)} companies.")

if __name__ == "__main__":
    aggregate_nlp_features()

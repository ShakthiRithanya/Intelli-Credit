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
        "positive_flags_count": 0
    })

    for entry in nlp_data:
        cid = entry["company_id"]
        for item in entry["risk_items"]:
            rtype = item["risk_type"]
            sev = item["severity"]
            
            # Map score
            score = severity_map.get(sev.lower(), 0)
            
            if rtype == "litigation":
                comp_nlp_scores[cid]["litigation_risk_score"] = max(comp_nlp_scores[cid]["litigation_risk_score"], score)
            elif rtype == "management_quality":
                comp_nlp_scores[cid]["management_quality_score"] = max(comp_nlp_scores[cid]["management_quality_score"], score)
            elif rtype == "sector_headwinds":
                 comp_nlp_scores[cid]["sector_risk_score"] = max(comp_nlp_scores[cid]["sector_risk_score"], score)
            
            # Handle positive signals (e.g., if severity is low or there is a specific 'positive' flag)
            # For simplicity, if we find a 'low' risk item in a key category, increment positive flag
            if sev == "low":
                comp_nlp_scores[cid]["positive_flags_count"] += 1

    # 3. Merge with the original feature vector
    updated_vectors = []
    for f in feature_vectors:
        cid = f["company_id"]
        nlp = comp_nlp_scores[cid]
        
        # Merge dictionaries
        updated_f = {**f, **nlp}
        updated_vectors.append(updated_f)

    # 4. Save Final Integrated Vector
    with open("d:/bank/backend/data/raw/integrated_feature_vectors.json", "w") as f:
        json.dump(updated_vectors, f, indent=4)

    print(f"Successfully aggregated NLP features into integrated_feature_vectors.json for {len(updated_vectors)} companies.")

if __name__ == "__main__":
    aggregate_nlp_features()

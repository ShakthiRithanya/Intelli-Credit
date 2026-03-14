import json
import random
import os

def generate_govt_registry(count=1000):
    sectors = ["Information Technology", "Agro-processing", "Retail", "Construction", "Manufacturing", "Logistics", "Healthcare", "Education", "Chemicals", "Automotive"]
    risk_profiles = ["Strong", "Borderline", "High Risk"]
    
    registry = {}
    vectors = []
    
    # Generate 1000 companies
    for i in range(1, count + 1):
        cid = f"CID_{i:03d}"
        sector = random.choice(sectors)
        risk = random.choice(risk_profiles)
        
        # Realistic Name generation
        prefixes = ["Global", "Modern", "Classic", "Universal", "Apex", "Zenith", "Eco", "Swift", "Core", "Alpha"]
        middles = ["Tech", "Retail", "Solutions", "Dynamics", "Systems", "Enterprises", "Industries", "Logistics", "Agri", "Constro"]
        suffixes = ["Ltd", "Pvt Ltd", "Corp", "Group", "India", "Services"]
        
        name = f"{random.choice(prefixes)} {random.choice(middles)} {random.choice(suffixes)}"
        
        # Unique GSTIN (15 chars)
        # Format: 27[5 chars][4 digits][1 char][Z][1 digit/char]
        gstin = f"27{''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=5))}{random.randint(1000, 9999)}{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}Z{random.choice('123456789')}"
        
        registry[cid] = {
            "name": name,
            "sector": sector,
            "gstin": gstin,
            "risk_profile": risk
        }
        
        # Generate Feature Vector based on risk
        if risk == "Strong":
            sales = random.uniform(5000000, 15000000)
            growth = random.uniform(0.05, 0.25)
            margin = random.uniform(0.10, 0.20)
            leverage = random.uniform(1.0, 1.5)
            bounces = random.randint(0, 1)
            litigation = random.randint(0, 1)
            mgmt = 1 # Good
            sector_risk = 0 # Low
            pos_flags = random.randint(2, 5)
            label = 0 # low_risk
        elif risk == "Borderline":
            sales = random.uniform(2000000, 5000000)
            growth = random.uniform(-0.05, 0.05)
            margin = random.uniform(0.03, 0.08)
            leverage = random.uniform(1.5, 2.5)
            bounces = random.randint(1, 3)
            litigation = random.randint(1, 2)
            mgmt = 0.5 # Med
            sector_risk = 1 # Med
            pos_flags = random.randint(0, 2)
            label = 1 # medium_risk
        else: # High Risk
            sales = random.uniform(500000, 2000000)
            growth = random.uniform(-0.30, -0.05)
            margin = random.uniform(-0.05, 0.02)
            leverage = random.uniform(2.5, 5.0)
            bounces = random.randint(3, 8)
            litigation = random.randint(2, 3)
            mgmt = 0 # Poor
            sector_risk = 2 # High
            pos_flags = 0
            label = 2 # high_risk

        vectors.append({
            "company_id": cid,
            "gst_avg_monthly_sales": round(sales, 2),
            "gst_growth_6m": round(growth, 4),
            "itr_profit_margin": round(margin, 4),
            "itr_leverage_proxy": round(leverage, 2),
            "bank_emi_bounce_count": bounces,
            "bank_avg_balance": round(sales * 0.15, 2),
            "risk_label": label,
            "litigation_risk_score": litigation,
            "management_quality_score": mgmt,
            "sector_risk_score": sector_risk,
            "positive_flags_count": pos_flags,
            "external_litigation_risk_score": random.randint(0, 3) if risk == "High Risk" else 0,
            "external_governance_risk_score": random.randint(0, 2) if risk == "High Risk" else 0,
            "external_headwind_score": random.randint(0, 2) if risk == "High Risk" else 0,
            "gst_mismatch_score": random.randint(0, 2) if risk != "Strong" else 0,
            "cibil_commercial_score": random.randint(750, 850) if risk == "Strong" else random.randint(550, 750),
            "interest_coverage_proxy": round(random.uniform(3, 8), 2) if risk == "Strong" else round(random.uniform(0.5, 3), 2),
            "dscr_proxy": round(random.uniform(1.8, 3), 2) if risk == "Strong" else round(random.uniform(0.8, 1.8), 2)
        })
        
    # Ensure specific test IDs are STABLE for the user
    test_cids = {
        "CID_001": {"name": "Alpha Industries Group", "sector": "Healthcare", "gstin": "27XAKKE2568NZ4", "risk_profile": "Strong"},
        "CID_002": {"name": "Eco Solutions Group", "sector": "Manufacturing", "gstin": "27ZEMWU3588IZ6", "risk_profile": "Borderline"},
        "CID_007": {"name": "Universal Tech Services", "sector": "Manufacturing", "gstin": "27KWCMS9215DZ5", "risk_profile": "High Risk"}
    }
    
    for cid, info in test_cids.items():
        registry[cid] = info
        risk = info["risk_profile"]
        label = 0 if risk == "Strong" else (1 if risk == "Borderline" else 2)
        
        # Stability: Update or append the vector for these specific IDs
        found = False
        for v in vectors:
            if v["company_id"] == cid:
                v.update({
                    "gst_avg_monthly_sales": 10000000 if label == 0 else (4000000 if label == 1 else 1000000),
                    "gst_growth_6m": 0.15 if label == 0 else (0.02 if label == 1 else -0.1),
                    "itr_profit_margin": 0.15 if label == 0 else (0.05 if label == 1 else 0.01),
                    "risk_label": label,
                    "cibil_commercial_score": 820 if label == 0 else (680 if label == 1 else 580),
                    "interest_coverage_proxy": 4.5 if label == 0 else (2.5 if label == 1 else 1.1),
                    "dscr_proxy": 2.2 if label == 0 else (1.4 if label == 1 else 1.05)
                })
                found = True
                break
    
    # Generate simple financial ratios for all 1000
    ratios_list = []
    nlp_list = []
    
    for i in range(1, count + 1):
        cid = f"CID_{i:03d}"
        # Match data from vectors for Ratios
        feat = next((v for v in vectors if v["company_id"] == cid), {})
        sales = feat.get("gst_avg_monthly_sales", 1000000) * 12
        margin = feat.get("itr_profit_margin", 0.1)
        
        ratios_list.append({
            "company_id": cid,
            "ratios": [
                {
                    "year": "2023-24",
                    "revenue": round(sales, 2),
                    "ebit_margin": round(margin + 0.02, 4),
                    "pat_margin": round(margin, 4),
                    "debt_to_equity_proxy": round(feat.get("itr_leverage_proxy", 1.5), 2),
                    "interest_coverage_proxy": 4.5 if feat.get("risk_label") == 0 else (1.5 if feat.get("risk_label") == 2 else 2.5),
                    "dscr_proxy": 2.2 if feat.get("risk_label") == 0 else (1.1 if feat.get("risk_label") == 2 else 1.4),
                    "overall_flag": "OK" if feat.get("risk_label") == 0 else ("RED" if feat.get("risk_label") == 2 else "WATCH")
                }
            ]
        })
        
        # Simple NLP extraction placeholder
        nlp_list.append({
            "company_id": cid,
            "risk_items": [
                {
                    "snippet": f"Verified digital footprint for {registry[cid]['name']} indicates stable operations in the {registry[cid]['sector']} sector.",
                    "risk_type": "Neutral",
                    "sentiment": "Positive" if feat.get("risk_label") == 0 else "Neutral",
                    "page": 1
                }
            ]
        })

    # Save all files
    os.makedirs("d:/bank/backend/data/raw", exist_ok=True)
    
    with open("d:/bank/backend/data/govt_registry.json", "w") as f:
        json.dump(registry, f, indent=4)
        
    with open("d:/bank/backend/data/raw/integrated_feature_vectors.json", "w") as f:
        json.dump(vectors, f, indent=4)
        
    with open("d:/bank/backend/data/raw/financial_ratios.json", "w") as f:
        json.dump(ratios_list, f, indent=4)
        
    with open("d:/bank/backend/data/raw/nlp_extractions.json", "w") as f:
        json.dump(nlp_list, f, indent=4)
        
    print(f"Successfully generated Govt Registry, Vectors, Ratios, and NLP for {count} companies.")

if __name__ == "__main__":
    generate_govt_registry(1000)

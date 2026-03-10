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
        cid = f"CID_{i:04d}"
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
            "positive_flags_count": pos_flags
        })
        
    # Ensure our original CID_001 to CID_006 are in there with their specific GSTINs for testing
    # IT Services
    registry["CID_001"] = {"name": "Global Tech Solns", "sector": "Information Technology", "gstin": "27GTSSO0001A1Z1", "risk_profile": "Strong"}
    # ... we'll just overwrite the first 6 for consistency if needed, but let's keep them as a block
    
    test_cids = {
        "CID_001": {"name": "Global Tech Solns", "sector": "Information Technology", "gstin": "27GTSSO0001A1Z1"},
        "CID_002": {"name": "Green Agri Exports", "sector": "Agro-processing", "gstin": "27GAEXP0002B1Z2"},
        "CID_003": {"name": "Modern Retailers Ltd", "sector": "Retail", "gstin": "27MODRT0003C1Z3"},
        "CID_004": {"name": "City Constro Works", "sector": "Construction", "gstin": "27CCWOR0004D1Z4"},
        "CID_005": {"name": "Legacy Textiles", "sector": "Manufacturing", "gstin": "27LEGTE0005E1Z5"},
        "CID_006": {"name": "Aqua Marine Logistics", "sector": "Logistics", "gstin": "27AMLOG0006F1Z6"}
    }
    
    for cid, info in test_cids.items():
        if cid in registry:
            registry[cid].update(info)
    
    # Save files
    os.makedirs("d:/bank/backend/data/raw", exist_ok=True)
    
    with open("d:/bank/backend/data/govt_registry.json", "w") as f:
        json.dump(registry, f, indent=4)
        
    with open("d:/bank/backend/data/raw/integrated_feature_vectors.json", "w") as f:
        json.dump(vectors, f, indent=4)
        
    print(f"Successfully generated Govt Registry with {count} companies and integrated vectors.")

if __name__ == "__main__":
    generate_govt_registry(1000)

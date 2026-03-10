import json
from collections import defaultdict

def calculate_features():
    with open("d:/bank/backend/data/raw/gst_filings.json", "r") as f:
        gst_data = json.load(f)
    with open("d:/bank/backend/data/raw/itr_summaries.json", "r") as f:
        itr_data = json.load(f)
    with open("d:/bank/backend/data/raw/bank_transactions.json", "r") as f:
        bank_data = json.load(f)

    # Group data by company_id
    comp_gst = defaultdict(list)
    for g in gst_data:
        comp_gst[g["company_id"]].append(g)

    comp_itr = defaultdict(list)
    for i in itr_data:
        comp_itr[i["company_id"]].append(i)

    comp_bank = defaultdict(list)
    for b in bank_data:
        comp_bank[b["company_id"]].append(b)

    feature_vectors = []
    
    for cid in comp_gst.keys():
        # 1. GST Features
        gst_sorted = sorted(comp_gst[cid], key=lambda x: x["month"])
        total_gst_rev = sum([g["taxable_value"] for g in gst_sorted])
        avg_monthly_sales = total_gst_rev / 12
        
        # 6m Growth (Last 3m vs Previous 3m)
        curr_3m = sum([g["taxable_value"] for g in gst_sorted[-3:]])
        prev_3m = sum([g["taxable_value"] for g in gst_sorted[-6:-3]])
        gst_growth_6m = (curr_3m / prev_3m) - 1 if prev_3m > 0 else 0

        # 2. ITR Features (Latest Year)
        latest_itr = sorted(comp_itr[cid], key=lambda x: x["assessment_year"])[-1]
        profit_margin = latest_itr["profit_after_tax"] / latest_itr["total_income"] if latest_itr["total_income"] > 0 else 0
        leverage = (latest_itr["total_income"] * 0.5) / latest_itr["net_worth"] if latest_itr["net_worth"] > 0 else 0

        # 3. Bank Features
        bounces = [b for b in comp_bank[cid] if "RTN" in b["description"] or "BOUNCE" in b["description"]]
        bounce_count = len(bounces)
        avg_bank_balance = sum([b["balance"] for b in comp_bank[cid]]) / len(comp_bank[cid])

        # Target Label (Synthetic - for training purposes)
        if cid in ["CID_001", "CID_002"]:
            risk_label = 0 # Low Risk
        elif cid in ["CID_003", "CID_004"]:
            risk_label = 1 # Medium Risk
        else:
            risk_label = 2 # High Risk

        # Composite Vector
        feature_vectors.append({
            "company_id": cid,
            "gst_avg_monthly_sales": round(avg_monthly_sales, 2),
            "gst_growth_6m": round(gst_growth_6m, 4),
            "itr_profit_margin": round(profit_margin, 4),
            "itr_leverage_proxy": round(leverage, 4),
            "bank_emi_bounce_count": bounce_count,
            "bank_avg_balance": round(avg_bank_balance, 2),
            "risk_label": risk_label
        })

    with open("d:/bank/backend/data/raw/feature_vectors.json", "w") as f:
        json.dump(feature_vectors, f, indent=4)

    print("Successfully processed features and labels for 6 companies.")

if __name__ == "__main__":
    calculate_features()

import json
import random
from datetime import datetime, timedelta

def generate_synthetic_data():
    companies = [
        {"id": "CID_001", "name": "Global Tech Solns", "risk": "Strong"},
        {"id": "CID_002", "name": "Green Agri Exports", "risk": "Strong"},
        {"id": "CID_003", "name": "Modern Retailers Ltd", "risk": "Borderline"},
        {"id": "CID_004", "name": "City Constro Works", "risk": "Borderline"},
        {"id": "CID_005", "name": "Legacy Textiles", "risk": "High Risk"},
        {"id": "CID_006", "name": "Aqua Marine Logistics", "risk": "High Risk"}
    ]

    gst_data = []
    itr_data = []
    bank_data = []

    for comp in companies:
        cid = comp["id"]
        risk = comp["risk"]
        
        # Base values per risk profile
        if risk == "Strong":
            base_monthly_sales = random.uniform(5000000, 8000000) # 50-80L
            growth_trend = 1.05 # 5% growth month-on-month
            pat_margin = 0.15 # 15% profit
            bounce_prob = 0.01
        elif risk == "Borderline":
            base_monthly_sales = random.uniform(2000000, 4000000) # 20-40L
            growth_trend = 1.0 # stagnant
            pat_margin = 0.05
            bounce_prob = 0.05
        else: # High Risk
            base_monthly_sales = random.uniform(1000000, 2000000) # 10-20L
            growth_trend = 0.95 # declining
            pat_margin = 0.01
            bounce_prob = 0.20

        # GST Filings (12 months)
        gstin = f"27AAAAA{cid[4:8]}1Z5"
        current_sales = base_monthly_sales
        for i in range(12):
            month_date = datetime(2025, 2, 1) - timedelta(days=30 * (11 - i))
            month_str = month_date.strftime("%Y-%m")
            taxable = round(current_sales * random.uniform(0.9, 1.1), 2)
            tax = round(taxable * 0.18, 2)
            gst_data.append({
                "company_id": cid,
                "gstin": gstin,
                "month": month_str,
                "taxable_value": taxable,
                "tax_paid": tax
            })
            current_sales *= growth_trend

        # ITR Summaries (Last 2 years)
        total_annual_rev = sum([g["taxable_value"] for g in gst_data if g["company_id"] == cid])
        for ay in ["2023-24", "2024-25"]:
            income = round(total_annual_rev * random.uniform(0.95, 1.05))
            pat = round(income * pat_margin * random.uniform(0.8, 1.2))
            deprec = round(income * 0.03)
            net_worth = round(income * 0.4 * random.uniform(0.8, 1.2))
            itr_data.append({
                "company_id": cid,
                "assessment_year": ay,
                "total_income": float(income),
                "profit_after_tax": float(pat),
                "depreciation": float(deprec),
                "net_worth": float(net_worth)
            })

        # Bank Transactions (Last 30 days)
        balance = base_monthly_sales * 0.2 # 20% of monthly sales as opening
        for i in range(30):
            date = (datetime(2025, 2, 28) - timedelta(days=(29 - i))).strftime("%Y-%m-%d")
            
            # Daily Credit (Revenue)
            if i % 7 == 0: # Weekly bulk payments
                credit = round(base_monthly_sales / 4 * random.uniform(0.8, 1.2), 2)
                desc = "NEFT INW: CUSTOMER PMT"
                ctype = "CUSTOMER"
                balance += credit
                bank_data.append({"company_id": cid, "date": date, "description": desc, "credit": credit, "debit": 0, "balance": round(balance, 2), "counterparty_type": ctype})

            # Daily Debits
            if random.random() < bounce_prob:
                debit = 500.0
                desc = "CHQ RTN: INSUFFICIENT FUNDS"
                ctype = "LOAN_EMI"
                balance -= debit
                bank_data.append({"company_id": cid, "date": date, "description": desc, "credit": 0, "debit": debit, "balance": round(balance, 2), "counterparty_type": ctype})
            
            debit = round(base_monthly_sales / 30 * random.uniform(0.2, 0.8), 2)
            balance -= debit
            bank_data.append({"company_id": cid, "date": date, "description": "VENDOR PAYOUT", "credit": 0, "debit": debit, "balance": round(balance, 2), "counterparty_type": "VENDOR"})

    with open("d:/bank/backend/data/raw/gst_filings.json", "w") as f:
        json.dump(gst_data, f, indent=4)
    with open("d:/bank/backend/data/raw/itr_summaries.json", "w") as f:
        json.dump(itr_data, f, indent=4)
    with open("d:/bank/backend/data/raw/bank_transactions.json", "w") as f:
        json.dump(bank_data, f, indent=4)

    print("Successfully generated 12 months of GST, 2 years of ITR, and 30 days of Bank data for 6 companies.")

if __name__ == "__main__":
    generate_synthetic_data()

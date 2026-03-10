import json
import os
from backend.scripts.predict_with_explanations import predict_with_shap

class CAMGenerator:
    """Orchestrates the synthesis of financial data and risk scores into a professional CAM."""
    
    CAM_PROMPT_TEMPLATE = """
    # ROLE
    You are a Senior Credit Officer at a top Indian corporate bank. 
    Your task is to generate a professional Credit Appraisal Memo (CAM) based on the provided data.
    
    # DATA INPUT
    - Company: {company_name} (ID: {company_id})
    - Sector: {sector}
    - Risk Prediction: {risk_class} (Confidence: {confidence})
    - Top Risk Drivers (SHAP): {drivers}
    - Numeric Metrics: {metrics}
    - NLP Risk Snippets: {snippets}
    
    # REPORT STRUCTURE (The Five Cs of Credit)
    1. **Character**: Assess management quality, litigation, and governance. Refer to snippets.
    2. **Capacity**: Analyze cash flows, GST growth trends, and repayment behavior (EMI bounces).
    3. **Capital**: Discuss leverage and net worth based on ITR.
    4. **Collateral**: Note that primary security is usually property/receivables (details not provided).
    5. **Conditions**: Evaluate industry headwinds and macro outlook.
    
    # OUTPUT FORMAT
    - Use professional Markdown.
    - Start with a high-level summary.
    - End with a clear Decision: Risk Class, Suggested Limit, and Risk-Based Pricing.
    - Keep it concise, analytical, and objective.
    
    GENERATE MEMO:
    """

    def __init__(self):
        # In a real integration, initialize an LLM client (e.g., VertexAI / Gemini)
        pass

    def get_company_name(self, company_id):
        # Synthetic mapping for hackathon
        mapping = {
            "CID_001": "Global Tech Solns",
            "CID_002": "Green Agri Exports",
            "CID_003": "Modern Retailers Ltd",
            "CID_004": "City Constro Works",
            "CID_005": "Legacy Textiles",
            "CID_006": "Aqua Marine Logistics"
        }
        return mapping.get(company_id, "Unknown Entity")

    def get_nlp_snippets(self, company_id):
        try:
            with open("d:/bank/backend/data/raw/nlp_extractions.json", "r") as f:
                nlp_data = json.load(f)
            for entry in nlp_data:
                if entry["company_id"] == company_id:
                    return [f"[{item['risk_type'].upper()}] {item['snippet']}" for item in entry["risk_items"]]
        except:
            return []
        return []

    def generate_cam(self, company_id):
        # 1. Get Hybrid Predictions & SHAP
        prediction = predict_with_shap(company_id, use_hybrid=True)
        if "error" in prediction:
            return prediction

        # 2. Prepare Context
        name = self.get_company_name(company_id)
        snippets = self.get_nlp_snippets(company_id)
        
        # Format metrics and drivers for prompt
        drivers_str = ", ".join([f"{d['feature']} ({round(d['impact'], 2)})" for d in prediction["explanation"]["top_drivers_for_class"]])
        
        # Real-world flow: Call LLM API (e.g. Gemini)
        # For this hackathon step, we provide a sophisticated template-led mock 
        # that mimics LLM synthesis behavior.
        
        risk_class = prediction["risk_class"]
        
        # Mocking the "LLM Synthesis" for the vertical slice
        cam_markdown = f"""
# Credit Appraisal Memo – {name}
**Date:** March 2026 | **Company ID:** {company_id} | **Rating:** {risk_class.upper()}

## Executive Summary
{name} has been evaluated as **{risk_class.upper()}**. The assessment is driven by a combination of {prediction['explanation']['top_drivers_for_class'][0]['feature']} and qualitative signals regarding { 'legal standing' if risk_class == 'high_risk' else 'management stability'}. 

## 1. Character
Based on NLP extractions from annual reports and legal databases:
- **Governance:** {'Auditors have raised concerns regarding governance' if risk_class == 'high_risk' else 'Strong leadership profile with consistent auditor clearance.'}
- **Litigation:** {snippets[0] if snippets else 'No record of material litigation found.'}

## 2. Capacity
- **GST Performance:** Average monthly sales of INR {prediction['explanation']['top_drivers_for_class'][0]['value'] if 'sales' in prediction['explanation']['top_drivers_for_class'][0]['feature'] else 'stable'}.
- **Cash Flow:** {'High volatility observed in bank balances with multiple EMI bounces.' if risk_class == 'high_risk' else 'Smooth credit/debit cycles matched with consistent GST filings.'}

## 3. Capital
- **Leverage:** Debt-to-Equity proxy suggests {'high leveraging' if risk_class == 'high_risk' else 'conservative borrowing'} relative to industry peers.

## 4. Collateral
- Standard floating charge on current assets and receivables. {'Higher margin requirements recommended due to risk profile.' if risk_class == 'high_risk' else 'Standard LTV applied.'}

## 5. Conditions
- **Sector Outlook:** { 'Exposure to sector headwinds and NCLT disputes creates a cautious outlook.' if risk_class == 'high_risk' else 'Stable growth in the current macro environment.'}

---

## Final Credit Decision
- **Final Risk Class:** {risk_class.upper()}
- **Suggested Loan Limit:** {'Not Recommended' if risk_class == 'high_risk' else 'INR 15 Cr - 25 Cr'}
- **Risk-Based Pricing:** {'NA (High Risk)' if risk_class == 'high_risk' else 'REPO + 350 bps'}
- **Covenants:** {'Immediate cleanup of NCLT dues required.' if risk_class == 'high_risk' else 'Quarterly bank statement submission.'}
"""
        
        return {
            "company_id": company_id,
            "risk_class": risk_class,
            "cam_markdown": cam_markdown.strip(),
            "used_features": prediction["explanation"],
            "used_snippets": snippets
        }

if __name__ == "__main__":
    gen = CAMGenerator()
    # Test Low Risk
    print("-" * 50)
    print("CAM FOR LOW RISK COMPANY (CID_001):")
    res1 = gen.generate_cam("CID_001")
    print(res1["cam_markdown"])
    
    print("\n" + "=" * 50 + "\n")
    
    # Test High Risk
    print("CAM FOR HIGH RISK COMPANY (CID_005):")
    res2 = gen.generate_cam("CID_005")
    print(res2["cam_markdown"])

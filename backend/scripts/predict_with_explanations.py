import json
import pandas as pd
import pickle
import shap
import os

def load_model_and_data(use_hybrid=True):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if use_hybrid:
        model_path = os.path.join(base_dir, "models", "risk_model_hybrid.pkl")
        metadata_path = os.path.join(base_dir, "models", "metadata_hybrid.json")
        features_path = os.path.join(base_dir, "data", "raw", "integrated_feature_vectors.json")
    else:
        model_path = os.path.join(base_dir, "models", "risk_model.pkl")
        metadata_path = os.path.join(base_dir, "models", "metadata.json")
        features_path = os.path.join(base_dir, "data", "raw", "feature_vectors.json")
    
    with open(model_path, "rb") as f:
        model = pickle.load(f)
    with open(metadata_path, "r") as f:
        metadata = json.load(f)
    with open(features_path, "r") as f:
        data = json.load(f)
        
    df = pd.DataFrame(data)
    return model, metadata, df

def predict_with_shap(company_id, use_hybrid=True):
    model, metadata, df = load_model_and_data(use_hybrid=use_hybrid)
    
    # Get features for the specific company
    comp_row = df[df["company_id"] == company_id]
    if comp_row.empty:
        return {"error": f"Company {company_id} not found."}
    
    X_single = comp_row.drop(columns=["company_id", "risk_label"])
    
    # Original features: The model expects exactly these 10 in this order
    original_feature_names = [
        "gst_avg_monthly_sales", "gst_growth_6m", "itr_profit_margin", 
        "itr_leverage_proxy", "bank_emi_bounce_count", "bank_avg_balance",
        "litigation_risk_score", "management_quality_score", "sector_risk_score", "positive_flags_count"
    ]
    X_for_model = X_single[original_feature_names]
    
    # Prediction
    pred_prob = model.predict_proba(X_for_model)[0]
    pred_class_idx = int(model.predict(X_for_model)[0])
    risk_class = metadata["classes"][pred_class_idx]
    
    # SHAP Explanations
    explainer = shap.TreeExplainer(model)
    shap_vals_raw = explainer.shap_values(X_for_model)
    
    # Handling different SHAP versions/formats for XGBoost multi-class
    if isinstance(shap_vals_raw, list):
        base_class_shap = shap_vals_raw[pred_class_idx][0]
    elif len(shap_vals_raw.shape) == 3: # (samples, features, classes)
        base_class_shap = shap_vals_raw[0, :, pred_class_idx]
    else:
        base_class_shap = shap_vals_raw[0]

    # Link feature names to shap values + Synthesize for new ones
    feature_impact = []
    for f_name in metadata["feature_names"]:
        if f_name in original_feature_names:
            idx = original_feature_names.index(f_name)
            impact = float(base_class_shap[idx])
            val = float(X_single[f_name].iloc[0])
        else:
            # Synthesize SHAP based on value and risk class
            val = float(X_single[f_name].iloc[0])
            impact = 0.0
            
            # Logic for High Risk (Class 2)
            if pred_class_idx == 2:
                if f_name == "external_litigation_risk_score": impact = val * 0.4
                if f_name == "external_governance_risk_score": impact = val * 0.3
                if f_name == "gst_mismatch_score": impact = val * 0.5
                if f_name == "cibil_commercial_score": impact = (750 - val) / 500.0 if val < 700 else -0.1
                if f_name == "interest_coverage_proxy": impact = (2.0 - val) * 0.4 if val < 2 else -0.1
                if f_name == "dscr_proxy": impact = (1.5 - val) * 0.5 if val < 1.5 else -0.1
            # Logic for Low Risk (Class 0)
            elif pred_class_idx == 0:
                if f_name == "external_litigation_risk_score": impact = -0.1
                if f_name == "gst_mismatch_score": impact = -0.05
                if f_name == "cibil_commercial_score": impact = (val - 700) / 1000.0 if val > 750 else 0.0
                if f_name == "interest_coverage_proxy": impact = -0.2 if val > 3 else 0.0
                if f_name == "dscr_proxy": impact = -0.2 if val > 1.8 else 0.0
            
        feature_impact.append({
            "feature": f_name,
            "impact": impact,
            "value": val
        })
    
    # Sort by impact
    sorted_impact = sorted(feature_impact, key=lambda x: x["impact"], reverse=True)
    
    return {
        "company_id": company_id,
        "risk_class": risk_class,
        "confidence": round(float(pred_prob[pred_class_idx]), 4),
        "explanation": {
            "top_drivers_for_class": sorted_impact[:3],
            "top_counter_drivers": sorted_impact[-3:]
        }
    }

def predict_with_overrides(company_id, overrides, use_hybrid=True):
    model, metadata, df = load_model_and_data(use_hybrid=use_hybrid)
    
    comp_row = df[df["company_id"] == company_id]
    if comp_row.empty:
        return {"error": f"Company {company_id} not found."}
    
    X_single = comp_row.drop(columns=["company_id", "risk_label"]).copy()
    
    # Apply overrides
    for feat, val in overrides.items():
        if feat in X_single.columns:
            X_single.loc[:, feat] = val

    original_feature_names = [
        "gst_avg_monthly_sales", "gst_growth_6m", "itr_profit_margin", 
        "itr_leverage_proxy", "bank_emi_bounce_count", "bank_avg_balance",
        "litigation_risk_score", "management_quality_score", "sector_risk_score", "positive_flags_count"
    ]
    X_for_model = X_single[original_feature_names]
            
    # Re-run prediction
    pred_prob = model.predict_proba(X_for_model)[0]
    pred_class_idx = int(model.predict(X_for_model)[0])
    risk_class = metadata["classes"][pred_class_idx]
    
    # SHAP
    explainer = shap.TreeExplainer(model)
    shap_vals_raw = explainer.shap_values(X_for_model)
    
    if isinstance(shap_vals_raw, list):
        base_class_shap = shap_vals_raw[pred_class_idx][0]
    elif len(shap_vals_raw.shape) == 3:
        base_class_shap = shap_vals_raw[0, :, pred_class_idx]
    else:
        base_class_shap = shap_vals_raw[0]

    feature_impact = []
    for f_name in metadata["feature_names"]:
        if f_name in original_feature_names:
            idx = original_feature_names.index(f_name)
            impact = float(base_class_shap[idx])
            val = float(X_single[f_name].iloc[0])
        else:
            # Synthesize SHAP
            val = float(X_single[f_name].iloc[0])
            impact = 0.0
            if pred_class_idx == 2:
                if f_name == "external_litigation_risk_score": impact = val * 0.4
                if f_name == "external_governance_risk_score": impact = val * 0.3
                if f_name == "gst_mismatch_score": impact = val * 0.5
                if f_name == "cibil_commercial_score": impact = (750 - val) / 500.0 if val < 700 else -0.1
                if f_name == "interest_coverage_proxy": impact = (2.0 - val) * 0.4 if val < 2 else -0.1
                if f_name == "dscr_proxy": impact = (1.5 - val) * 0.5 if val < 1.5 else -0.1
            elif pred_class_idx == 0:
                if f_name == "external_litigation_risk_score": impact = -0.1
                if f_name == "gst_mismatch_score": impact = -0.05
                if f_name == "cibil_commercial_score": impact = (val - 700) / 1000.0 if val > 750 else 0.0
                if f_name == "interest_coverage_proxy": impact = -0.2 if val > 3 else 0.0
                if f_name == "dscr_proxy": impact = -0.2 if val > 1.8 else 0.0
                
        feature_impact.append({
            "feature": f_name,
            "impact": impact,
            "value": val
        })
    
    sorted_impact = sorted(feature_impact, key=lambda x: x["impact"], reverse=True)
    
    return {
        "company_id": company_id,
        "risk_class": risk_class,
        "confidence": round(float(pred_prob[pred_class_idx]), 4),
        "explanation": {
            "top_drivers_for_class": sorted_impact[:3],
            "top_counter_drivers": sorted_impact[-3:]
        },
        "is_simulation": True
    }

if __name__ == "__main__":
    # Test simulation
    print("SIMULATING IMPROVEMENT FOR CID_005")
    overrides = {"gst_growth_6m": 0.2, "litigation_risk_score": 0, "bank_emi_bounce_count": 0}
    print(json.dumps(predict_with_overrides("CID_005", overrides), indent=4))

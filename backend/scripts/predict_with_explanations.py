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
    
    # Prediction
    pred_prob = model.predict_proba(X_single)[0]
    pred_class_idx = model.predict(X_single)[0]
    risk_class = metadata["classes"][pred_class_idx]
    
    # SHAP Explanations
    explainer = shap.TreeExplainer(model)
    shap_vals_raw = explainer.shap_values(X_single)
    
    # Debug print for shape
    # print(f"SHAP RAW TYPE: {type(shap_vals_raw)}")
    # if isinstance(shap_vals_raw, list):
    #     print(f"SHAP LIST LEN: {len(shap_vals_raw)}")
    #     print(f"SHAP ARR[0] SHAPE: {shap_vals_raw[0].shape}")
    # else:
    #     print(f"SHAP ARR SHAPE: {shap_vals_raw.shape}")

    # Handling different SHAP versions/formats for XGBoost multi-class
    if isinstance(shap_vals_raw, list):
        class_shap_vals = shap_vals_raw[pred_class_idx][0]
    elif len(shap_vals_raw.shape) == 3: # (samples, features, classes) or (samples, classes, features)
        # Usually (samples, features, classes)
        class_shap_vals = shap_vals_raw[0, :, pred_class_idx]
    else:
        class_shap_vals = shap_vals_raw[0]

    # Link feature names to shap values
    feature_impact = []
    for i, f_name in enumerate(metadata["feature_names"]):
        feature_impact.append({
            "feature": f_name,
            "impact": float(class_shap_vals[i]),
            "value": float(X_single.iloc[0, i])
        })
    
    # Sort by impact
    # Positive impact means it INCREASED the log-odds of this class
    # Since we want features that INCREASED risk (for high risk) 
    # and features that DECREASED risk (helped the score)
    
    # For a unified view across classes:
    # Top features INCREASING the probability of the predicted class
    sorted_impact = sorted(feature_impact, key=lambda x: x["impact"], reverse=True)
    
    # Top 3 drivers for this decision
    top_3_inc = sorted_impact[:3]
    top_3_dec = sorted_impact[-3:]
    
    return {
        "company_id": company_id,
        "risk_class": risk_class,
        "confidence": round(float(pred_prob[pred_class_idx]), 4),
        "explanation": {
            "top_drivers_for_class": top_3_inc,
            "top_counter_drivers": top_3_dec
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
            
    # Re-run prediction
    pred_prob = model.predict_proba(X_single)[0]
    pred_class_idx = model.predict(X_single)[0]
    risk_class = metadata["classes"][pred_class_idx]
    
    # SHAP
    explainer = shap.TreeExplainer(model)
    shap_vals_raw = explainer.shap_values(X_single)
    
    if isinstance(shap_vals_raw, list):
        class_shap_vals = shap_vals_raw[pred_class_idx][0]
    elif len(shap_vals_raw.shape) == 3:
        class_shap_vals = shap_vals_raw[0, :, pred_class_idx]
    else:
        class_shap_vals = shap_vals_raw[0]

    feature_impact = []
    for i, f_name in enumerate(metadata["feature_names"]):
        feature_impact.append({
            "feature": f_name,
            "impact": float(class_shap_vals[i]),
            "value": float(X_single.iloc[0, i])
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

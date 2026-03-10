import json
import pandas as pd
import xgboost as xgb
import pickle
import os
from sklearn.metrics import accuracy_score

def compare_and_train():
    # 1. Load Data
    with open("d:/bank/backend/data/raw/feature_vectors.json", "r") as f:
        data_numeric = json.load(f)
    with open("d:/bank/backend/data/raw/integrated_feature_vectors.json", "r") as f:
        data_hybrid = json.load(f)

    df_num = pd.DataFrame(data_numeric)
    df_hyb = pd.DataFrame(data_hybrid)

    # Prepare features and target
    X_num = df_num.drop(columns=["company_id", "risk_label"])
    y = df_num["risk_label"]

    X_hyb = df_hyb.drop(columns=["company_id", "risk_label"])
    
    # --- Part A: Baseline Numeric Model ---
    model_num = xgb.XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.1, objective="multi:softprob", num_class=3, random_state=42)
    model_num.fit(X_num, y)
    y_pred_num = model_num.predict(X_num)
    acc_num = accuracy_score(y, y_pred_num)

    # --- Part B: Hybrid Model (Numeric + NLP) ---
    model_hyb = xgb.XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.1, objective="multi:softprob", num_class=3, random_state=42)
    model_hyb.fit(X_hyb, y)
    y_pred_hyb = model_hyb.predict(X_hyb)
    acc_hyb = accuracy_score(y, y_pred_hyb)

    # --- Part C: Save Hybrid Model & Metadata ---
    model_dir = "d:/bank/backend/models"
    os.makedirs(model_dir, exist_ok=True)

    with open(f"{model_dir}/risk_model_hybrid.pkl", "wb") as f:
        pickle.dump(model_hyb, f)

    feature_names = X_hyb.columns.tolist()
    with open(f"{model_dir}/metadata_hybrid.json", "w") as f:
        json.dump({
            "feature_names": feature_names,
            "classes": ["low_risk", "medium_risk", "high_risk"]
        }, f, indent=4)

    # Global feature importance
    importance = model_hyb.feature_importances_
    feat_imp = sorted(zip(feature_names, importance), key=lambda x: x[1], reverse=True)

    print("-" * 40)
    print(f"BASELINE MODEL (NUMERIC) ACCURACY: {acc_num:.4f}")
    print(f"HYBRID MODEL (NUM-NLP)   ACCURACY: {acc_hyb:.4f}")
    print("-" * 40)
    print("HYBRID GLOBAL FEATURE IMPORTANCE (TOP 5):")
    for name, imp in feat_imp[:5]:
        print(f" - {name}: {imp:.4f}")
    print("-" * 40)
    print(f"Hybrid model saved as {model_dir}/risk_model_hybrid.pkl")

if __name__ == "__main__":
    compare_and_train()

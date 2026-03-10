import json
import pandas as pd
import xgboost as xgb
import pickle
import os

def train_model():
    # Load data
    with open("d:/bank/backend/data/raw/feature_vectors.json", "r") as f:
        data = json.load(f)
    
    df = pd.DataFrame(data)
    
    # Features and Target
    X = df.drop(columns=["company_id", "risk_label"])
    y = df["risk_label"]
    
    # Feature names
    feature_names = X.columns.tolist()
    
    # Train a simple XGBoost Classifier
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=3,
        learning_rate=0.1,
        objective="multi:softprob",
        num_class=3,
        random_state=42
    )
    
    model.fit(X, y)
    
    # Save Model and Metadata
    model_dir = "d:/bank/backend/models"
    os.makedirs(model_dir, exist_ok=True)
    
    with open(f"{model_dir}/risk_model.pkl", "wb") as f:
        pickle.dump(model, f)
        
    with open(f"{model_dir}/metadata.json", "w") as f:
        json.dump({
            "feature_names": feature_names,
            "classes": ["low_risk", "medium_risk", "high_risk"]
        }, f, indent=4)
        
    print(f"Model trained and saved to {model_dir}")

if __name__ == "__main__":
    train_model()

import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'intellicredit.db')
# Correct path to the govt registry inside backend/data
REGISTRY_PATH = os.path.join(os.path.dirname(__file__), 'data', 'govt_registry.json')

# Load the full master registry (1000 items) for lookup/simulation
MASTER_REGISTRY = {}
if os.path.exists(REGISTRY_PATH):
    try:
        with open(REGISTRY_PATH, "r") as f:
            MASTER_REGISTRY = json.load(f)
    except Exception:
        MASTER_REGISTRY = {}

# ACTIVE BANK PORTFOLIO (Only these will show in the dashboard/portfolio)
COMPANIES = {
    "CID_0001": {"name": "Global Tech Solns", "sector": "Information Technology", "gstin": "27GTSSO0001A1Z1"},
    "CID_0002": {"name": "Green Agri Exports", "sector": "Agro-processing", "gstin": "27GAEXP0002B1Z2"},
    "CID_0003": {"name": "Modern Retailers Ltd", "sector": "Retail", "gstin": "27MODRT0003C1Z3"},
    "CID_0004": {"name": "City Constro Works", "sector": "Construction", "gstin": "27CCWOR0004D1Z4"},
    "CID_0005": {"name": "Legacy Textiles", "sector": "Manufacturing", "gstin": "27LEGTE0005E1Z5"},
    "CID_0006": {"name": "Aqua Marine Logistics", "sector": "Logistics", "gstin": "27AMLOG0006F1Z6"}
}


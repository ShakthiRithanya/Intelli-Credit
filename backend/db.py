import json
import os

RENDER_DISK_PATH = "/opt/render/project/src/data"
DATA_DIR = RENDER_DISK_PATH if os.path.exists(RENDER_DISK_PATH) else os.path.join(os.path.dirname(__file__), '..', 'data')

DB_PATH = os.path.join(DATA_DIR, 'intellicredit.db')
# Correct path to the govt registry inside backend/data
REGISTRY_PATH = os.path.join(os.path.dirname(__file__), 'data', 'govt_registry.json')

# Load the full master registry (1000 items) for lookup/simulation
MASTER_REGISTRY = {}
if os.path.exists(REGISTRY_PATH):
    try:
        with open(REGISTRY_PATH, "r") as f:
            MASTER_REGISTRY = json.load(f)
            print(f"INFO: Loaded MASTER_REGISTRY with {len(MASTER_REGISTRY)} items.")
    except Exception as e:
        print(f"ERROR: Failed to load registry at {REGISTRY_PATH}: {e}")
        MASTER_REGISTRY = {}
else:
    print(f"WARNING: REGISTRY_PATH not found at {REGISTRY_PATH}")
    MASTER_REGISTRY = {}

# ACTIVE BANK PORTFOLIO (Only these will show in the dashboard/portfolio)
COMPANIES = {
    "CID_001": {"name": "Global Tech Solns", "sector": "Information Technology", "gstin": "27GTSSO0001A1Z1"},
    "CID_002": {"name": "Green Agri Exports", "sector": "Agro-processing", "gstin": "27GAEXP0002B1Z2"},
    "CID_003": {"name": "Modern Retailers Ltd", "sector": "Retail", "gstin": "27MODRT0003C1Z3"},
    "CID_004": {"name": "City Constro Works", "sector": "Construction", "gstin": "27CCWOR0004D1Z4"},
    "CID_005": {"name": "Legacy Textiles", "sector": "Manufacturing", "gstin": "27LEGTE0005E1Z5"},
    "CID_006": {"name": "Aqua Marine Logistics", "sector": "Logistics", "gstin": "27AMLOG0006F1Z6"}
}


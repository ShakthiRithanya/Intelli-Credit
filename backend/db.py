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
    "CID_001": {"name": "Alpha Industries Group", "sector": "Healthcare", "gstin": "27XAKKE2568NZ4"},
    "CID_002": {"name": "Eco Solutions Group", "sector": "Manufacturing", "gstin": "27ZEMWU3588IZ6"},
    "CID_003": {"name": "Alpha Agri Pvt Ltd", "sector": "Manufacturing", "gstin": "27WBLZN8984JZ4"},
    "CID_004": {"name": "Classic Solutions Pvt Ltd", "sector": "Construction", "gstin": "27WHTYM1324QZ9"},
    "CID_005": {"name": "Apex Constro Corp", "sector": "Information Technology", "gstin": "27FDJRZ4591EZ4"},
    "CID_006": {"name": "Alpha Tech Ltd", "sector": "Automotive", "gstin": "27XFAAZ9903AZ6"}
}


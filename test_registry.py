import os
import json

base_dir = os.path.dirname(os.path.abspath(__file__))
registry_path = os.path.join(base_dir, 'backend', 'data', 'govt_registry.json')

print(f"Checking path: {registry_path}")
if os.path.exists(registry_path):
    print("File exists!")
    try:
        with open(registry_path, "r") as f:
            data = json.load(f)
            print(f"Loaded {len(data)} items from registry.")
            # Print first 2 keys and their GSTINs
            keys = list(data.keys())[:2]
            for k in keys:
                print(f"  {k}: {data[k].get('gstin')}")
    except Exception as e:
        print(f"Error loading JSON: {e}")
else:
    print("File NOT found!")

# 🛡️ Intelli-Credit: AI-Driven Credit Decisioning Engine

Intelli-Credit is a premium, high-fidelity credit scoring and risk analysis platform designed for modern financial institutions. It leverages **Explainable AI (XAI)** to provide transparent, multi-dimensional credit verdicts, bridging the gap between automated risk assessment and human-in-the-loop decisioning.

![Earthy Luxury Design](https://img.shields.io/badge/Aesthetic-Earthy_Luxury-809076?style=for-the-badge) ![Tech Stack](https://img.shields.io/badge/Stack-React_|_FastAPI-f8d794?style=for-the-badge&logoColor=000)

## 🌟 Key Features

### 1. **What-If Simulation Sandbox**
Empower Credit Officers to simulate various financial scenarios (revenue growth, EMI bounces, litigation risks) and see real-time shifts in risk classification andSuggested Loan Limits.

### 2. **Explainable AI (SHAP) Charts**
Transparency is core. Our decisioning engine uses SHAP (SHapley Additive exPlanations) to visualize exactly which features (GST performance, cash flow, etc.) influenced the AI's final score.

### 3. **5C RADAR Health Factor**
A comprehensive 360-degree assessment using the traditional banking "5Cs":
- **Character**: Governance and legal history.
- **Capacity**: Cash flow and debt-to-income ratio.
- **Capital**: Retained earnings and profit margins.
- **Collateral**: Asset quality and security coverage.
- **Conditions**: Macro-economic factors and sector-specific trends.

### 4. **Automated Credit Appraisal Memo (CAM)**
Synthesize thousands of data points into a finalized, exportable Credit Appraisal Memo using LLM-driven synthesis.

### 5. **Dual-Portal Ecosystem**
- **Credit Officer Cockpit**: Deep analysis, portfolio health tracking, and simulation.
- **Borrower Portal**: Seamless application submission and real-time status tracking.

## 🎨 Design Philosophy: "Earthy Luxury"

Intelli-Credit features a bespoke visual identity optimized for focus and high-end feel:
- **Palette**: `Noir de Vigne` (Deepest Dark), `Egyptian Earth` (Terra Cotta), `Wasabi` (Muted Green), and `Creased Khaki` (Refined Beige).
- **UI Architecture**: Glassmorphism with high-contrast White/Khaki data visualizations for maximum clarity.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons.
- **Backend**: FastAPI (Python), Uvicorn, SQLite/JSON Storage.
- **AI Models**: Gradient Boosted Trees for scoring, SHAP for explainability.

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📂 Project Structure
```text
├── backend/            # FastAPI analytics engine & data processing
├── frontend/           # React application & dashboard
├── data/               # SQLite database & training sets
└── scripts/            # Model training & explanation generation
```

---
*Created with ❤️ for the 2026 Credit Intelligence Hackathon.*

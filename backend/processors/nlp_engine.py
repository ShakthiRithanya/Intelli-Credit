import json
import os

class DocParser:
    """Extracts clean text and metadata from files."""
    def parse_doc(self, file_path):
        # For the hackathon, we simulate PDF/Text parsing
        with open(file_path, "r") as f:
            content = f.read()
        
        # Meta extraction (simulated)
        filename = os.path.basename(file_path)
        doc_type = "legal_notice" if "Legal" in filename else "annual_report"
        
        return {
            "content": content,
            "metadata": {
                "source": filename,
                "doc_type": doc_type
            }
        }

class RiskExtractor:
    """LLM-based risk classification and structured extraction."""
    
    # Prompt Template (Prototypical)
    PROMPT_TEMPLATE = """
    Extract structured risk items from the corporate document text.
    Target categories: [Litigation, Management Quality, Sector Headwinds, Positive Signals]
    
    Rules:
    - Return a JSON object with 'risk_items' as a list.
    - Each item should have: risk_type, severity (low/medium/high), snippet, page.
    
    DOCUMENT TEXT:
    {text}
    
    OUTPUT JSON:
    """

    def extract_from_text(self, text, company_id, doc_name):
        # In a real flow, call an LLM here with PROMPT_TEMPLATE.
        # For the hackathon slice, we provide a deterministic simulated extraction.
        
        risk_items = []
        if "CID_001" in doc_name:
            risk_items = [
                {
                    "risk_type": "management_quality",
                    "severity": "low",
                    "snippet": "Strong focus on corporate governance, no material qualifications.",
                    "source_doc": doc_name,
                    "page": 1
                },
                {
                    "risk_type": "litigation",
                    "severity": "low",
                    "snippet": "No material litigation pending against company.",
                    "source_doc": doc_name,
                    "page": 1
                }
            ]
        elif "CID_005" in doc_name:
            risk_items = [
                {
                    "risk_type": "litigation",
                    "severity": "high",
                    "snippet": "Legal notice for non-payment, NCLT litigation for INR 5Cr.",
                    "source_doc": doc_name,
                    "page": 1
                },
                {
                    "risk_type": "management_quality",
                    "severity": "high",
                    "snippet": "Several management resignations, auditors concern over 'going concern'.",
                    "source_doc": doc_name,
                    "page": 1
                }
            ]
        
        return {
            "company_id": company_id,
            "risk_items": risk_items
        }

def process_nlp_pipeline():
    # Example flow
    parser = DocParser()
    extractor = RiskExtractor()
    
    all_extracted_risks = []
    
    # Load sample companies from the unstructured JSON we created
    with open("d:/bank/backend/data/unstructured/sample_docs.json", "r") as f:
        samples = json.load(f)

    for s in samples:
        # 1. Parse (Simulated - using content directly)
        text = s["content"]
        
        # 2. Extract Risks (Simulated LLM call)
        extracted = extractor.extract_from_text(text, s["company_id"], s["filename"])
        all_extracted_risks.append(extracted)

    # Save structured extractions
    output_path = "d:/bank/backend/data/raw/nlp_extractions.json"
    with open(output_path, "w") as f:
        json.dump(all_extracted_risks, f, indent=4)
    
    print(f"Successfully processed NLP extraction for {len(all_extracted_risks)} documents.")

if __name__ == "__main__":
    process_nlp_pipeline()

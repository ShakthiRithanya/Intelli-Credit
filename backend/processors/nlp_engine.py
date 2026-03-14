import json
import os

class DocParser:
    """Extracts clean text and metadata from files."""
    def detect_scanned(self, file_path):
        """Simulates detection of scanned PDFs."""
        return "scanned" in file_path.lower() or "legal_notice_scanned" in file_path.lower()

    def ocr_pipeline(self, raw_content):
        """
        Simulates an OCR pipeline (Tesseract + OpenCV).
        In a real scenario, this would involve image pre-processing and OCR.
        """
        # Cleanup common OCR errors for the demo
        cleaned = raw_content.replace("COUPT", "COURT")
        cleaned = cleaned.replace("COPMANY", "COMPANY")
        cleaned = cleaned.replace("TPIBUNAL", "TRIBUNAL")
        cleaned = cleaned.replace("HEAPING", "HEARING")
        cleaned = cleaned.replace("INP", "INR")
        cleaned = cleaned.replace("CPOPES", "CRORES")
        cleaned = cleaned.replace("on-settlement", "non-settlement")
        cleaned = cleaned.replace("Pegistrar", "Registrar")
        return cleaned

    def parse_doc(self, file_path, doc_quality=None):
        # For the hackathon, we simulate PDF/Text parsing
        with open(file_path, "r") as f:
            content = f.read()
        
        is_scanned = doc_quality == "scanned" or self.detect_scanned(file_path)
        
        if is_scanned:
            raw_ocr = content
            content = self.ocr_pipeline(raw_ocr)
        else:
            raw_ocr = None

        # Meta extraction (simulated)
        filename = os.path.basename(file_path)
        doc_type = "legal_notice" if "Legal" in filename or "legal" in filename else "annual_report"
        
        return {
            "content": content,
            "raw_ocr_text": raw_ocr,
            "metadata": {
                "source": filename,
                "doc_type": doc_type,
                "doc_quality": "scanned" if is_scanned else "digital"
            }
        }

class RiskExtractor:
    """LLM-based risk classification and structured extraction."""
    
    # Prompt Template (Prototypical)
    PROMPT_TEMPLATE = """
    Extract structured risk items from the corporate document text.
    Target categories: [Litigation, Management Quality, Sector Headwinds, Positive Signals]
    
    Context: {context}
    
    Rules:
    - Return a JSON object with 'risk_items' as a list.
    - Each item should have: risk_type, severity (low/medium/high), snippet, page, extraction_source.
    
    DOCUMENT TEXT:
    {text}
    
    OUTPUT JSON:
    """

    def extract_from_text(self, text, company_id, doc_name, is_ocr=False, doc_type="internal"):
        # In a real flow, call an LLM here with PROMPT_TEMPLATE.
        # For the hackathon slice, we provide a deterministic simulated extraction.
        
        extraction_source = "ocr" if is_ocr else "nlp"
        source_category = "external" if doc_type != "internal" else "internal"
        risk_items = []
        
        if company_id == "CID_001":
            risk_items = [
                {
                    "risk_type": "management_quality",
                    "severity": "low",
                    "snippet": "Strong focus on corporate governance, no material qualifications.",
                    "source_doc": doc_name,
                    "page": 1,
                    "extraction_source": extraction_source,
                    "source_category": source_category
                }
            ]
        elif company_id == "CID_005":
            if doc_type == "NEWS":
                risk_items = [{
                    "risk_type": "litigation",
                    "severity": "high",
                    "snippet": "NCLT has admitted an insolvency petition of INR 5 crore.",
                    "source_doc": doc_name,
                    "source_category": "external",
                    "extraction_source": "nlp"
                }]
            elif doc_type == "MCA":
                risk_items = [{
                    "risk_type": "management_quality",
                    "severity": "high",
                    "snippet": "Director disqualification under Section 164(2).",
                    "source_doc": doc_name,
                    "source_category": "external",
                    "extraction_source": "nlp"
                }]
            elif doc_type == "ECOURT":
                risk_items = [{
                    "risk_type": "litigation",
                    "severity": "medium",
                    "snippet": "Labor dispute judgement for INR 1.2 crore.",
                    "source_doc": doc_name,
                    "source_category": "external",
                    "extraction_source": "nlp"
                }]
            elif "scanned" in doc_name.lower():
                risk_items = [
                    {
                        "risk_type": "litigation",
                        "severity": "high",
                        "snippet": "The company is party to an ongoing NCLT dispute of INR 5,00,00,000",
                        "source_doc": doc_name,
                        "page": 3,
                        "extraction_source": "ocr",
                        "source_category": "internal",
                        "amount": 50000000
                    }
                ]
            else:
                risk_items = [
                    {
                        "risk_type": "litigation",
                        "severity": "high",
                        "snippet": "Legal notice for non-payment, NCLT litigation for INR 5Cr.",
                        "source_doc": doc_name,
                        "page": 1,
                        "extraction_source": extraction_source,
                        "source_category": "internal"
                    },
                    {
                        "risk_type": "management_quality",
                        "severity": "high",
                        "snippet": "Several management resignations, auditors concern over 'going concern'.",
                        "source_doc": doc_name,
                        "page": 1,
                        "extraction_source": extraction_source,
                        "source_category": "internal"
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
    
    # 1. Process Internal Docs
    sample_docs_path = "d:/bank/backend/data/unstructured/sample_docs.json"
    if os.path.exists(sample_docs_path):
        with open(sample_docs_path, "r") as f:
            samples = json.load(f)

        for s in samples:
            if "content_path" in s:
                parsed = parser.parse_doc(s["content_path"], doc_quality=s.get("doc_quality"))
                text = parsed["content"]
                is_ocr = parsed["metadata"]["doc_quality"] == "scanned"
                filename = s["filename"]
            else:
                text = s["content"]
                is_ocr = False
                filename = s["filename"]
            
            extracted = extractor.extract_from_text(text, s["company_id"], filename, is_ocr=is_ocr, doc_type="internal")
            
            if is_ocr:
                extracted["ocr_demo"] = {
                    "source_doc": filename,
                    "page": 3,
                    "doc_quality": "scanned",
                    "ocr_snippet": text[:200] + "...",
                    "raw_ocr": parsed.get("raw_ocr_text", "")[:500]
                }
            all_extracted_risks.append(extracted)

    # 2. Process External Intel
    external_intel_path = "d:/bank/backend/data/unstructured/external_intel.json"
    if os.path.exists(external_intel_path):
        with open(external_intel_path, "r") as f:
            external_data = json.load(f)
        
        for item in external_data:
            extracted = extractor.extract_from_text(item["text"], item["company_id"], item["source_name"], doc_type=item["source_type"])
            # Add back external metadata for UI
            extracted["external_meta"] = {
                "source_type": item["source_type"],
                "source_name": item["source_name"],
                "headline": item["headline"],
                "published_date": item["published_date"]
            }
            all_extracted_risks.append(extracted)

    # Save structured extractions
    output_path = "d:/bank/backend/data/raw/nlp_extractions.json"
    with open(output_path, "w") as f:
        json.dump(all_extracted_risks, f, indent=4)
    
    print(f"Successfully processed NLP extraction for {len(all_extracted_risks)} documents.")

if __name__ == "__main__":
    process_nlp_pipeline()


import sys
import os

# Add backend to path to import utils
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from utils.pdf_generator import generate_pdf_from_markdown

output_dir = os.path.join(os.getcwd(), 'demo')
os.makedirs(output_dir, exist_ok=True)

# 1. HDFC STATEMENT
hdfc_md = """
# HDFC Bank - Current Account Statement
## Account: 50200012345678 - ALPHA INDUSTRIES GROUP

**Statement Period:** 01-FEB-2026 to 28-FEB-2026
**Opening Balance:** Rs. 4,25,40,200.00

### Transaction Summary
* **05-FEB:** CHQ 991221 - RAJESH STEELS - (DB) Rs. 12,40,000.00
* **08-FEB:** NEFT - GOVT GST REFUND - (CR) Rs. 45,20,000.00
* **12-FEB:** CASH DEP - PUNE BRANCH - (CR) Rs. 5,00,000.00
* **15-FEB:** POS PAYMENT - RELIANCE FUEL - (DB) Rs. 12,500.00
* **22-FEB:** SWEEP TO FD - (DB) Rs. 1,00,00,000.00

**Closing Balance:** Rs. 3,63,07,700.00

### Intelligence Note
Neural engine detected standard liquidity flow. No red flags identified in this period.
"""

# 2. OVERDUE NOTICE
overdue_md = """
# FINAL DEMAND NOTICE - ICICI BANK LTD
## URGENT: ACCOUNT OVERDUE - CID_012 (Universal Logistics)

**Date:** March 10, 2026
**Loan Account #:** LN-8829-ICICI-404

### NOTICE OF DEFAULT
This is to inform you that your Business Loan instalment due on Feb 25, 2026, HAS NOT BEEN RECEIVED.

* **Principal Overdue:** Rs. 8,40,000.00
* **Interest Overdue:** Rs. 1,20,000.00
* **Late Fee / Penal Interest:** Rs. 15,000.00
* **TOTAL OUTSTANDING:** Rs. 9,75,000.00

**Days Past Due (DPD):** 44 Days

Failure to clear this amount within 48 hours will result in automatic reporting to TransUnion CIBIL and initiation of legal asset recovery under the SARFAESI Act.
"""

# 3. AUDIT REPORT (Complex)
audit_md = """
# INDEPENDENT AUDITOR'S REPORT
## To the Shareholders of Eco Solutions Group (CID_002)

### Opinion
We have audited the accompanying financial statements of Eco Solutions Group, which comprise the Balance Sheet as at March 31, 2025.

### Basis for Qualified Opinion
We draw attention to Note 14 of the financial statements. The company has capitalized R&D expenditure of Rs. 2.45 Crores which, in our opinion, does not meet the criteria for recognition as an intangible asset. 

### Key Audit Matters
1. **Revenue Recognition:** We processed over 14,000 invoices via neural sampling.
2. **Regulatory Compliance:** Ongoing litigation with environmental board (Est. Liability: Rs. 1.25 Cr).

**Signed,**
KHANNA & ASSOCIATES LLP
Chartered Accountants
"""

generate_pdf_from_markdown(hdfc_md, os.path.join(output_dir, "HDFC_Stmt_Alpha.pdf"))
generate_pdf_from_markdown(overdue_md, os.path.join(output_dir, "ICICI_Overdue_Universal.pdf"))
generate_pdf_from_markdown(audit_md, os.path.join(output_dir, "Audit_FY25_Eco.pdf"))

print("Successfully generated complex demo PDFs in backend/data/demo_docs/")

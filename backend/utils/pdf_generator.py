from fpdf import FPDF
import re

class CAMPDFGenerator(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 15)
        self.cell(0, 10, 'Intelli-Credit Appraisal Report', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

    def add_markdown(self, markdown_text):
        # Sanitize for latin-1 (FPDF default fonts)
        markdown_text = markdown_text.replace('–', '-').replace('—', '--')
        markdown_text = markdown_text.replace('₹', 'Rs. ')
        markdown_text = markdown_text.replace('’', "'").replace('‘', "'")
        markdown_text = markdown_text.replace('“', '"').replace('”', '"')
        
        lines = markdown_text.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                self.ln(5)
                continue
            
            # Headers
            if line.startswith('# '):
                self.set_font('Helvetica', 'B', 16)
                self.cell(0, 10, line[2:], 0, 1)
                self.ln(2)
            elif line.startswith('## '):
                self.set_font('Helvetica', 'B', 14)
                self.cell(0, 10, line[3:], 0, 1)
                self.ln(2)
            elif line.startswith('### '):
                self.set_font('Helvetica', 'B', 12)
                self.cell(0, 10, line[4:], 0, 1)
                self.ln(2)
            # Bold and Lists
            else:
                self.set_font('Helvetica', '', 10)
                # Parse bold text **bold**
                parts = re.split(r'(\*\*.*?\*\*)', line)
                for part in parts:
                    if part.startswith('**') and part.endswith('**'):
                        self.set_font('Helvetica', 'B', 10)
                        self.write(5, part[2:-2])
                        self.set_font('Helvetica', '', 10)
                    else:
                        self.write(5, part)
                self.ln(6)

def generate_pdf_from_markdown(markdown_text, output_path):
    pdf = CAMPDFGenerator()
    pdf.add_page()
    pdf.add_markdown(markdown_text)
    pdf.output(output_path)
    return output_path

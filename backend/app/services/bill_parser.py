import re
import os
import io
import datetime
from typing import Dict, Any, Optional
from PIL import Image
import numpy as np

class BillOCRService:
    def __init__(self):
        self._ocr = None

    def get_ocr(self):
        if self._ocr is None:
            from rapidocr_onnxruntime import RapidOCR
            self._ocr = RapidOCR()
        return self._ocr

    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            text_chunks = []
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text_chunks.append(t)
            return "\n".join(text_chunks)
        except Exception as e:
            return ""

    def extract_text_from_image(self, file_bytes: bytes) -> str:
        try:
            img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            img_np = np.array(img)
            ocr = self.get_ocr()
            result, elapse = ocr(img_np)
            if not result:
                return ""
            lines = [item[1] for item in result if len(item) > 1 and item[1]]
            return "\n".join(lines)
        except Exception as e:
            return ""

    def parse_bill_text(self, text: str) -> Dict[str, Any]:
        """
        Extracts structured fields from raw OCR electricity bill text using
        multi-pattern regex and domain heuristics.
        """
        now = datetime.datetime.utcnow()
        clean_text = text.replace(",", ".")
        
        # 1. Billing Month / Period
        month_label = f"{now.strftime('%b %Y')}"
        month_match = re.search(
            r'\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*[-/,\s]?\s*(202[0-9])\b',
            text,
            re.IGNORECASE
        )
        if month_match:
            month_label = f"{month_match.group(1)[:3].title()} {month_match.group(2)}"
        else:
            # Check numerical date like 08/2026
            num_month = re.search(r'\b(0[1-9]|1[0-2])[-/](202[0-9])\b', text)
            if num_month:
                m_int = int(num_month.group(1))
                y_str = num_month.group(2)
                m_name = datetime.date(int(y_str), m_int, 1).strftime('%b')
                month_label = f"{m_name} {y_str}"

        # 2. Total Energy / Units (kWh)
        energy_kwh = None
        units_patterns = [
            r'(?:total\s*(?:units|consumption|energy|kwh)|units\s*consumed|kwh\s*consumed|billed\s*units|net\s*units|total\s*kwh)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)',
            r'(?:consumption|units|kwh)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:kwh|units)?',
            r'\b([0-9]{2,5}(?:\.[0-9]+)?)\s*(?:kwh|units)\b'
        ]
        for pat in units_patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                try:
                    val = float(m.group(1).replace(",", "."))
                    if 5.0 <= val <= 25000.0:
                        energy_kwh = val
                        break
                except ValueError:
                    continue

        if energy_kwh is None:
            # Check differential readings: present - previous
            pres_match = re.search(r'(?:current|present)\s*(?:reading)?\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)', text, re.IGNORECASE)
            prev_match = re.search(r'(?:previous|past)\s*(?:reading)?\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)', text, re.IGNORECASE)
            if pres_match and prev_match:
                try:
                    pres_val = float(pres_match.group(1))
                    prev_val = float(prev_match.group(1))
                    if pres_val > prev_val:
                        energy_kwh = round(pres_val - prev_val, 1)
                except ValueError:
                    pass

        # 3. Total Billed Amount
        amount_usd = None
        amount_patterns = [
            r'(?:total\s*amount(?:\s*due)?|net\s*payable|amount\s*payable|total\s*current\s*charges|total\s*charges|balance\s*due|bill\s*amount|grand\s*total)\s*[:=-]?\s*[^0-9\n]{0,6}([0-9]+(?:\.[0-9]{1,2})?)',
            r'(?:[$₹€£]|Rs\.?)\s*([0-9]{2,6}(?:\.[0-9]{1,2})?)',
            r'\b([0-9]{2,6}\.[0-9]{2})\s*(?:due|payable|total)?\b'
        ]
        for pat in amount_patterns:
            matches = re.finditer(pat, text, re.IGNORECASE)
            candidates = []
            for m in matches:
                try:
                    val = float(m.group(1).replace(",", "."))
                    if 1.0 <= val <= 100000.0:
                        candidates.append(val)
                except ValueError:
                    continue
            if candidates:
                amount_usd = max(candidates)
                break

        # 4. Fixed Charges
        fixed_charges = 0.0
        fixed_match = re.search(
            r'(?:fixed(?:\s*customer)?\s*charges?|demand\s*charges?|meter\s*rent|customer\s*charge|service\s*charge)\s*[:=-]?\s*[^0-9\n]{0,6}([0-9]+(?:\.[0-9]{1,2})?)',
            text,
            re.IGNORECASE
        )
        if fixed_match:
            try:
                fixed_charges = float(fixed_match.group(1))
            except ValueError:
                fixed_charges = 0.0

        # 5. Taxes / Surcharges
        tax_amount = 0.0
        tax_match = re.search(
            r'(?:regulatory\s*tax|electricity\s*duty|tax(?:es)?|vat|gst|surcharge|gov\s*tax)\s*[:=-]?\s*[^0-9\n]{0,6}([0-9]+(?:\.[0-9]{1,2})?)',
            text,
            re.IGNORECASE
        )
        if tax_match:
            try:
                tax_amount = float(tax_match.group(1))
            except ValueError:
                tax_amount = 0.0

        # 6. Rate per kWh
        rate_per_kwh = None
        rate_match = re.search(
            r'(?:rate(?:\s*per\s*(?:unit|kwh))?|tariff|energy\s*rate)\s*[:=-]?\s*[^0-9\n]{0,6}([0-9]+(?:\.[0-9]{2,4})?)',
            text,
            re.IGNORECASE
        )
        if rate_match:
            try:
                rate_per_kwh = float(rate_match.group(1))
            except ValueError:
                rate_per_kwh = None

        # Fallback calculations if some fields missing
        if energy_kwh is None and amount_usd is not None:
            # Infer roughly with $0.15/kWh if completely undetected
            energy_kwh = round(amount_usd / 0.15, 1)
        elif energy_kwh is None:
            energy_kwh = 280.0

        if amount_usd is None and energy_kwh is not None:
            rate = rate_per_kwh if rate_per_kwh else 0.15
            amount_usd = round(energy_kwh * rate + fixed_charges + tax_amount, 2)
        elif amount_usd is None:
            amount_usd = 42.0

        if rate_per_kwh is None:
            if energy_kwh > 0:
                net_energy_cost = max(0.0, amount_usd - fixed_charges - tax_amount)
                rate_per_kwh = round(net_energy_cost / energy_kwh, 3)
                if rate_per_kwh <= 0.01 or rate_per_kwh > 2.0:
                    rate_per_kwh = 0.15
            else:
                rate_per_kwh = 0.15

        # 7. Due Date
        due_date = "Due Next Cycle"
        due_match = re.search(
            r'(?:due\s*date|payment\s*due|pay\s*by|last\s*date)\s*[:=-]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}|[A-Za-z]{3,9}\s+[0-9]{1,2},?\s+[0-9]{4}|[0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{4})',
            text,
            re.IGNORECASE
        )
        if due_match:
            due_date = due_match.group(1)
        else:
            due_date = f"Due {(now + datetime.timedelta(days=21)).strftime('%b %d')}"

        # 8. Account Number
        account_number = None
        acc_match = re.search(
            r'(?:account\s*no|consumer\s*no|ca\s*no|customer\s*id|service\s*no)\s*[:=-]?\s*([A-Za-z0-9-]+)',
            text,
            re.IGNORECASE
        )
        if acc_match:
            account_number = acc_match.group(1)

        # 9. Provider Name
        provider = "Electric Utility"
        for p in ["PG&E", "ConEdison", "National Grid", "Duke Energy", "Tata Power", "Adani Electricity", "BESCOM", "MSEDCL", "Southern California Edison"]:
            if re.search(r'\b' + re.escape(p) + r'\b', text, re.IGNORECASE):
                provider = p
                break

        return {
            "month_label": month_label,
            "energy_kwh": round(energy_kwh, 1),
            "amount_usd": round(amount_usd, 2),
            "rate_per_kwh": round(rate_per_kwh, 4),
            "fixed_charges": round(fixed_charges, 2),
            "tax_amount": round(tax_amount, 2),
            "due_date": due_date,
            "account_number": account_number,
            "provider": provider,
            "raw_text_snippet": (text[:400] + "...") if len(text) > 400 else text
        }

bill_ocr_service = BillOCRService()

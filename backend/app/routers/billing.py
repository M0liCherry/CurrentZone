import os
import uuid
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import BillRecord
from app.schemas.billing import (
    BillingSummaryResponse,
    BillExtractionResponse,
    SaveBillRecordRequest
)
from app.services.grid_analytics import grid_analytics
from app.services.bill_parser import bill_ocr_service

router = APIRouter(prefix="/billing", tags=["Billing & Cost Estimation"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "bills")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/summary", response_model=BillingSummaryResponse)
def get_billing_summary(db: Session = Depends(get_db)):
    """
    Returns billing and cost estimation overview computed from real recorded telemetry
    and the latest verified electricity bill tariff.
    """
    return grid_analytics.get_billing_summary(db)

@router.post("/upload-bill", response_model=BillExtractionResponse)
async def upload_and_extract_bill(
    file: UploadFile = File(...)
):
    """
    Uploads an electricity bill image or PDF, extracts text via RapidOCR / PyPDF,
    parses energy units, billed amount, rate per kWh, fixed charges, and billing cycle.
    """
    filename = file.filename or "bill.jpg"
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".pdf"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a PNG, JPG, WEBP, or PDF electricity bill."
        )

    unique_name = f"{uuid.uuid4().hex[:12]}_{filename}"
    saved_path = os.path.join(UPLOAD_DIR, unique_name)

    content = await file.read()
    with open(saved_path, "wb") as f:
        f.write(content)

    # Extract text based on file type
    if ext == ".pdf":
        text = bill_ocr_service.extract_text_from_pdf(content)
        if not text.strip():
            # If PDF text layer was empty, fallback to image extraction if single page
            text = bill_ocr_service.extract_text_from_image(content)
    else:
        text = bill_ocr_service.extract_text_from_image(content)

    # Parse structured fields
    parsed = bill_ocr_service.parse_bill_text(text)
    
    return BillExtractionResponse(
        success=True,
        month_label=parsed["month_label"],
        energy_kwh=parsed["energy_kwh"],
        amount_usd=parsed["amount_usd"],
        rate_per_kwh=parsed["rate_per_kwh"],
        fixed_charges=parsed["fixed_charges"],
        tax_amount=parsed["tax_amount"],
        due_date=parsed["due_date"],
        account_number=parsed.get("account_number"),
        provider=parsed.get("provider"),
        image_path=f"/uploads/bills/{unique_name}",
        raw_text_snippet=parsed.get("raw_text_snippet")
    )

@router.post("/confirm-bill", response_model=BillingSummaryResponse)
def confirm_bill_record(
    data: SaveBillRecordRequest,
    db: Session = Depends(get_db)
):
    """
    Saves or updates a verified bill record in the database. Recalculates the current
    month's estimated bill projection using this newly saved tariff and live telemetry.
    """
    # Check if a bill record for this month already exists
    existing = db.query(BillRecord).filter(
        BillRecord.user_id == 1,
        BillRecord.month_label == data.month_label
    ).first()

    if existing:
        existing.amount_usd = data.amount_usd
        existing.energy_kwh = data.energy_kwh
        existing.rate_per_kwh = data.rate_per_kwh
        existing.fixed_charges = data.fixed_charges or 0.0
        existing.tax_amount = data.tax_amount or 0.0
        existing.due_date = data.due_date
        existing.status = data.status or "Paid"
        if data.image_path:
            existing.image_path = data.image_path
    else:
        new_record = BillRecord(
            user_id=1,
            month_label=data.month_label,
            amount_usd=data.amount_usd,
            energy_kwh=data.energy_kwh,
            rate_per_kwh=data.rate_per_kwh,
            fixed_charges=data.fixed_charges or 0.0,
            tax_amount=data.tax_amount or 0.0,
            due_date=data.due_date,
            status=data.status or "Paid",
            image_path=data.image_path
        )
        db.add(new_record)

    db.commit()
    return grid_analytics.get_billing_summary(db)

@router.delete("/{bill_id}")
def delete_bill_record(bill_id: int, db: Session = Depends(get_db)):
    """
    Deletes a bill record by ID.
    """
    record = db.query(BillRecord).filter(
        BillRecord.id == bill_id,
        BillRecord.user_id == 1
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Bill record not found")
    
    db.delete(record)
    db.commit()
    return {"message": "Bill record deleted successfully", "id": bill_id}

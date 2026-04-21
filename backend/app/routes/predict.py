"""
Prediction route — POST /predict/
Accepts a livestock image and returns breed prediction results.
"""

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.services.ml_service import predict_breed
from app.services.db_service import save_prediction
from app.security import verify_token

router = APIRouter()


@router.post("/")
async def predict(
    file: UploadFile = File(..., description="Livestock image (JPG/PNG/WEBP)"),
    user=Depends(verify_token),
):
    """
    Upload an image and receive livestock breed classification results.

    Returns:
    - primary_breed:    Most likely breed
    - secondary_breed:  Second most likely breed
    - confidence:       Probability (0-1) of primary breed
    - crossbreed_ratio: Probability for every class [Gir, Holstein, Jersey, Red_Sindhi, Sahiwal]
    - all_predictions:  Dict of {breed: probability}
    - class_names:      Ordered list of breed class names
    - filename:         Name of the uploaded file
    """
    # Validate file type
    if file.content_type not in ("image/jpeg", "image/png", "image/webp", "image/jpg"):
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Upload a JPG, PNG, or WEBP image.",
        )

    result = await predict_breed(file)
    await save_prediction(user["uid"], result)
    return result

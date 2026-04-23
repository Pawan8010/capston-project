"""
Prediction route — POST /predict/
Accepts a livestock image and returns breed prediction results.
"""

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.services.ml_service import get_predictor, BreedPredictor
from app.services.mongo_service import save_prediction
from app.security import verify_token
from app.utils.image_quality import check_image_sharpness
from app.services.breed_info import get_breed_info

router = APIRouter()


@router.post("/")
async def predict(
    file: UploadFile = File(..., description="Livestock image (JPG/PNG/WEBP)"),
    user=Depends(verify_token),
    predictor: BreedPredictor = Depends(get_predictor)
):
    """
    Upload an image and receive livestock breed classification results.
    """
    # Validate file type
    if file.content_type not in ("image/jpeg", "image/png", "image/webp", "image/jpg"):
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Upload a JPG, PNG, or WEBP image.",
        )

    contents = await file.read()

    # Step 2: Image quality check
    quality = check_image_sharpness(contents)
    if not quality["is_sharp"]:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "image_too_blurry",
                "message": "Image is too blurry. Please upload a clearer photo of the animal.",
                "sharpness_score": quality["score"],
                "required_minimum": quality["threshold"]
            }
        )

    result = predictor.predict(contents)
    # Add filename back if frontend needs it
    result["filename"] = file.filename
    
    # Step 6: Add breed info
    breed_info = get_breed_info(result.get("primary_breed", ""))
    result["breed_info"] = breed_info

    doc = {
        "user_id": user["uid"],
        "image_url": "", # Will be added later with Cloudinary
        "primary_breed": result.get("primary_breed"),
        "secondary_breed": result.get("secondary_breed"),
        "confidence": result.get("confidence"),
        "crossbreed_ratio": result.get("crossbreed_ratio"),
        "all_probabilities": result.get("all_probabilities"),
        "breed_info": breed_info,
        "health_status": "Healthy", # Will be updated later
        "health_issue": None,
        "latitude": None,
        "longitude": None,
        "inference_ms": 0.0 # Can be calculated later
    }
    
    inserted_id = await save_prediction(doc)
    result["id"] = inserted_id
    return result

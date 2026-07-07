# LivestockAI Setup

This project only gives real breed accuracy after a trained TensorFlow model exists at `ml-service/models/breed_model.h5`. If the file is missing, prediction endpoints return `503` with instructions instead of making fake breed guesses.

## 1. Backend Secrets

Create `backend/.env` from `backend/.env.example`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/finalyearproject
DB_NAME=finalyearproject
MONGO_DB=finalyearproject
MODEL_PATH=ml-service/models/breed_model.h5
CLASS_INDEX_PATH=ml-service/models/class_indices.json
FIREBASE_CREDENTIALS_PATH=backend/firebase-adminsdk.json
AUTH_ALLOW_MOCK=false
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
BLUR_THRESHOLD=100.0
```

For local demo login without Firebase Admin, set `AUTH_ALLOW_MOCK=true`. For real auth, keep it `false`.

## 2. Firebase Admin

1. Open Firebase Console for your project.
2. Go to Project settings > Service accounts.
3. Generate a new private key.
4. Save it as `backend/firebase-adminsdk.json`, or set `FIREBASE_CREDENTIALS_PATH` to its path.

Do not commit this file. `.gitignore` already excludes it.

## 3. MongoDB

Create a MongoDB Atlas cluster, database user, and connection string. Put that string in `backend/.env` as `MONGO_URI`.

On backend startup, logs show whether MongoDB connected. `/health` also includes `mongo_connected`.

## 4. OpenAI Chatbot

Create an API key at `https://platform.openai.com/api-keys` and set:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

If the key is missing or the API fails, `/api/voice-query/` falls back to the built-in rule-based livestock responder instead of crashing.

## 5. Dataset Preparation

Install Kaggle credentials first. On Windows, place `kaggle.json` at:

```text
C:\Users\<you>\.kaggle\kaggle.json
```

Then run:

```bash
python ml-service/scripts/prepare_dataset.py
```

To use the specific Indian cattle dataset URL directly:

```bash
python ml-service/scripts/prepare_dataset.py --dataset https://www.kaggle.com/datasets/atharvadarpude/indian-cattle-image-dataset
```

To use only the Kaggle dataset you provided:

```bash
python ml-service/scripts/prepare_dataset.py --dataset atharvadarpude/indian-cattle-image-dataset
```

The script downloads and merges public Kaggle cattle datasets, keeps only these classes:

- `Gir`
- `Holstein`
- `Jersey`
- `Red_Sindhi`
- `Sahiwal`

It verifies images with PIL, removes duplicates by SHA-256, creates `data/train`, `data/val`, `data/test`, and writes `ml-service/data/dataset_manifest.csv`.

Important: these public datasets are community-labeled. Spot-check every class folder before training, especially `Sahiwal` vs `Red_Sindhi`.

## 6. Train The Model

Run:

```bash
bash scripts/train_model.sh
```

The training pipeline uses MobileNetV2 with:

- 224x224 images
- training-only augmentation
- MobileNetV2 `preprocess_input`
- frozen-base training, then top-layer fine-tuning
- class weights for imbalanced data
- held-out test evaluation

Outputs:

- `ml-service/models/breed_model.h5`
- `ml-service/models/breed_model.keras`
- `ml-service/models/class_indices.json`
- `ml-service/models/eval_report.json`
- `ml-service/models/confusion_matrix.png`

Training fails if test accuracy is below `70%`. You can change the gate with:

```bash
MIN_TEST_ACCURACY=0.75 bash scripts/train_model.sh
```

CPU training can take hours. A GPU can reduce this to tens of minutes depending on dataset size.

## 7. Verify Real Mode

Restart the backend after training and check:

```bash
curl http://127.0.0.1:8000/health
```

Real mode requires:

```json
"model_mode": "tensorflow"
```

Then smoke test:

- `POST /api/predict/` with a cattle image
- `POST /api/realtime-predict/` with a base64 frame
- `POST /api/voice-query/` with a livestock question
- frontend `npm run build`
- backend `pytest backend/tests -q`

Until the trained model exists, `/predict` and `/realtime-predict` intentionally return `503` instead of fake accuracy.

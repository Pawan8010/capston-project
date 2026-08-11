# LivestockAI — Indian Cattle & Buffalo Breed Recognition

Identify Indian cattle and buffalo breeds from a photo or a live camera feed, then
get breed-specific husbandry guidance — milk yield, climate fit, feed, and disease risk.

| Layer | Stack |
|---|---|
| Frontend | React 18 + Vite, Framer Motion, Recharts, Leaflet, Firebase Auth |
| Backend | FastAPI, Motor (MongoDB), Firebase Admin |
| ML | PyTorch transfer learning, exported as TorchScript. Ships a 50-breed MobileNetV3-Small; `train.py` trains your own |
| Data | Public Indian cattle/buffalo photo set from the Hugging Face Hub |

---

## Quick start

```bash
# 1. Python environment
python -m venv .venv
.venv\Scripts\activate            # Windows
# source .venv/bin/activate       # macOS / Linux
pip install -r requirements.txt

# 2. Config (both files already have working defaults)
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env

# 3. Train the model  (see "Training" below — takes a while on CPU)
python ml-service/scripts/download_dataset.py
python ml-service/scripts/prepare_dataset.py
python ml-service/train.py

# 4. Run
cd backend && python -m uvicorn app.main:app --reload    # → http://127.0.0.1:8000
cd frontend && npm install && npm run dev                # → http://localhost:5173
```

Check everything is wired up:

```bash
curl http://127.0.0.1:8000/health
```

```json
{ "status": "ok", "model_loaded": true, "model_mode": "pytorch",
  "model_arch": "mobilenet_v3_small", "num_classes": 50 }
```

### It runs without MongoDB, Firebase or an OpenAI key

Each external service is optional and degrades cleanly:

| Missing | What happens |
|---|---|
| MongoDB | Falls back to in-memory storage. History and analytics work; data is lost on restart. |
| Firebase service account | With `AUTH_ALLOW_MOCK=true`, requests resolve to a demo user. |
| OpenAI key | The assistant uses the built-in rule-based responder. |
| Trained model | `/api/predict` returns **503** instead of inventing a breed. |

That last one is deliberate. A breed guess with no model behind it is worse than no answer.

---

## Using an existing model

If you already have a trained checkpoint, import it instead of training:

```bash
python ml-service/scripts/import_model.py final_model.pt.zip
```

It reads a `torch.save` dict of `{model_state, class_names, config}`, rebuilds
the backbone named in `config["backbone"]`, and writes the four files the
backend loads — TorchScript graph, state dict, label list and metadata. The
export is round-tripped and compared against the source model, so a broken
conversion fails at import rather than at inference. A bare `state_dict` works
too, with `--arch` and `--classes`.

The checkpoint records no normalisation constants, so ImageNet mean/std are
assumed. Override with `--mean`/`--std` if your pipeline used something else —
wrong constants degrade accuracy quietly instead of raising.

The model currently shipped this way is a **MobileNetV3-Small over 50 Indian
cattle breeds** at 224px.

---

## Training your own

Python 3.13+ has no TensorFlow wheel, so the pipeline runs on **PyTorch**, which
supports every version this project targets.

```bash
python ml-service/scripts/download_dataset.py   # ~500 MB, no Kaggle account needed
python ml-service/scripts/prepare_dataset.py    # dedupe + verify + split
python ml-service/train.py                      # two-phase transfer learning
```

**`download_dataset.py`** pulls [`mr-rxa/Cattle-Buffalo-Datatset`](https://huggingface.co/datasets/mr-rxa/Cattle-Buffalo-Datatset)
from the Hugging Face Hub — public, no credentials required.

**`prepare_dataset.py`** does the unglamorous but essential work:

- opens every file with PIL and drops anything corrupt
- de-duplicates on a hash of the decoded 64×64 pixels, so re-encodes and resizes
  of the same photo collapse to one copy — the source ships each breed twice
- drops breeds with fewer than `--min-images` photos (default 40)
- writes a stratified `train`/`val`/`test` split with a fixed seed

The de-duplication matters: without it the same photo lands in both train and test
and the reported accuracy is fiction.

**`train.py`** fine-tunes an ImageNet-pretrained backbone in two phases — frozen
backbone to settle the head, then full fine-tuning on a one-cycle schedule — with
RandAugment, class-balanced sampling, and label smoothing. It writes:

```
ml-service/models/
├── breed_model.pt         TorchScript graph loaded by the backend
├── breed_model_state.pt   raw state_dict
├── class_names.json       label order
├── model_meta.json        arch, image size, normalisation constants
├── eval_report.json       held-out test accuracy + per-class report
└── confusion_matrix.png
```

Useful flags:

```bash
python ml-service/train.py --arch resnet50 --epochs-finetune 35
python ml-service/train.py --min-accuracy 0.75      # fail the run below this
python ml-service/scripts/prepare_dataset.py --min-images 60   # fewer, better-supported classes
```

Test a trained model straight from the CLI:

```bash
python ml-service/predict.py photo.jpg --info
```

---

## API

All routes except `/health`, `/`, and `/api/breeds` require
`Authorization: Bearer <firebase-id-token>` (or `Bearer demo-token` when
`AUTH_ALLOW_MOCK=true`).

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Model + database status |
| GET | `/api/breeds` | Breeds the loaded model can predict |
| POST | `/api/predict/` | Classify an uploaded image (multipart) |
| POST | `/api/realtime-predict/` | Classify a base64 camera frame |
| GET | `/api/history/` | Prediction history (`?breed=`, `?from_date=`, `?limit=`) |
| GET | `/api/history/{id}` | One prediction |
| DELETE | `/api/history/{id}` | Delete a prediction |
| POST | `/api/history/{id}/feedback` | Mark a prediction right or wrong |
| POST | `/api/auth/sync` | Upsert the signed-in user |
| GET | `/api/auth/me` | Current user + role |
| GET | `/api/analytics/user` | Per-user scan analytics |
| GET | `/api/analytics/admin` | Global analytics (admin only) |
| GET | `/api/admin/stats` | Totals, breed distribution, daily counts (admin only) |
| GET | `/api/admin/users` | User list (admin only) |
| POST | `/api/voice-query/` | Ask the livestock assistant |

Interactive docs at `http://127.0.0.1:8000/docs`.

Admin access is granted by email: add yours to `ADMIN_EMAILS` in `backend/.env`
and sign in again. Roles are never accepted from the client.

---

## Project layout

```
frontend/          React app
  src/components/ui/      design-system primitives (Button, Card, Input, Stat, …)
  src/components/layout/  app frame (AppShell, Sidebar, PageHeader)
  src/components/         domain components (ResultCard, CameraScanner, …)
  src/pages/       Routed screens
  src/services/    api.js (backend calls) and auth.js (Firebase)
  src/context/     Auth, Theme, Language providers
  src/styles/      tokens · base · ui · shell · features (imported in this order)
  src/index.css    stylesheet entry point — imports the layers above

backend/           FastAPI service
  app/routes/      predict, realtime, history, auth, admin, analytics, voice
  app/services/    ml_service (inference), mongo_service (data), breed_info, chat_service
  app/core/        settings
  tests/           pytest suite

ml-service/        Training pipeline
  scripts/         download_dataset.py, prepare_dataset.py
  train.py         two-phase transfer learning
  predict.py       CLI inference
  models/          trained artefacts (git-ignored)
```

---

## Tests

```bash
.venv\Scripts\python.exe -m pytest backend/tests -q
cd frontend && npm run build
```

The API tests pass whether or not a model is trained: prediction endpoints are
asserted to return either a well-formed result or a 503 explaining how to train one.

---

## Notes on accuracy

The breed list is whatever the dataset genuinely supports — breeds with too few
real photos are dropped rather than padded with augmented copies. Reported
accuracy comes from a held-out test split that shares no image (and no duplicate
of an image) with training.

Some Indian breeds are genuinely hard to tell apart from a photo — Sahiwal vs
Red Sindhi, or Cattle Bargur vs Buffalo Bargur — and per-class scores in
`eval_report.json` will show that honestly. Check the confusion matrix before
trusting any single number.

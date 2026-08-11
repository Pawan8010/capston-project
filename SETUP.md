# LivestockAI — Setup

Step-by-step setup, from a fresh clone to a working app with a trained model.

Everything except the model has a working default, so you can get the UI running
in about five minutes and train later.

---

## 0. Requirements

| Tool | Version | Notes |
|---|---|---|
| Python | 3.10 – 3.14 | PyTorch is used precisely because 3.13+ has no TensorFlow wheel |
| Node.js | 18+ | For the Vite frontend |
| MongoDB | any | **Optional** — omit it and the app uses in-memory storage |

Check what you have:

```bash
python --version
node --version
```

---

## 1. Python environment

```bash
python -m venv .venv

.venv\Scripts\activate          # Windows PowerShell / cmd
source .venv/bin/activate       # macOS / Linux

pip install -r requirements.txt
```

That installs both the backend and the training stack. For a lighter install use
`backend/requirements.txt` (serving only) or `ml-service/requirements.txt` (training only).

The PyTorch download is a few hundred MB and is the slow part.

---

## 2. Configuration

```bash
copy backend\.env.example backend\.env       # Windows
copy frontend\.env.example frontend\.env

# cp backend/.env.example backend/.env       # macOS / Linux
# cp frontend/.env.example frontend/.env
```

`backend/.env` works unedited. The values worth knowing about:

| Key | Default | Meaning |
|---|---|---|
| `MONGO_URI` | `mongodb://localhost:27017` | Unreachable → in-memory fallback |
| `AUTH_ALLOW_MOCK` | `true` | Accept any request as a demo user. **Set `false` before deploying.** |
| `ADMIN_EMAILS` | *(empty)* | Comma-separated emails that get the admin role |
| `OPENAI_API_KEY` | *(empty)* | Empty → rule-based assistant |
| `BLUR_THRESHOLD` | `100.0` | Laplacian-variance floor for rejecting blurry uploads |
| `MODEL_PATH` | `ml-service/models/breed_model.pt` | Written by `train.py` |

`frontend/.env` holds the Firebase web config. The shipped values point at an
existing project; replace them with your own from
**Firebase Console → Project settings → General → Your apps → SDK setup and config**.
These keys are public by design — Firebase security rules do the actual protecting.

---

## 3. Frontend dependencies

```bash
cd frontend
npm install
```

---

## 4. Train the model

Until this is done, `/api/predict` returns **503**. That is intentional: the app
refuses to guess a breed with no model behind it.

### 4.1 Download the dataset

```bash
python ml-service/scripts/download_dataset.py
```

Pulls [`mr-rxa/Cattle-Buffalo-Datatset`](https://huggingface.co/datasets/mr-rxa/Cattle-Buffalo-Datatset)
from the Hugging Face Hub — public, **no account or API token needed**.

It downloads a few hundred MB and resumes if interrupted, so just re-run it if
your connection drops. Use `--force` to start over.

### 4.2 Clean and split

```bash
python ml-service/scripts/prepare_dataset.py
```

This step is what makes the accuracy number mean anything:

- opens every image with PIL and discards corrupt files
- de-duplicates on a hash of the decoded 64×64 pixels — the source ships each
  breed under both `<Group> Breeds/` and `<Group> Images/`, and the same photo
  appears at different sizes and JPEG qualities
- drops breeds with fewer than 40 photos (`--min-images`)
- writes a stratified `train`/`val`/`test` split with a fixed seed

Without the de-duplication, copies of one photo end up in both train and test and
the model appears far better than it is.

Fewer classes with more images each:

```bash
python ml-service/scripts/prepare_dataset.py --min-images 80
```

Output goes to `ml-service/data/{train,val,test}/<Class>/`, plus
`dataset_manifest.csv` recording where every kept image came from.

### 4.3 Train

```bash
python ml-service/train.py
```

Two-phase transfer learning on an ImageNet-pretrained EfficientNet-B0:

1. **Head only** — backbone frozen, classifier learns the new breeds
2. **Fine-tune** — everything unfrozen on a one-cycle LR schedule

With RandAugment, colour jitter, random erasing, class-balanced sampling, label
smoothing, and gradient clipping. The best epoch by validation accuracy is kept.

On an 8-core CPU expect **1–3 hours**. A CUDA GPU is picked up automatically and
cuts that to minutes.

Useful flags:

```bash
python ml-service/train.py --arch resnet50          # or convnext_tiny, mobilenet_v3_large
python ml-service/train.py --epochs-finetune 35     # train longer
python ml-service/train.py --batch-size 16          # if you run out of memory
python ml-service/train.py --workers 0              # if DataLoader workers misbehave on Windows
python ml-service/train.py --min-accuracy 0.75      # fail the run below this test accuracy
```

Artefacts land in `ml-service/models/`:

| File | Purpose |
|---|---|
| `breed_model.pt` | TorchScript graph the backend loads |
| `breed_model_state.pt` | Raw `state_dict` for resuming or re-export |
| `class_names.json` | Label order |
| `model_meta.json` | Arch, image size, normalisation constants |
| `eval_report.json` | Held-out accuracy, macro-F1, per-class report |
| `confusion_matrix.png` | Which breeds get confused with which |

**Read the confusion matrix before trusting the headline number.** Some breeds
are genuinely hard to separate from a photo.

---

## 5. Run

Two terminals:

```bash
# Terminal 1 — backend
cd backend
python -m uvicorn app.main:app --reload
```

```bash
# Terminal 2 — frontend
cd frontend
npm run dev
```

- App: <http://localhost:5173>
- API docs: <http://127.0.0.1:8000/docs>

Confirm the model loaded:

```bash
curl http://127.0.0.1:8000/health
```

```json
{ "status": "ok", "model_loaded": true, "model_mode": "pytorch",
  "model_arch": "mobilenet_v3_small", "num_classes": 50 }
```

`"model_mode": "model-missing"` means training has not produced
`ml-service/models/breed_model.pt` yet.

---

## 6. Optional services

### MongoDB

Install locally, or create a free MongoDB Atlas cluster and put the connection
string in `MONGO_URI`. Without it, predictions and history live in memory and are
lost when the backend restarts. `/health` reports `mongo_connected`.

### Firebase Admin (real authentication)

1. Firebase Console → **Project settings → Service accounts**
2. **Generate new private key**
3. Save as `backend/firebase-adminsdk.json` (git-ignored)
4. Set `AUTH_ALLOW_MOCK=false` in `backend/.env`

Backend now verifies real Firebase ID tokens. Leave `AUTH_ALLOW_MOCK=true` only
for local development — it accepts *any* request as a demo user.

### Admin access

Add your email to `ADMIN_EMAILS` in `backend/.env` and sign in again:

```env
ADMIN_EMAILS=you@example.com,teammate@example.com
```

Roles are assigned server-side from this allowlist. The client cannot set its own role.

### OpenAI assistant

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Without a key, `/api/voice-query/` uses the built-in rule-based responder that
answers from the breed database.

---

## 7. Verify

```bash
# Backend tests
.venv\Scripts\python.exe -m pytest backend/tests -q

# Frontend production build
cd frontend && npm run build

# CLI inference against a real photo
python ml-service/predict.py path/to/cow.jpg --info
```

---

## Troubleshooting

**`No matching distribution found for tensorflow`**
Expected on Python 3.13+. This project uses PyTorch instead — install with
`pip install -r requirements.txt`.

**`/api/predict` returns 503**
No trained model. Run the three commands in step 4.

**Download fails with a CAS / xet error**
A Hugging Face CDN hiccup. Just re-run `download_dataset.py` — it resumes from
what is already on disk and retries automatically.

**Frontend shows "Model offline" in the navbar**
The backend is unreachable or has no model. Check it is running on port 8000 and
that `VITE_API_BASE_URL` in `frontend/.env` matches.

**Every API call returns 401**
`AUTH_ALLOW_MOCK=false` without `backend/firebase-adminsdk.json`. Either add the
service account file or set `AUTH_ALLOW_MOCK=true` for local work.

**Training is slow / runs out of memory**
Lower `--batch-size`, or use `--arch mobilenet_v3_large` for a lighter model.
On Windows, `--workers 0` avoids DataLoader subprocess overhead.

**Frontend changes to `.env` do nothing**
Vite reads `.env` at startup. Restart `npm run dev`.

## 📁 Project Structure

```bash
livestock-ai-system/
│
├── frontend/                 # React App (UI)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/           # Images, icons
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── UploadBox.jsx
│   │   │   ├── ResultCard.jsx
│   │   │   ├── Loader.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Result.jsx
│   │   │   ├── History.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── services/
│   │   │   ├── api.js        # Backend API calls
│   │   │   └── auth.js       # Firebase auth logic
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useUpload.js
│   │   ├── firebase/
│   │   │   └── firebase.js   # Firebase config
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                  # FastAPI Backend
│   ├── app/
│   │   ├── main.py           # Entry point
│   │   ├── routes/
│   │   │   ├── predict.py    # Prediction API
│   │   │   ├── auth.py       # User sync
│   │   │   └── history.py    # Fetch history
│   │   ├── services/
│   │   │   ├── ml_service.py # Model logic
│   │   │   └── db_service.py # MongoDB logic
│   │   ├── models/
│   │   │   └── schemas.py    # Request/Response schemas
│   │   ├── utils/
│   │   │   └── preprocess.py # Image preprocessing
│   │   ├── security.py       # Firebase token verify
│   │   ├── firebase_admin.py # Firebase Admin SDK
│   │   └── config.py         # MongoDB connection
│   ├── storage/
│   │   └── uploads/          # Uploaded images
│   ├── requirements.txt
│   └── .env
│
├── ml-service/               # ML Training (Colab/Local)
│   ├── models/
│   │   └── breed_model.h5    # Trained model
│   ├── train.py              # Training script
│   ├── predict.py            # Local testing
│   └── preprocess.py
│
├── database/
│   ├── mongo_schema.js       # DB structure
│   └── seed_data.json
│
├── docker/                   # Deployment (Optional)
│   ├── Dockerfile.backend
│   └── docker-compose.yml
│
├── scripts/
│   ├── run_backend.sh
│   ├── run_frontend.sh
│   └── train_model.sh
│
├── .gitignore
├── README.md
└── requirements.txt
```
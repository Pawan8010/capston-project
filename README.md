# capston-project


livestock-ai-system/
│
├── frontend/                          # React App (UI)
│   ├── public/
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── assets/                    # Images, icons
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── UploadBox.jsx
│   │   │   ├── ResultCard.jsx
│   │   │   ├── Loader.jsx
│   │   │   └── Sidebar.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Result.jsx
│   │   │   ├── History.jsx
│   │   │   └── Login.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js                 # API calls
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Authentication state
│   │   │
│   │   ├── hooks/
│   │   │   └── useUpload.js
│   │   │
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                           # FastAPI Backend
│   ├── app/
│   │   ├── main.py                   # Entry point
│   │   │
│   │   ├── routes/
│   │   │   ├── predict.py
│   │   │   ├── auth.py
│   │   │   └── history.py
│   │   │
│   │   ├── services/
│   │   │   ├── ml_service.py
│   │   │   └── db_service.py
│   │   │
│   │   ├── models/
│   │   │   └── schemas.py            # Pydantic schemas
│   │   │
│   │   ├── utils/
│   │   │   ├── preprocess.py
│   │   │   └── security.py
│   │   │
│   │   └── config.py
│   │
│   ├── requirements.txt
│   └── .env
│
├── ml-service/                        # ML Model Layer
│   ├── models/
│   │   ├── breed_model.h5
│   │   ├── disease_model.h5
│   │   └── labels.json
│   │
│   ├── predict.py
│   ├── train.py
│   ├── preprocess.py
│   └── requirements.txt
│
├── database/                          # Database Scripts
│   ├── mongo_schema.js
│   └── seed_data.json
│
├── storage/                           # Uploaded Images
│   └── uploads/
│
├── docker/                            # Deployment Config
│   ├── Dockerfile.backend
│   ├── Dockerfile.ml
│   └── docker-compose.yml
│
├── scripts/                           # Utility Scripts
│   ├── run_backend.sh
│   ├── run_frontend.sh
│   └── train_model.sh
│
├── .gitignore
├── README.md
└── requirements.txt

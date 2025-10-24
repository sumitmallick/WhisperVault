from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .api.confessions import router as confessions_router
from .api.publish import router as publish_router

app = FastAPI(title="Confessions API", version="0.1.0")

# CORS for local Next.js dev and any future domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",              # Local development
        "https://your-vercel-app.vercel.app", # Your Vercel domain
        "https://*.vercel.app",               # All Vercel preview URLs
    ]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await init_db()


@app.get("/")
def read_root():
    return {"service": "confessions-api", "status": "ok"}


@app.get("/health")
def health():
    return {"ok": True}


app.include_router(confessions_router)
app.include_router(publish_router)

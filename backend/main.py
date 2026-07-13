import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.api.api import api_router
from app.models.user import User
from app.models.paper import ResearchPaper
from app.models.category import Category
from app.core.security import get_password_hash
from app.ml_engine.classifier import ml_classifier
from app.ml_engine.summarizer import summarizer

def seed_initial_data():
    import time
    from sqlalchemy.exc import OperationalError
    
    retries = 10
    while retries > 0:
        try:
            Base.metadata.create_all(bind=engine)
            break
        except OperationalError as e:
            retries -= 1
            print(f"Database connection failed ({e}). Retrying in 3 seconds... ({retries} retries left)", flush=True)
            time.sleep(3)

    db = SessionLocal()
    try:
        # 1. Seed Users
        if db.query(User).count() == 0:
            admin_user = User(
                email="admin@college.edu",
                full_name="Dr. Eleanor Vance (Dean of Research)",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                department="Central Research Office",
                is_active=True
            )
            faculty_user = User(
                email="faculty@college.edu",
                full_name="Prof. Robert Langdon (CS Dept)",
                hashed_password=get_password_hash("faculty123"),
                role="faculty",
                department="Computer Science",
                is_active=True
            )
            db.add_all([admin_user, faculty_user])
            db.commit()

        # 2. Seed Categories
        if db.query(Category).count() == 0:
            default_cats = [
                ("Artificial Intelligence", "Deep learning, LLMs, and neural architectures"),
                ("Quantum Computing", "Qubit mechanics, superfluidity, and quantum algorithms"),
                ("Nanotechnology & Materials", "Graphene nanosheets, catalysts, and smart materials"),
                ("Genomics & CRISPR", "Gene editing, transcriptome analysis, and bioinformatics"),
                ("Renewable Energy & Evs", "Battery thermal management, smart grids, and clean tech"),
                ("Cybersecurity & Cloud", "Blockchain consensus, vulnerability detection, and network security"),
                ("6G & Wireless Tech", "Millimeter-wave CMOS transceivers and antenna design"),
                ("Financial Econometrics", "Stochastic differential equations and market dynamics")
            ]
            for name, desc in default_cats:
                db.add(Category(name=name, description=desc, is_custom=False))
            db.commit()

        # Seed Research Papers
        if db.query(ResearchPaper).count() == 0:
            sample_papers = [
                {
                    "title": "SEF-QIM: Scale-based Embedding Factor Quantization Index Modulation Image Watermarking for Tamper Detection and Localization",
                    "abstract": "Watermarking algorithms must resist malicious tampering while maintaining high fidelity. We propose a scale-based embedding factor quantization index modulation (SEF-QIM) scheme tailored for secure image authentication, providing localization and tamper detection capacity.",
                    "authors_list": ["Dr. Aditya Kumar Sahu", "Dr. Aravind Patel"],
                    "department": "Computer Science",
                    "journal": "Analog Integrated Circuits and Signal Processing",
                    "year": 2026,
                    "doi": "10.1007/s00034-026-03670-8",
                    "cats": ["Artificial Intelligence", "Cybersecurity & Cloud"]
                },
                {
                    "title": "Augmented Jet Impingement Cooling System for High-Heat Flux Electronics Through Mitigating Radial Jet-to-Jet Interaction by Employing Rectilinear and Curvilinear Separators",
                    "abstract": "Jet impingement systems suffer from radial jet interaction which degrades thermal dissipation efficiency. We introduce rectilinear and curvilinear separators to minimize crossflow interference, improving peak heat transfer rates in electronic thermal management setups.",
                    "authors_list": ["Dr. Lakshmi Sirisha Maganti", "Prof. Nikola Tesla"],
                    "department": "Mechanical Engineering",
                    "journal": "Applied Thermal Engineering",
                    "year": 2026,
                    "doi": "10.1016/j.applthermaleng.2025.121049",
                    "cats": ["Renewable Energy & Evs", "Nanotechnology & Materials"]
                },
                {
                    "title": "Synergistic Molecular Design-Triggered Hybridized Local and Charge-Transfer Emission for Efficient (> 6%) Deep-Blue Electroluminescence",
                    "abstract": "Deep-blue organic light-emitting diodes (OLEDs) require optimal charge-transfer structures. We report a hybridized local and charge-transfer (HLCT) state emission design that achieves external quantum efficiencies exceeding 6% with narrow color purity.",
                    "authors_list": ["Dr. Venkatramaiah Nutalapati", "Prof. Marie Curie"],
                    "department": "Chemistry",
                    "journal": "Journal of the American Chemical Society",
                    "year": 2026,
                    "doi": "10.1039/D6TC00512H",
                    "cats": ["Nanotechnology & Materials", "Renewable Energy & Evs"]
                },
                {
                    "title": "Superconducting Qubit Decoherence Time Extension in Ultra-Low Temperature Cryogenic Circuits",
                    "abstract": "We investigate decoherence limits in superconducting planar qubits. By applying surface chemical treatment and reducing ambient thermal radiation via cryogenic filtration, we extend coherence times significantly, verifying properties below 10 milli-Kelvin.",
                    "authors_list": ["Dr. Richard Feynman", "Dr. Elena Rostova"],
                    "department": "Physics",
                    "journal": "Physical Review Letters",
                    "year": 2026,
                    "doi": "10.1103/PhysRevLett.136.080402",
                    "cats": ["Quantum Computing", "Nanotechnology & Materials"]
                },
                {
                    "title": "CRISPR-Cas9 Precision Genome Editing Efficiency and Off-Target Profiling in Pluripotent Stem Cells",
                    "abstract": "To map genomic cleavage precision, we perform deep sequence profiling on high-fidelity Cas9 editors. Our analysis quantifies off-target events, validating high-efficiency targeted knock-in protocols for safe therapeutic applications.",
                    "authors_list": ["Dr. Sarah Jenkins", "Prof. Robert Langdon"],
                    "department": "Biotechnology",
                    "journal": "Nature Biotechnology",
                    "year": 2026,
                    "doi": "10.1038/s41587-026-02938-x",
                    "cats": ["Genomics & CRISPR", "Artificial Intelligence"]
                },
                {
                    "title": "Stochastic Differential Equations and Martingale Convergence in High-Frequency Derivative Pricing",
                    "abstract": "This study analyzes martingale properties in jump-diffusion pricing models. By applying stochastic integrals and proving stability theorems, we formulate robust analytical approximations for pricing financial derivatives.",
                    "authors_list": ["Prof. John Nash", "Dr. Sarah Jenkins"],
                    "department": "Mathematics",
                    "journal": "Journal of Financial Econometrics",
                    "year": 2025,
                    "doi": "10.1093/jjfinec/nbz034",
                    "cats": ["Financial Econometrics", "Artificial Intelligence"]
                }
            ]

            for sp in sample_papers:
                ai_sum = summarizer.summarize(sp["abstract"], max_sentences=2)
                
                # Predict true department and confidence using the trained ML model
                email_text_format = f"Fwd: Paper Published by {', '.join(sp['authors_list'])}. Title of the paper: {sp['title']}. Journal: {sp['journal']}."
                pred = ml_classifier.predict_department(email_text_format)
                
                p = ResearchPaper(
                    title=sp["title"],
                    abstract=sp["abstract"],
                    authors_raw=", ".join(sp["authors_list"]),
                    authors_list=sp["authors_list"],
                    department=sp["department"],
                    journal_or_conference=sp["journal"],
                    publication_date=f"{sp['year']}-06-15",
                    publication_year=sp["year"],
                    doi=sp["doi"],
                    keywords_list=sp["cats"],
                    categories_list=sp["cats"],
                    ml_confidence=pred["confidence"],
                    ml_predicted_dept=pred["department"],
                    ai_summary=ai_sum,
                    email_source_subject=f"FWD: papers published - {sp['title'][:30]}...",
                    citation_count=sp["year"] % 10 * 4 + 7
                )
                db.add(p)
            db.commit()
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: retrain/initialize models, then seed initial data
    ml_classifier.retrain_models() # ensure ML models are initialized
    seed_initial_data()
    
    # Start Real Email Poller background worker
    from app.services.email_poller import email_poller
    email_poller.start()
    
    yield
    # Shutdown
    email_poller.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Automated Research Publication Tracking and Management System with AI & ML capabilities.",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount static directories for PDF access
app.mount("/static/pdfs", StaticFiles(directory=settings.STORAGE_DIR), name="pdfs")
app.mount("/static/exports", StaticFiles(directory=settings.EXPORTS_DIR), name="exports")

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": "1.0.0",
        "ml_engine": "active"
    }

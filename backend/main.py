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
    Base.metadata.create_all(bind=engine)
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

        # 3. Seed Research Papers
        if db.query(ResearchPaper).count() == 0:
            sample_papers = [
                {
                    "title": "Deep Learning Transformer Neural Networks for Multimodal Academic Document Extraction",
                    "abstract": "We present an automated document understanding framework leveraging vision-language transformer models to parse complex academic layouts. Our experimental results demonstrate a 94.2% precision in bibliographic footprint extraction across 50,000 multi-column PDF publications, significantly outperforming traditional regex-based scraping methods.",
                    "authors_list": ["Dr. Eleanor Vance", "Prof. Robert Langdon", "Dr. Aravind Patel"],
                    "department": "Computer Science",
                    "journal": "IEEE Transactions on Neural Networks and Learning Systems",
                    "year": 2026,
                    "doi": "10.1109/TNNLS.2026.1049283",
                    "cats": ["Artificial Intelligence", "Cybersecurity & Cloud"],
                    "conf": 0.98
                },
                {
                    "title": "Superconducting Qubit Decoherence Time Extension in Ultra-Low Temperature Cryogenic Circuits",
                    "abstract": "Decoherence remains the primary bottleneck in scaling noisy intermediate-scale quantum (NISQ) computers. In this paper, we report a 4x extension in T2 coherence times for planar superconducting qubits by applying surface passivation treatments and shielding against ambient electromagnetic fluctuations.",
                    "authors_list": ["Dr. Richard Feynman", "Dr. Aravind Patel", "Dr. Elena Rostova"],
                    "department": "Physics",
                    "journal": "Physical Review Letters",
                    "year": 2026,
                    "doi": "10.1103/PhysRevLett.136.080402",
                    "cats": ["Quantum Computing", "Nanotechnology & Materials"],
                    "conf": 0.96
                },
                {
                    "title": "Synthesis and Catalytic Performance of Metal-Organic Frameworks for Direct Atmospheric Carbon Capture",
                    "abstract": "Addressing global climate shifts necessitates high-throughput carbon dioxide sequestration. We synthesized novel porous metal-organic frameworks (MOFs) functionalized with amine ligands, exhibiting unprecedented CO2 adsorption selectivity over N2 and H2O at ambient temperatures.",
                    "authors_list": ["Dr. Elena Rostova", "Prof. Marie Curie"],
                    "department": "Chemistry",
                    "journal": "Journal of the American Chemical Society",
                    "year": 2025,
                    "doi": "10.1021/jacs.5b10394",
                    "cats": ["Nanotechnology & Materials", "Renewable Energy & Evs"],
                    "conf": 0.94
                },
                {
                    "title": "CRISPR-Cas9 Precision Genome Editing Efficiency and Off-Target Profiling in Pluripotent Stem Cells",
                    "abstract": "Therapeutic genome modification requires absolute target specificity. Utilizing whole-genome sequencing and high-fidelity Cas9 variants, we mapped off-target cleavage anomalies in human embryonic pluripotent stem cells, establishing a robust protocol for safe clinical translation.",
                    "authors_list": ["Dr. Sarah Jenkins", "Dr. David Baltimore", "Prof. Robert Langdon"],
                    "department": "Biotechnology",
                    "journal": "Nature Biotechnology",
                    "year": 2026,
                    "doi": "10.1038/s41587-026-02938-x",
                    "cats": ["Genomics & CRISPR", "Artificial Intelligence"],
                    "conf": 0.97
                },
                {
                    "title": "Thermal Management and Battery Heat Dissipation Optimization for Next-Generation Electric Vehicles",
                    "abstract": "High-rate charging of lithium-ion battery packs generates intense localized thermal gradients. We propose an integrated phase-change material (PCM) liquid cooling architecture that restricts maximum cell temperature rise to under 4 degrees Celsius during fast DC charging cycles.",
                    "authors_list": ["Prof. Nikola Tesla", "Dr. Eleanor Vance"],
                    "department": "Mechanical Engineering",
                    "journal": "Applied Thermal Engineering",
                    "year": 2025,
                    "doi": "10.1016/j.applthermaleng.2025.121049",
                    "cats": ["Renewable Energy & Evs", "Nanotechnology & Materials"],
                    "conf": 0.93
                },
                {
                    "title": "Design of Ultra-Low Power CMOS Millimeter-Wave Transceivers for 6G Mobile Communication Networks",
                    "abstract": "As 5G networks mature, research shifts toward 6G terahertz and millimeter-wave frequencies. We present a 140 GHz CMOS transceiver architecture achieving a data rate of 50 Gbps while consuming only 65 mW of DC power, paving the way for ubiquitous wireless sensing.",
                    "authors_list": ["Dr. Aravind Patel", "Prof. Nikola Tesla"],
                    "department": "Electrical Engineering",
                    "journal": "IEEE Journal of Solid-State Circuits",
                    "year": 2026,
                    "doi": "10.1109/JSSC.2026.3094821",
                    "cats": ["6G & Wireless Tech", "Renewable Energy & Evs"],
                    "conf": 0.95
                },
                {
                    "title": "Stochastic Differential Equations and Martingale Convergence in High-Frequency Derivative Pricing",
                    "abstract": "Financial markets exhibit jump-diffusion dynamics that defy standard Black-Scholes assumptions. We formulate a generalized stochastic volatility model with jump intensity parameters, proving martingale convergence theorems and deriving closed-form pricing equations for exotic options.",
                    "authors_list": ["Prof. John Nash", "Dr. Sarah Jenkins"],
                    "department": "Mathematics",
                    "journal": "Journal of Financial Econometrics",
                    "year": 2025,
                    "doi": "10.1093/jjfinec/nbz034",
                    "cats": ["Financial Econometrics", "Artificial Intelligence"],
                    "conf": 0.91
                },
                {
                    "title": "Automated Static Code Analysis and Zero-Day Vulnerability Detection via Graph Neural Networks",
                    "abstract": "Traditional static application security testing (SAST) tools generate overwhelming false positive rates. We model software source code as abstract syntax trees and code property graphs, applying deep graph neural networks to pinpoint zero-day memory corruption vulnerabilities with 91% accuracy.",
                    "authors_list": ["Prof. Robert Langdon", "Dr. Eleanor Vance", "Dr. Aravind Patel"],
                    "department": "Computer Science",
                    "journal": "ACM Transactions on Information and System Security",
                    "year": 2026,
                    "doi": "10.1145/3589201.3589215",
                    "cats": ["Cybersecurity & Cloud", "Artificial Intelligence"],
                    "conf": 0.99
                }
            ]

            for sp in sample_papers:
                ai_sum = summarizer.summarize(sp["abstract"], max_sentences=2)
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
                    ml_confidence=sp["conf"],
                    ml_predicted_dept=sp["department"],
                    ai_summary=ai_sum,
                    email_source_subject=f"Submission: {sp['title'][:40]}...",
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
    # Startup: create tables and seed initial data
    Base.metadata.create_all(bind=engine)
    seed_initial_data()
    ml_classifier.retrain_models() # ensure ML models are initialized
    yield
    # Shutdown

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

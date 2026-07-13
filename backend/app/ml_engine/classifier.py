import os
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from app.config import settings

class ResearchMLClassifier:
    def __init__(self):
        self.email_model_path = os.path.join(settings.ML_MODEL_DIR, "email_classifier.pkl")
        self.dept_model_path = os.path.join(settings.ML_MODEL_DIR, "dept_classifier.pkl")
        self.email_pipeline = None
        self.dept_pipeline = None
        self._initialize_models()

    def _get_seed_training_data(self):
        # Rich academic training corpus for Department classification and Email classification
        data = [
            # Computer Science
            ("Deep learning algorithms and transformer neural networks for natural language processing and computer vision.", "Computer Science", "research_paper"),
            ("Optimizing distributed consensus protocols and blockchain architectures for scalable cloud computing.", "Computer Science", "research_paper"),
            ("Automated vulnerability detection in web applications using static code analysis and machine learning.", "Computer Science", "research_paper"),
            ("Reinforcement learning for autonomous robot navigation in dynamic environments with obstacle avoidance.", "Computer Science", "research_paper"),
            ("Quantum computing algorithms for combinatorial optimization problems using NISQ hardware.", "Computer Science", "research_paper"),
            
            # Physics
            ("Experimental observation of Bose-Einstein condensation and superfluidity in ultra-cold atomic gases.", "Physics", "research_paper"),
            ("Gravitational wave astronomy: binary black hole mergers and neutron star collision waveforms.", "Physics", "research_paper"),
            ("Superconducting qubits and decoherence time extension in cryogenic quantum circuits.", "Physics", "research_paper"),
            ("Thermodynamic properties and phase transitions in two-dimensional ferromagnetic lattices.", "Physics", "research_paper"),
            
            # Chemistry & Nanotechnology
            ("Synthesis and catalytic characterization of metal-organic frameworks (MOFs) for carbon dioxide capture.", "Chemistry", "research_paper"),
            ("Spectroscopic analysis of photochemical oxidation pathways in atmospheric organic aerosols.", "Chemistry", "research_paper"),
            ("Graphene oxide nanosheets functionalized with nanoparticles for targeted drug delivery applications.", "Chemistry", "research_paper"),
            
            # Biotechnology & Genomics
            ("CRISPR-Cas9 gene editing efficiency and off-target analysis in human pluripotent stem cells.", "Biotechnology", "research_paper"),
            ("Transcriptome profiling of microbiome diversity and metabolic pathways in gastrointestinal disorders.", "Biotechnology", "research_paper"),
            ("Protein folding prediction and molecular dynamics simulation of enzyme inhibitor complexes.", "Biotechnology", "research_paper"),
            
            # Mechanical & Electrical Engineering
            ("Aerodynamic optimization of wind turbine blade profiles using computational fluid dynamics (CFD).", "Mechanical Engineering", "research_paper"),
            ("Thermal management and heat dissipation in high-power lithium-ion battery packs for electric vehicles.", "Mechanical Engineering", "research_paper"),
            ("Design of CMOS millimeter-wave transceivers for 6G wireless communication networks.", "Electrical Engineering", "research_paper"),
            ("Smart grid voltage regulation and harmonic distortion suppression using active power filters.", "Electrical Engineering", "research_paper"),
            
            # Mathematics & Economics
            ("Stochastic differential equations and martingale convergence theorems in financial derivative pricing.", "Mathematics", "research_paper"),
            ("Topological data analysis and persistent homology applied to complex brain functional networks.", "Mathematics", "research_paper"),
            ("Econometric modeling of inflation dynamics and central bank monetary policy shifts in emerging markets.", "Economics & Finance", "research_paper"),
            
            # General / Non-research emails (Spam / Admin / Routine)
            ("Reminder: Department faculty meeting scheduled for tomorrow at 3 PM in Conference Room A. Please attend.", "General", "general_email"),
            ("Invoice attached for office supplies stationery and printer toner replacement orders.", "General", "general_email"),
            ("Campus IT notification: Scheduled server maintenance and Wi-Fi outage this Sunday from midnight to 4 AM.", "General", "general_email"),
            ("Invitation to annual college sports day celebration and alumni networking dinner.", "General", "general_email"),
            ("Please submit your semester grading sheets and attendance records before Friday deadline.", "General", "general_email"),
            ("Welcome to our new assistant professor joining the humanities department next week.", "General", "general_email")
        ]
        
        texts = [item[0] for item in data]
        depts = [item[1] for item in data]
        email_classes = [item[2] for item in data]
        return texts, depts, email_classes

    def _initialize_models(self):
        if os.path.exists(self.email_model_path) and os.path.exists(self.dept_model_path):
            try:
                self.email_pipeline = joblib.load(self.email_model_path)
                self.dept_pipeline = joblib.load(self.dept_model_path)
                return
            except Exception:
                pass # Re-train if load fails
        
        self.retrain_models()

    def retrain_models(self, extra_texts=None, extra_depts=None):
        texts, depts, email_classes = self._get_seed_training_data()
        if extra_texts and extra_depts:
            texts.extend(extra_texts)
            depts.extend(extra_depts)
            email_classes.extend(["research_paper"] * len(extra_texts))

        # Email relevance classifier (TF-IDF + Naive Bayes)
        self.email_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(stop_words='english', ngram_range=(1, 2))),
            ('clf', MultinomialNB(alpha=0.1))
        ])
        self.email_pipeline.fit(texts, email_classes)

        # Department classifier (TF-IDF + Random Forest / Naive Bayes)
        # Filter only research papers for department training
        research_texts = [t for t, c in zip(texts, email_classes) if c == "research_paper"]
        research_depts = [d for d, c in zip(depts, email_classes) if c == "research_paper"]

        self.dept_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(stop_words='english', max_features=5000, ngram_range=(1, 2))),
            ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
        ])
        self.dept_pipeline.fit(research_texts, research_depts)

        # Save models to disk
        joblib.dump(self.email_pipeline, self.email_model_path)
        joblib.dump(self.dept_pipeline, self.dept_model_path)

    def classify_email_relevance(self, text: str) -> dict:
        """Classifies if text contains a research publication submission."""
        if not self.email_pipeline:
            self._initialize_models()
        
        text_lower = text.lower()
        # Heuristic check for direct publication announcements in text
        if any(phrase in text_lower for phrase in [
            "paper published", "papers published", "article published", 
            "title of the paper", "title of paper",
            "doi:", "doi :", "accepted for publication"
        ]):
            return {
                "predicted_class": "research_paper",
                "confidence": 1.0,
                "is_research": True
            }
        
        prob = self.email_pipeline.predict_proba([text])[0]
        classes = self.email_pipeline.classes_
        res_idx = list(classes).index("research_paper") if "research_paper" in classes else 0
        confidence = float(prob[res_idx])
        predicted_class = "research_paper" if confidence >= 0.55 else "general_email"
        
        return {
            "predicted_class": predicted_class,
            "confidence": round(confidence, 4),
            "is_research": predicted_class == "research_paper"
        }

    def predict_department(self, text: str) -> dict:
        """Predicts the academic department and returns confidence score."""
        if not self.dept_pipeline:
            self._initialize_models()
            
        probs = self.dept_pipeline.predict_proba([text])[0]
        classes = self.dept_pipeline.classes_
        best_idx = np.argmax(probs)
        best_dept = str(classes[best_idx])
        confidence = float(probs[best_idx])
        
        return {
            "department": best_dept,
            "confidence": round(confidence, 4)
        }

    def auto_categorize(self, text: str, title: str = "") -> list:
        """Assigns automatic research topic tags using TF-IDF keyword heuristics and domain matching."""
        combined = f"{title} {text}".lower()
        tags = []
        
        domain_keywords = {
            "Artificial Intelligence": ["deep learning", "neural network", "transformer", "machine learning", "nlp", "ai", "llm", "reinforcement learning"],
            "Quantum Computing": ["quantum", "qubit", "superconducting", "bose-einstein", "superfluidity", "entanglement"],
            "Nanotechnology & Materials": ["nanoparticles", "graphene", "mof", "nanosheet", "catalyst", "material", "polymer"],
            "Genomics & CRISPR": ["crispr", "gene editing", "microbiome", "genomic", "stem cell", "transcriptome", "protein folding"],
            "Renewable Energy & Evs": ["wind turbine", "lithium-ion", "battery", "solar", "renewable", "smart grid", "power filter"],
            "Cybersecurity & Cloud": ["vulnerability", "blockchain", "consensus", "cybersecurity", "encryption", "cloud computing"],
            "6G & Wireless Tech": ["cmos", "transceiver", "6g", "wireless", "antenna", "millimeter-wave"],
            "Financial Econometrics": ["econometric", "stochastic", "derivative", "monetary policy", "inflation", "market"]
        }
        
        for category, kws in domain_keywords.items():
            if any(kw in combined for kw in kws):
                tags.append(category)
                
        if not tags:
            tags.append("General Research")
            
        return tags[:3]

ml_classifier = ResearchMLClassifier()

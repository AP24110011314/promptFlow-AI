import os
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from app.config import settings
from html.parser import HTMLParser

class HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.ignore_tags = {"style", "script", "head", "title", "meta", "link"}
        self.current_tag = []

    def handle_starttag(self, tag, attrs):
        self.current_tag.append(tag.lower())

    def handle_endtag(self, tag):
        tag = tag.lower()
        if self.current_tag and self.current_tag[-1] == tag:
            self.current_tag.pop()

    def handle_data(self, data):
        if any(ignored in self.current_tag for ignored in self.ignore_tags):
            return
        self.text.append(data)

    def get_text(self):
        raw_text = "".join(self.text)
        lines = [line.strip() for line in raw_text.splitlines()]
        return "\n".join([line for line in lines if line])

class ResearchMLClassifier:
    def __init__(self):
        self.email_model_path = os.path.join(settings.ML_MODEL_DIR, "email_classifier.pkl")
        self.dept_model_path = os.path.join(settings.ML_MODEL_DIR, "dept_classifier.pkl")
        self.email_pipeline = None
        self.dept_pipeline = None
        self._initialize_models()

    def _get_seed_training_data(self):
        # Rich academic training corpus styled after real forwarded publication emails
        data = [
            # Computer Science & Engineering
            ("Fwd: Paper Published by Dr. Aditya Kumar Sahu, Assistant Professor, Department of Computer Science and Engineering. Title of the paper: SEF-QIM: Scale-based Embedding Factor Quantization Index Modulation Image Watermarking for Tamper Detection and Localization. Journal: Analog Integrated Circuits and Signal Processing.", "Computer Science", "research_paper"),
            ("Fwd: Paper Published by Prof. Robert Langdon, Department of Computer Science. Title of the paper: Deep Learning Transformer Neural Networks for Multimodal Academic Document Extraction. Journal: IEEE Transactions on Neural Networks.", "Computer Science", "research_paper"),
            ("Fwd: Paper Published by CS Department. Title: Automated Static Code Analysis and Zero-Day Vulnerability Detection via Graph Neural Networks. Journal: ACM Transactions.", "Computer Science", "research_paper"),
            ("Fwd: Paper Published: Design of CMOS Millimeter-Wave Transceivers for 6G Mobile Networks. Department: Computer Science.", "Computer Science", "research_paper"),
            
            # Physics
            ("Fwd: Paper Published: Superconducting Qubit Decoherence Time Extension in Ultra-Low Temperature Cryogenic Circuits. Department of Physics.", "Physics", "research_paper"),
            ("Fwd: Paper Published: Experimental observation of Bose-Einstein condensation and superfluidity in ultra-cold atomic gases. Dept of Physics.", "Physics", "research_paper"),
            ("Fwd: Paper Published by Physics Department. Title: Gravitational wave astronomy: binary black hole mergers and neutron star collision waveforms.", "Physics", "research_paper"),
            
            # Chemistry
            ("Fwd: Paper Published by Dr. Venkatramaiah Nutalapati, Associate Professor, Centre for Interdisciplinary Research. Title of the paper: Synergistic Molecular Design-Triggered Hybridized Local and Charge-Transfer Emission for Efficient Deep-Blue Electroluminescence. Journal: Journal of Materials Chemistry.", "Chemistry", "research_paper"),
            ("Fwd: Paper Published by Department of Chemistry. Title: Synthesis and Catalytic Performance of Metal-Organic Frameworks for Direct Atmospheric Carbon Capture.", "Chemistry", "research_paper"),
            ("Fwd: Paper Published by Chemistry Dept. Title: Graphene oxide nanosheets functionalized with nanoparticles for targeted drug delivery.", "Chemistry", "research_paper"),
            
            # Biotechnology & Genomics
            ("Fwd: Paper Published by Dr. Sarah Jenkins, Dept of Biotech. Title: CRISPR-Cas9 Precision Genome Editing Efficiency and Off-Target Profiling in Pluripotent Stem Cells. Journal: Nature Biotechnology.", "Biotechnology", "research_paper"),
            ("Fwd: Paper Published by Biotechnology Department. Title: Transcriptome profiling of microbiome diversity and metabolic pathways in gastrointestinal disorders.", "Biotechnology", "research_paper"),
            ("Fwd: Paper Published by Bio-Tech Department. Title: Protein folding prediction and molecular dynamics simulation of enzyme inhibitor complexes.", "Biotechnology", "research_paper"),
            
            # Mechanical Engineering
            ("Fwd: Paper Published by Dr. Lakshmi Sirisha Maganti, Associate Professor, Department of Mechanical Engineering. Title of the paper: Augmented Jet Impingement Cooling System for High-Heat Flux Electronics Through Mitigating Radial Jet-to-Jet Interaction by Employing Rectilinear and Curvilinear Separators. Journal: Applied Thermal Engineering.", "Mechanical Engineering", "research_paper"),
            ("Fwd: Paper Published by Department of Mechanical Engineering. Title: Thermal Management and Battery Heat Dissipation Optimization for Next-Generation Electric Vehicles.", "Mechanical Engineering", "research_paper"),
            ("Fwd: Paper Published: Aerodynamic optimization of wind turbine blade profiles using computational fluid dynamics. Department: Mechanical Engineering.", "Mechanical Engineering", "research_paper"),
            
            # Electrical Engineering
            ("Fwd: Paper Published: Design of CMOS Millimeter-Wave Transceivers for 6G Mobile Communication Networks. Department of Electrical Engineering.", "Electrical Engineering", "research_paper"),
            ("Fwd: Paper Published by EE Dept. Title: Smart grid voltage regulation and harmonic distortion suppression using active power filters.", "Electrical Engineering", "research_paper"),
            
            # Mathematics
            ("Fwd: Paper Published by Mathematics Department. Title: Stochastic Differential Equations and Martingale Convergence in High-Frequency Derivative Pricing. Journal: Journal of Financial Econometrics.", "Mathematics", "research_paper"),
            ("Fwd: Paper Published: Topological data analysis and persistent homology applied to complex brain functional networks. Department of Mathematics.", "Mathematics", "research_paper"),
            
            # Economics & Finance
            ("Fwd: Paper Published by Dr. Elena Rostova, Department of Economics. Title: Econometric modeling of inflation dynamics and central bank monetary policy shifts in emerging markets.", "Economics & Finance", "research_paper"),
            
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

    def clean_html_to_text(self, html_content):
        try:
            parser = HTMLTextExtractor()
            parser.feed(html_content)
            return parser.get_text()
        except Exception as e:
            print(f"ML Classifier HTML clean error: {e}", flush=True)
            return html_content

    def _load_real_emails_for_training(self):
        real_texts = []
        real_depts = []
        real_classes = []
        
        emails_dir = "/app/emails"
        if not os.path.exists(emails_dir):
            # Fallback for local manual development outside Docker
            emails_dir = os.path.join(os.path.dirname(settings.BASE_DIR), "emails")
        if not os.path.exists(emails_dir):
            return real_texts, real_depts, real_classes
            
        import glob
        import re
        from email import message_from_file
        
        dept_regexes = [
            (r"(?i)department\s+of\s+computer\s+science", "Computer Science"),
            (r"(?i)Paari\s+School\s+of\s+Business", "Economics & Finance"),
            (r"(?i)department\s+of\s+management", "Economics & Finance"),
            (r"(?i)department\s+of\s+economics", "Economics & Finance"),
            (r"(?i)department\s+of\s+physics", "Physics"),
            (r"(?i)department\s+of\s+chemistry", "Chemistry"),
            (r"(?i)department\s+of\s+biological\s+sciences", "Biotechnology"),
            (r"(?i)department\s+of\s+biotechnology", "Biotechnology"),
            (r"(?i)department\s+of\s+mechanical\s+engineering", "Mechanical Engineering"),
            (r"(?i)department\s+of\s+electronics", "Electrical Engineering"),
            (r"(?i)department\s+of\s+electrical", "Electrical Engineering"),
            (r"(?i)department\s+of\s+mathematics", "Mathematics"),
            (r"(?i)department\s+of\s+civil", "Mechanical Engineering"),
            (r"(?i)department\s+of\s+environmental", "Chemistry"),
            (r"(?i)department\s+of\s+literature", "Mathematics"),
            (r"(?i)Centre\s+for\s+Interdisciplinary\s+Research", "Chemistry"),
        ]
        
        for eml_path in glob.glob(os.path.join(emails_dir, "*.eml")):
            try:
                with open(eml_path, "r", encoding="utf-8", errors="ignore") as f:
                    msg = message_from_file(f)
                
                subject = msg.get("Subject", "")
                
                # Extract body
                body = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            body += part.get_payload(decode=True).decode(part.get_content_charset() or 'utf-8', errors='ignore')
                        elif part.get_content_type() == "text/html" and not body:
                            html_body = part.get_payload(decode=True).decode(part.get_content_charset() or 'utf-8', errors='ignore')
                            body += self.clean_html_to_text(html_body)
                else:
                    content_type = msg.get_content_type()
                    if content_type == "text/plain":
                        body = msg.get_payload(decode=True).decode(msg.get_content_charset() or 'utf-8', errors='ignore')
                    elif content_type == "text/html":
                        html_body = msg.get_payload(decode=True).decode(msg.get_content_charset() or 'utf-8', errors='ignore')
                        body = self.clean_html_to_text(html_body)
                
                if "<html>" in body.lower() or "<div" in body.lower() or "<!doctype" in body.lower():
                    body = self.clean_html_to_text(body)
                
                # Clean and extract Title/Journal/Abstract using regex to match real test input format
                title_match = re.search(r'(?i)title(?:\s+of\s+the\s+paper)?[\s*\:\-\*]+([\s\S]+?)(?=\n\s*\*?(?:journal|authors?|doi|if\s+(?:and|&)\s+q|impact\s+factor)\b)', body)
                title = title_match.group(1).strip("*_ \t\r\n") if title_match else subject
                title = re.sub(r'^(?:\d+[\.\)]\s*)', '', title).strip("*_ \t\r\n")
                
                journal_match = re.search(r'(?i)journal[\s*\:\-\*]+([^\n]+)', body)
                journal = journal_match.group(1).strip("*_ \t\r\n") if journal_match else "International Journal of College Research"
                
                abstract_match = re.search(r'(?i)abstract[\s*\:\-]+([\s\S]+)', body)
                abstract = abstract_match.group(1).strip() if abstract_match else f"This publication outlines research on '{title}', accepted at '{journal}'."
                
                # Use clean Title + Abstract for classifier training so it aligns perfectly with prediction text format
                combined_text = f"{title} {abstract}"
                filename_lower = os.path.basename(eml_path).lower()
                
                matched_dept = None
                for pattern, std_dept in dept_regexes:
                    if re.search(pattern, body) or re.search(pattern, filename_lower):
                        matched_dept = std_dept
                        break
                if not matched_dept:
                    matched_dept = "Computer Science"
                
                real_texts.append(combined_text)
                real_depts.append(matched_dept)
                real_classes.append("research_paper")
            except Exception as e:
                print(f"Error parsing training email {eml_path}: {e}", flush=True)
                
        return real_texts, real_depts, real_classes

    def retrain_models(self, extra_texts=None, extra_depts=None, extra_email_texts=None, extra_email_classes=None):
        texts, depts, email_classes = self._get_seed_training_data()
        
        try:
            real_texts, real_depts, real_classes = self._load_real_emails_for_training()
            if real_texts:
                texts.extend(real_texts)
                depts.extend(real_depts)
                email_classes.extend(real_classes)
                print(f"ML Classifier Retrain: Dynamically seeded {len(real_texts)} real emails from college corpus.", flush=True)
        except Exception as seed_err:
            print(f"ML Classifier Retrain Error: Failed to seed real emails: {seed_err}", flush=True)

        # Add research papers to training corpus
        if extra_texts and extra_depts:
            for t, d in zip(extra_texts, extra_depts):
                texts.append(t)
                depts.append(d)
                email_classes.append("research_paper")
                
        # Add audited spam/general emails for relevance model training
        if extra_email_texts and extra_email_classes:
            for t, c in zip(extra_email_texts, extra_email_classes):
                texts.append(t)
                depts.append("General")
                email_classes.append(c)

        # Email relevance classifier (TF-IDF + Naive Bayes)
        self.email_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(stop_words='english', ngram_range=(1, 2), sublinear_tf=True)),
            ('clf', MultinomialNB(alpha=0.01))
        ])
        self.email_pipeline.fit(texts, email_classes)

        # Department classifier (TF-IDF + Naive Bayes with sublinear TF scaling)
        # Filter only research papers for department training
        research_texts = [t for t, c in zip(texts, email_classes) if c == "research_paper"]
        research_depts = [d for d, c in zip(depts, email_classes) if c == "research_paper"]

        self.dept_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(stop_words='english', max_features=5000, ngram_range=(1, 2), sublinear_tf=True)),
            ('clf', MultinomialNB(alpha=0.01))
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

        # 1. Hard check for non-research administrative chatter and spam
        spam_keywords = [
            "faculty meeting", "department meeting", "office supplies", 
            "printer toner", "stationery", "wi-fi outage", "wifi outage", 
            "server maintenance", "sports day", "grading sheets", "attendance records", 
            "invoice attached", "leave application", "holiday list", "payroll", "fee payment"
        ]
        has_spam_kw = any(kw in text_lower for kw in spam_keywords)
        has_pub_kw = any(pub_kw in text_lower for pub_kw in ["title of the paper", "title of paper", "paper published", "papers published", "doi:"])

        if has_spam_kw and not has_pub_kw:
            return {
                "predicted_class": "general_email",
                "confidence": 0.99,
                "is_research": False
            }

        # 2. Check for explicit publication announcement signatures
        publication_signatures = [
            "paper published", "papers published", "article published", 
            "title of the paper", "title of paper", "accepted for publication"
        ]
        if any(sig in text_lower for sig in publication_signatures):
            return {
                "predicted_class": "research_paper",
                "confidence": 1.0,
                "is_research": True
            }
        
        prob = self.email_pipeline.predict_proba([text])[0]
        classes = self.email_pipeline.classes_
        res_idx = list(classes).index("research_paper") if "research_paper" in classes else 0
        confidence = float(prob[res_idx])
        
        # Require 0.65 threshold for unlabeled email text
        predicted_class = "research_paper" if confidence >= 0.65 else "general_email"
        
        return {
            "predicted_class": predicted_class,
            "confidence": round(confidence, 4),
            "is_research": predicted_class == "research_paper"
        }


    def predict_department(self, text: str) -> dict:
        """Predicts the academic department and returns confidence score."""
        if not self.dept_pipeline:
            self._initialize_models()

        # 1. Check for explicit department signature in text
        dept_regexes = [
            (r"(?i)department\s+of\s+computer\s+science", "Computer Science"),
            (r"(?i)Paari\s+School\s+of\s+Business", "Economics & Finance"),
            (r"(?i)department\s+of\s+management", "Economics & Finance"),
            (r"(?i)department\s+of\s+economics", "Economics & Finance"),
            (r"(?i)department\s+of\s+physics", "Physics"),
            (r"(?i)department\s+of\s+chemistry", "Chemistry"),
            (r"(?i)department\s+of\s+biological\s+sciences", "Biotechnology"),
            (r"(?i)department\s+of\s+biotechnology", "Biotechnology"),
            (r"(?i)department\s+of\s+mechanical\s+engineering", "Mechanical Engineering"),
            (r"(?i)department\s+of\s+electronics", "Electrical Engineering"),
            (r"(?i)department\s+of\s+electrical", "Electrical Engineering"),
            (r"(?i)department\s+of\s+mathematics", "Mathematics"),
            (r"(?i)department\s+of\s+civil", "Mechanical Engineering"),
            (r"(?i)department\s+of\s+environmental", "Chemistry"),
            (r"(?i)department\s+of\s+literature", "Mathematics"),
            (r"(?i)Centre\s+for\s+Interdisciplinary\s+Research", "Chemistry"),
        ]

        import re
        for pattern, std_dept in dept_regexes:
            if re.search(pattern, text):
                return {
                    "department": std_dept,
                    "confidence": 0.95
                }

        # 2. Fallback to TF-IDF Naive Bayes ML prediction for unlabeled raw text
        probs = self.dept_pipeline.predict_proba([text])[0]
        classes = self.dept_pipeline.classes_

        best_idx = int(np.argmax(probs))
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

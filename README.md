# promptFlow-AI System (Research Publication Tracking & Management)

promptFlow-AI is an automated, enterprise-grade research tracking and management system designed to streamline the ingestion, classification, parsing, and analysis of academic research publications announced via faculty emails. 

The system automates the processing of email communications, filters administrative noise and spam, extracts paper metadata, generates executive summaries, and classifies publications by academic department and research category.

---

## Core System Architecture

The promptFlow-AI System uses a decoupled, event-driven architecture that automatically processes incoming publication announcements:

1. **Email Ingestion and Normalization:** The system periodically polls the target mailbox or accepts simulated email payloads. Clean, plain text content is extracted by stripping HTML, CSS blocks, and metadata tags.
2. **Relevance Filtering (ML Classifier):** Cleaned email text is evaluated by a machine learning classification pipeline. Emails determined to be administrative chatter or spam are logged and rejected from database indexing.
3. **Metadata Extraction (NLP Parser):** Document headers, multi-line author lists, journal titles, DOIs, publication years, and impact metrics (Impact Factor and Quartile ratings) are extracted using structured regex and pattern heuristic parsers.
4. **Extractive Summarization (NLP Engine):** The text is summarized into a concise, sentence-level executive summary using TF-IDF sentence scoring.
5. **Database Indexing:** Indexed research papers are associated with academic departments and relevant research categories, then stored in the database for query and retrieval.

```mermaid
graph TD
    A[Incoming Email / PDF Upload] -->|Event Trigger| B(EmailIngestionService)
    B -->|Text Extraction| C[PyMuPDF / Regex Parser]
    B -->|Relevance & Dept Inference| D[Scikit-Learn ML Classifier]
    D -->|Spam / Routine Chat| E[Rejected / Ingestion Log]
    D -->|Research Paper| F[NLP Extractive Summarizer]
    F -->|Indexed Metadata| G[(SQLite / PostgreSQL DB)]
    G <-->|REST API / JWT| H[FastAPI Backend Server]
    H <-->|Axios / JSON| I[Vite + React + Tailwind v4 UI]
```

---

## Machine Learning and NLP Pipelines

### Relevance and Department Classification
The system uses a Scikit-Learn machine learning pipeline initialized and trained at startup:
* **Feature Extraction:** Standardized text is vectorized using a Term Frequency-Inverse Document Frequency (TF-IDF) n-gram (1,2) Vectorizer with English stop-word filtering.
* **Relevance Classifier:** A Multinomial Naive Bayes model determines whether the incoming email text represents a research publication announcement or administrative spam.
* **Department Classifier:** Categorizes research publications into eight college academic departments (Computer Science, Physics, Chemistry, Biotechnology, Mechanical Engineering, Electrical Engineering, Mathematics, Economics and Finance).

### Extractive NLP Summarizer
Generates a concise executive summary by tokenizing the input text into sentences, computing sentence-level TF-IDF importance scores based on document terms, and selecting the highest-scoring sentences.

---

## Getting Started

### Prerequisites
* Python 3.10 or higher
* Node.js 18 or higher
* Docker and Docker Compose (recommended)

### Docker Deployment
Build and run the entire stack (FastAPI Backend, SQLite/PostgreSQL Database, Nginx serving compiled React frontend):
```bash
docker compose up --build -d
```
* Interactive Web Application: http://localhost:3000
* API Swagger Documentation: http://localhost:8000/docs

### Manual Development Setup

#### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

#### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Compile and start the development server:
   ```bash
   npm run dev
   ```

---

## API Endpoints Summary

All API endpoints are prefixed with `/api/v1` and require JWT bearer authorization (except `/auth/login` and `/auth/register`):

* `POST /auth/login` - Obtain authorization token.
* `POST /auth/register` - Create a new user account.
* `GET /papers/` - Query publication repository with filters (title, author, department, category, year).
* `POST /papers/upload` - Upload PDF and trigger metadata extraction pipeline.
* `DELETE /papers/{id}` - Delete a paper (Admin only).
* `POST /emails/simulate` - Simulate email arrival and execute ML classification pipeline.
* `GET /emails/logs` - Retrieve historical ingestion audit logs.
* `POST /admin/retrain-ml` - Force retraining of classification models on current corpus (Admin only).

---

## Default System Credentials

For testing and local development, the system is seeded with the following demo credentials:

* **Administrator Account:** `admin@college.edu` / `admin123`
* **Faculty Account:** `faculty@college.edu` / `faculty123`

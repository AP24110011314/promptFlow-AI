# promptFlow-AI System Session Resume Context

You are resuming work on promptFlow-AI (Automated Research Publication Tracking and Management System for College Faculty & Administrators). The workspace is fully updated, verified, and running cleanly across Docker containers. Below is the compressed state context.

## 1. Overarching Goal
Automate ingestion, classification, parsing, and analysis of college research emails and publication PDFs. The system processes single/multi-paper announcements, filters administrative noise, extracts structural metadata (Title, Authors, Journal, DOI, Impact Factor & Quartiles Q1–Q4), predicts academic departments using Scikit-Learn ML models (>95% confidence), generates extractive summaries, renders an interactive React 19 dashboard, and exports audit-ready Excel and PDF reports.

## 2. Key Technical Decisions & Recent Updates
* **Project Name Standardization:** Renamed project across backend, frontend, API endpoints, container configs, and documentation to **promptFlow-AI**.
* **Database & Docker Volume Resolution:** Cleared stale PostgreSQL host data directory (`./backend/storage/postgres_data`) to resolve authentication mismatch, successfully initializing `promptflow_database` with `promptflow_user` credentials and seeding 51 papers from the email corpus.
* **Complete Documentation Generation:** Generated publication-ready 16-chapter internship project report `promptFlow-AI_Report.docx` following the structure of `Sample_Report.pdf`, including visual callouts for logos and screenshots.
* **Weekly Diary Report Completed:** Fully populated `Weekly Diary report for CSC students.docx` for the 8-week internship period (May 25, 2026 – July 17, 2026) with student info (Shaik Abrar, AP23110011246), 12 core project specification fields, and 40 daily breakdown entries.
* **Quartile Substring Filtering & Export Integration:** Extracted `IF and Q` metrics (e.g., "5.2 and Q1") from abstracts and enabled Quartile dropdown (All, Q1, Q2, Q3, Q4) filtering across frontend and backend Excel/PDF export services.
* **Boilerplate-Free ML Pipeline:** Trained Scikit-Learn TF-IDF (1,2) + Naive Bayes department classifier on clean `title + abstract` pairs (94%–97% confidence).

## 3. Current Codebase State
* **Backend:** FastAPI 0.110+ backend running on port 8000. PostgreSQL database container (`promptflow_db`), Redis (`promptflow_redis`), and Celery worker (`promptflow_celery_worker`) configured in `docker-compose.yml`.
* **Frontend:** Vite + React 19 + TypeScript + Tailwind CSS v4 running on port 3000. Features 5-column filtering repository, PaperDetailModal, AnalyticsView with SVG Co-Authorship Network Graph, and Admin Control Panel.
* **Documentation Files:**
  - `promptFlow-AI_Report.docx`: Complete 16-chapter technical report.
  - `Weekly Diary report for CSC students.docx`: 8-week filled internship diary.
  - `README.md` & `GEMINI.md`: Updated architectural guides.

## 4. Next Steps
1. **Verify Live IMAP Synchronization:** Test live email polling (`email_poller.py`) under active IMAP credentials for real-time incoming SRM publication circulars.
2. **Populate Documentation Screenshots:** Insert real UI screenshots into the visual placeholder boxes in `promptFlow-AI_Report.docx`.
3. **Advanced Transformer Semantic Search (Optional Future Scope):** Experiment with SciBERT / Specter transformer embeddings for semantic paper recommendations.

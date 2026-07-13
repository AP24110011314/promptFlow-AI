import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.paper import ResearchPaper
from app.config import settings

class AlertService:
    def send_email(self, recipient_email: str, subject: str, body_html: str, body_text: str = ""):
        """Sends a single email alert via SMTP."""
        if not settings.EMAIL_INTEGRATION_ENABLED or not settings.EMAIL_PASSWORD:
            print(f"Alert Service: Email disabled or credentials missing. Skip sending email to {recipient_email}.", flush=True)
            return False

        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = settings.EMAIL_USERNAME
            msg['To'] = recipient_email

            if body_text:
                msg.attach(MIMEText(body_text, 'plain'))
            msg.attach(MIMEText(body_html, 'html'))

            # Connect to SMTP server
            server = smtplib.SMTP(settings.EMAIL_SMTP_SERVER, settings.EMAIL_SMTP_PORT)
            server.set_debuglevel(0)
            server.starttls()
            server.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)
            server.sendmail(settings.EMAIL_USERNAME, recipient_email, msg.as_string())
            server.quit()
            print(f"Alert Service: Successfully sent email alert to {recipient_email}", flush=True)
            return True
        except Exception as e:
            print(f"Alert Service: Error sending email to {recipient_email}: {e}", flush=True)
            return False

    def send_immediate_alert(self, db: Session, paper: ResearchPaper):
        """Sends an immediate notification to all faculty members in the same department when a paper is ingested."""
        users = db.query(User).filter(
            User.role == "faculty", 
            User.is_active == True,
            User.department == paper.department
        ).all()

        if not users:
            print(f"Alert Service: No faculty members found in department {paper.department}. Skipping immediate alert.", flush=True)
            return

        subject = f"[CRD System] New Publication: {paper.title}"
        pdf_link = "http://localhost:3000/repository"

        for user in users:
            html = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; color: #333; line-height: 1.6; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }}
                    .header {{ background-color: #0f172a; color: white; padding: 15px; text-align: center; border-radius: 6px 6px 0 0; }}
                    .paper {{ padding: 15px 0; }}
                    .title {{ font-size: 16px; font-weight: bold; color: #0284c7; text-decoration: none; }}
                    .authors {{ font-size: 13px; color: #666; margin: 5px 0; }}
                    .summary {{ font-size: 14px; background-color: #f8fafc; padding: 10px; border-radius: 6px; border-left: 3px solid #cbd5e1; }}
                    .footer {{ margin-top: 20px; font-size: 11px; color: #999; text-align: center; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>College Research Digest (CRD)</h2>
                        <p>New Research Alert</p>
                    </div>
                    <p>Hello {user.full_name},</p>
                    <p>A new research publication has been indexed in your department (<strong>{paper.department}</strong>):</p>
                    <div class="paper">
                        <a href="{pdf_link}" class="title">{paper.title}</a>
                        <div class="authors"><strong>Authors:</strong> {paper.authors_raw} | <strong>Type:</strong> {paper.publication_type} | <strong>Year:</strong> {paper.publication_year}</div>
                        <p class="summary"><strong>AI Summary:</strong> {paper.ai_summary or "No summary available."}</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email from the CRD System.<br/>To change your notification settings, please update your profile in the CRD Portal.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            text = f"Hello {user.full_name},\n\nA new research paper was indexed in your department ({paper.department}):\n\nTitle: {paper.title}\nAuthors: {paper.authors_raw}\nSummary: {paper.ai_summary or 'N/A'}\n"
            self.send_email(user.email, subject, html, text)

    def send_daily_digest(self, db: Session):
        """Builds and sends a daily digest of new research publications to faculty members based on department."""
        # Find papers created in the last 24 hours
        yesterday = datetime.utcnow() - timedelta(days=1)
        papers = db.query(ResearchPaper).filter(ResearchPaper.created_at >= yesterday).all()
        if not papers:
            print("Alert Service: No new papers in the last 24 hours. Skipping digest.", flush=True)
            return

        # Group papers by department
        dept_papers = {}
        for paper in papers:
            dept = paper.department or "General"
            if dept not in dept_papers:
                dept_papers[dept] = []
            dept_papers[dept].append(paper)

        # Find all faculty users
        users = db.query(User).filter(User.role == "faculty", User.is_active == True).all()

        for user in users:
            dept = user.department
            new_papers = dept_papers.get(dept, [])
            if not new_papers:
                # check if there are general papers
                new_papers = dept_papers.get("General", [])
                
            if not new_papers:
                continue

            subject = f"[CRD System] New Research Publications in {dept}"
            pdf_link = "http://localhost:3000/repository"
            
            html = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; color: #333; line-height: 1.6; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }}
                    .header {{ background-color: #0f172a; color: white; padding: 15px; text-align: center; border-radius: 6px 6px 0 0; }}
                    .paper {{ border-bottom: 1px solid #eee; padding: 15px 0; }}
                    .title {{ font-size: 16px; font-weight: bold; color: #0284c7; text-decoration: none; }}
                    .authors {{ font-size: 13px; color: #666; margin: 5px 0; }}
                    .summary {{ font-size: 14px; background-color: #f8fafc; padding: 10px; border-radius: 6px; border-left: 3px solid #cbd5e1; }}
                    .footer {{ margin-top: 20px; font-size: 11px; color: #999; text-align: center; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>College Research Digest (CRD)</h2>
                        <p>Daily Research Alert for {user.full_name}</p>
                    </div>
                    <p>Hello {user.full_name},</p>
                    <p>Here are the latest research papers indexed in your department (<strong>{dept}</strong>) in the last 24 hours:</p>
            """

            text = f"Hello {user.full_name},\n\nHere are the latest research papers in your department ({dept}) in the last 24 hours:\n\n"

            for paper in new_papers:
                html += f"""
                <div class="paper">
                    <a href="{pdf_link}" class="title">{paper.title}</a>
                    <div class="authors"><strong>Authors:</strong> {paper.authors_raw} | <strong>Type:</strong> {paper.publication_type} | <strong>Year:</strong> {paper.publication_year}</div>
                    <p class="summary"><strong>AI Summary:</strong> {paper.ai_summary or "No summary available."}</p>
                </div>
                """
                text += f"- {paper.title}\n  Authors: {paper.authors_raw}\n  Summary: {paper.ai_summary or 'N/A'}\n\n"

            html += """
                    <div class="footer">
                        <p>This is an automated email from the CRD System.<br/>To change your notification settings, please update your profile in the CRD Portal.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            self.send_email(user.email, subject, html, text)

alert_service = AlertService()

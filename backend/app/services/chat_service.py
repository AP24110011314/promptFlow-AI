import os
import json
import logging
import re
import httpx
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.models.paper import ResearchPaper

logger = logging.getLogger(__name__)

class ChatAgentService:
    def __init__(self):
        self.gemini_key = os.environ.get("GEMINI_API_KEY")
        self.openrouter_key = os.environ.get("OPENROUTER_API_KEY")
        self.openrouter_model = os.environ.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-lite:free")

    def _call_llm(self, prompt: str, system_instruction: Optional[str] = None, json_mode: bool = False) -> str:
        """
        Calls Gemini API with OpenRouter as a fallback.
        """
        # Try Gemini API first
        if self.gemini_key:
            gemini_models = ["gemini-3.1-flash-lite", "gemini-3.5-flash"]
            for model in gemini_models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.gemini_key}"
                    
                    payload = {
                        "contents": [{"parts": [{"text": prompt}]}]
                    }
                    
                    if system_instruction:
                        payload["systemInstruction"] = {
                            "parts": [{"text": system_instruction}]
                        }
                    
                    if json_mode:
                        payload["generationConfig"] = {
                            "responseMimeType": "application/json"
                        }
                        
                    resp = httpx.post(url, json=payload, timeout=20.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        try:
                            return data['candidates'][0]['content']['parts'][0]['text']
                        except (KeyError, IndexError) as e:
                            logger.error(f"Failed to parse Gemini response for model {model}: {e}, data: {data}")
                    else:
                        logger.warning(f"Gemini API model {model} returned status {resp.status_code}: {resp.text}")
                except Exception as e:
                    logger.error(f"Error calling Gemini API model {model}: {e}")
        
        # Fallback to OpenRouter
        if self.openrouter_key:
            try:
                url = "https://openrouter.ai/api/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {self.openrouter_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "CRD System"
                }
                
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})
                
                payload = {
                    "model": self.openrouter_model,
                    "messages": messages
                }
                if json_mode:
                    payload["response_format"] = {"type": "json_object"}
                    
                resp = httpx.post(url, json=payload, headers=headers, timeout=25.0)
                if resp.status_code == 200:
                    data = resp.json()
                    try:
                        return data['choices'][0]['message']['content']
                    except (KeyError, IndexError) as e:
                        logger.error(f"Failed to parse OpenRouter response: {e}, data: {data}")
                else:
                    logger.error(f"OpenRouter API returned status {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.error(f"Error calling OpenRouter API: {e}")
                
        # If both fail or are not configured, use a rule-based mock parser for safety
        logger.error("No LLM service could be reached or quota is exhausted. Using fallback rule-based parser.")
        return self._rule_based_fallback(prompt, json_mode)

    def _rule_based_fallback(self, prompt: str, json_mode: bool) -> str:
        if not json_mode:
            return "I am currently having difficulty connecting to my AI brain. However, I can still assist you. Please search the Research Repository directly for more precise filters."
        
        prompt_lower = prompt.lower()
        # Basic check to see if it is paper/publication related
        is_academic = any(w in prompt_lower for w in ["paper", "publication", "article", "research", "author", "find", "search", "list", "show", "who", "quantum", "physics", "chemistry", "computer", "biology", "tesla", "vance", "langdon"])
        
        rejection = ""
        if not is_academic:
            rejection = "I can only answer questions related to academic research publications, authors, departments, or categories in the CRD system. Please ask something related to papers."
            
        filters = {
            "title_keywords": [],
            "authors": [],
            "departments": [],
            "years": [],
            "categories": [],
            "general_query": ""
        }
        
        # Simple keywords extraction
        if "vance" in prompt_lower:
            filters["authors"].append("Vance")
        if "langdon" in prompt_lower:
            filters["authors"].append("Langdon")
        if "patel" in prompt_lower:
            filters["authors"].append("Patel")
            
        if "computer science" in prompt_lower or "cs" in prompt_lower:
            filters["departments"].append("Computer Science")
        if "physics" in prompt_lower:
            filters["departments"].append("Physics")
        if "chemistry" in prompt_lower:
            filters["departments"].append("Chemistry")
        if "biotech" in prompt_lower or "biotechnology" in prompt_lower:
            filters["departments"].append("Biotechnology")
            
        if "quantum" in prompt_lower:
            filters["categories"].append("Quantum Computing")
        if "ai" in prompt_lower or "intelligence" in prompt_lower or "transformer" in prompt_lower:
            filters["categories"].append("Artificial Intelligence")
            
        years = re.findall(r"\b(202\d)\b", prompt_lower)
        if years:
            filters["years"] = [int(y) for y in years]
            
        if not any(filters.values()):
            filters["general_query"] = prompt[:50]
            
        return json.dumps({
            "is_academic_query": is_academic,
            "rejection_reason": rejection,
            "filters": filters
        })

    def parse_query(self, user_query: str) -> Dict[str, Any]:
        system_instruction = (
            "You are the CRD (College Research Digest) AI Assistant parser. "
            "Your sole job is to analyze the user's natural language query and convert it into structured search filters "
            "to query the SQL database. "
            "Apply strict guardrails: You ONLY handle queries related to academic research papers, publications, authors, departments, and categories. "
            "If the query is administrative chatter, general chat, programming help, general knowledge, or unrelated, "
            "set is_academic_query to false and provide a polite rejection reason explaining what you can do. "
            "CRITICAL Exclusivity Rules:\n"
            "- Author names (like 'Robert Langdon') must go ONLY into 'authors'. NEVER place author names in 'categories', 'departments', 'title_keywords', or 'general_query'.\n"
            "- 'categories' should ONLY contain valid category names (e.g. 'Artificial Intelligence', 'Quantum Computing', 'Nanotechnology & Materials', 'Genomics & CRISPR', 'Renewable Energy & Evs', 'Cybersecurity & Cloud', '6G & Wireless Tech', 'Financial Econometrics'). Never place authors or years here.\n"
            "- 'departments' should ONLY contain valid academic departments (e.g. 'Computer Science', 'Physics', 'Chemistry', 'Biotechnology', 'Mechanical Engineering', 'Electrical Engineering', 'Mathematics', 'Economics & Finance').\n"
            "- Years must go ONLY into 'years'.\n"
            "Respond ONLY with a JSON object matching this schema:\n"
            "{\n"
            "  \"is_academic_query\": bool,\n"
            "  \"rejection_reason\": str (empty if academic),\n"
            "  \"filters\": {\n"
            "    \"title_keywords\": [str] (keywords from query to search in title/abstract),\n"
            "    \"authors\": [str] (author names mentioned),\n"
            "    \"departments\": [str] (departments mentioned),\n"
            "    \"years\": [int] (years mentioned),\n"
            "    \"categories\": [str] (categories/keywords mentioned),\n"
            "    \"general_query\": str (broad query if it is a general descriptive question)\n"
            "  }\n"
            "}"
        )
        
        prompt = f"User query: '{user_query}'\nExtract the JSON object."
        response_text = self._call_llm(prompt, system_instruction=system_instruction, json_mode=True)
        
        try:
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```"):
                first_nl = cleaned_text.find("\n")
                last_fence = cleaned_text.rfind("```")
                if first_nl != -1 and last_fence != -1:
                    cleaned_text = cleaned_text[first_nl:last_fence].strip()
            
            return json.loads(cleaned_text)
        except Exception as e:
            logger.error(f"Failed to parse LLM JSON response: {e}. Raw response: {response_text}")
            return json.loads(self._rule_based_fallback(user_query, json_mode=True))

    def query_papers(self, db: Session, filters: Dict[str, Any]) -> List[ResearchPaper]:
        query = db.query(ResearchPaper)
        conditions = []
        
        # 1. Title/Abstract keywords
        if filters.get("title_keywords"):
            for kw in filters["title_keywords"]:
                conditions.append(or_(
                    ResearchPaper.title.ilike(f"%{kw}%"),
                    ResearchPaper.abstract.ilike(f"%{kw}%")
                ))
                
        # 2. Authors
        if filters.get("authors"):
            for author in filters["authors"]:
                conditions.append(ResearchPaper.authors_raw.ilike(f"%{author}%"))
                
        # 3. Departments
        if filters.get("departments"):
            dept_conds = []
            for dept in filters["departments"]:
                dept_conds.append(ResearchPaper.department.ilike(f"%{dept}%"))
            if dept_conds:
                conditions.append(or_(*dept_conds))
                
        # 4. Years
        if filters.get("years"):
            conditions.append(ResearchPaper.publication_year.in_(filters["years"]))
            
        # 5. General query
        if filters.get("general_query"):
            gq = f"%{filters['general_query'].lower()}%"
            conditions.append(or_(
                ResearchPaper.title.ilike(gq),
                ResearchPaper.abstract.ilike(gq),
                ResearchPaper.authors_raw.ilike(gq),
                ResearchPaper.department.ilike(gq)
            ))
            
        if conditions:
            query = query.filter(and_(*conditions))
            
        results = query.order_by(ResearchPaper.publication_year.desc(), ResearchPaper.id.desc()).all()
        
        # 6. Filter by categories in Python (JSON list)
        if filters.get("categories"):
            cats = [c.lower() for c in filters["categories"]]
            final_results = []
            for p in results:
                paper_cats = [c.lower() for c in (p.categories_list or [])]
                if any(c in paper_cats for c in cats):
                    final_results.append(p)
            results = final_results
            
        return results

    def generate_response(self, user_query: str, filters: Dict[str, Any], papers: List[ResearchPaper]) -> str:
        """
        Generates a natural language response summarizing the papers found.
        """
        if not papers:
            prompt = (
                f"The user asked: '{user_query}'\n"
                f"We searched the database with filters: {json.dumps(filters)} and found 0 matching research papers.\n"
                "Write a short, concise, direct response stating that no publications were found matching their search. "
                "Suggest that they try different keywords, browse the repository, or verify the author's spelling. "
                "CRITICAL: Do NOT use email headers, subject lines, greetings ('Dear Professor', 'Dear User'), or sign-offs ('Best regards', 'Sincerely'). "
                "Keep the response direct and under 2-3 sentences."
            )
            return self._call_llm(prompt)
            
        papers_context = []
        for p in papers:
            papers_context.append({
                "title": p.title,
                "authors": p.authors_raw,
                "department": p.department,
                "year": p.publication_year,
                "summary": p.ai_summary or p.abstract[:150] + "..."
            })
            
        system_instruction = (
            "You are the CRD (College Research Digest) AI Assistant. "
            "Your task is to write a short, concise, and direct natural language response summarizing the search result. "
            "CRITICAL: Do NOT write an email. Do NOT use email formatting, headers, subject lines, greetings (e.g. 'Dear Professor', 'Hello Dr.'), or sign-offs (e.g. 'Best regards', 'Sincerely'). "
            "Describe what publications were found directly and briefly. Keep it under 3-4 sentences total."
        )
        
        prompt = (
            f"The user query: '{user_query}'\n"
            f"Database search returned the following {len(papers)} papers:\n"
            f"{json.dumps(papers_context, indent=2)}\n\n"
            "Please provide a direct, short, and concise response summarizing these findings. Do not include email structure."
        )
        
        return self._call_llm(prompt, system_instruction=system_instruction)

chat_agent_service = ChatAgentService()

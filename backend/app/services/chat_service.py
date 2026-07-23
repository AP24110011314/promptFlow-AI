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
            gemini_models = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash"]
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
                    "X-Title": "promptFlow-AI"
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
        is_academic = any(w in prompt_lower for w in [
            "paper", "publication", "article", "research", "author", "find", "search", "list", "show", "who", "what", "how",
            "quantum", "physics", "chemistry", "computer", "biology", "biotech", "math", "mathematics", "mech", "mechanical",
            "electrical", "elec", "finance", "economics", "tesla", "vance", "langdon", "patel", "feynman", "rostova", "curie",
            "jenkins", "baltimore", "nash", "ai", "intelligence", "crispr", "genomics", "cmos", "6g", "ev", "battery", "cloud"
        ])
        
        rejection = ""
        if not is_academic:
            rejection = "I can only answer questions related to academic research publications, authors, departments, or categories in promptFlow-AI. Please ask something related to papers."
            
        filters = {
            "title_keywords": [],
            "authors": [],
            "departments": [],
            "years": [],
            "categories": [],
            "general_query": ""
        }
        
        # Authors extraction with typo tolerance
        for key, name in [
            ("vance", "Vance"), ("eleanor", "Vance"),
            ("langdon", "Langdon"), ("langdn", "Langdon"), ("robert", "Langdon"),
            ("patel", "Patel"), ("aravind", "Patel"),
            ("feynman", "Feynman"), ("richard", "Feynman"),
            ("rostova", "Rostova"), ("elena", "Rostova"),
            ("curie", "Curie"), ("marie", "Curie"),
            ("jenkins", "Jenkins"), ("sarah", "Jenkins"),
            ("baltimore", "Baltimore"), ("david", "Baltimore"),
            ("tesla", "Tesla"), ("nikola", "Tesla"),
            ("nash", "Nash"), ("john", "Nash")
        ]:
            if key in prompt_lower and name not in filters["authors"]:
                filters["authors"].append(name)
            
        # Departments extraction with typo & abbreviation tolerance
        if any(w in prompt_lower for w in ["computer science", "cs", "comp sci", "computr"]):
            filters["departments"].append("Computer Science")
        if any(w in prompt_lower for w in ["physics", "physic", "phys"]):
            filters["departments"].append("Physics")
        if any(w in prompt_lower for w in ["chemistry", "chem", "chemis"]):
            filters["departments"].append("Chemistry")
        if any(w in prompt_lower for w in ["biotech", "biotechnology", "bio"]):
            filters["departments"].append("Biotechnology")
        if any(w in prompt_lower for w in ["math", "mathematics", "maths", "mathmatics"]):
            filters["departments"].append("Mathematics")
        if any(w in prompt_lower for w in ["mechanical", "mech", "mech eng", "mechanical engineering"]):
            filters["departments"].append("Mechanical Engineering")
        if any(w in prompt_lower for w in ["electrical", "elec", "ee", "electrical engineering"]):
            filters["departments"].append("Electrical Engineering")
        if any(w in prompt_lower for w in ["economics", "finance", "econ", "fin", "econometrics"]):
            filters["departments"].append("Economics & Finance")
            
        # Categories extraction
        if any(w in prompt_lower for w in ["quantum"]):
            filters["categories"].append("Quantum Computing")
        if any(w in prompt_lower for w in ["ai", "intelligence", "transformer", "deep learning", "neural"]):
            filters["categories"].append("Artificial Intelligence")
        if any(w in prompt_lower for w in ["nano", "materials", "mof"]):
            filters["categories"].append("Nanotechnology & Materials")
        if any(w in prompt_lower for w in ["crispr", "genomics", "gene", "genome"]):
            filters["categories"].append("Genomics & CRISPR")
        if any(w in prompt_lower for w in ["ev", "evs", "battery", "renewable", "solar"]):
            filters["categories"].append("Renewable Energy & Evs")
        if any(w in prompt_lower for w in ["cloud", "cybersecurity", "security", "zero-day"]):
            filters["categories"].append("Cybersecurity & Cloud")
        if any(w in prompt_lower for w in ["6g", "5g", "wireless", "cmos", "transceiver"]):
            filters["categories"].append("6G & Wireless Tech")
        if any(w in prompt_lower for w in ["econometrics", "financial", "stochastic", "martingale"]):
            filters["categories"].append("Financial Econometrics")
            
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
            "You are the promptFlow-AI Assistant parser. "
            "Your sole job is to analyze the user's natural language query and convert it into structured search filters "
            "to query the SQL database. "
            "Apply strict guardrails: You ONLY handle queries related to academic research papers, publications, authors, departments, and categories. "
            "If the query is administrative chatter, general chat, programming help, general knowledge, or unrelated, "
            "set is_academic_query to false and provide a polite rejection reason explaining what you can do. "
            "CRITICAL Exclusivity & Smart Parsing Rules:\n"
            "- Author names (like 'Robert Langdon', 'John Nash') must go ONLY into 'authors'. NEVER place author names in 'categories', 'departments', 'title_keywords', or 'general_query'. Automatically correct author typos (e.g. 'langdn' -> 'Langdon', 'vanc' -> 'Vance').\n"
            "- 'categories' should ONLY contain valid category names (e.g. 'Artificial Intelligence', 'Quantum Computing', 'Nanotechnology & Materials', 'Genomics & CRISPR', 'Renewable Energy & Evs', 'Cybersecurity & Cloud', '6G & Wireless Tech', 'Financial Econometrics'). Never place authors or years here.\n"
            "- 'departments' should ONLY contain canonical academic departments (e.g. 'Computer Science', 'Physics', 'Chemistry', 'Biotechnology', 'Mechanical Engineering', 'Electrical Engineering', 'Mathematics', 'Economics & Finance'). Automatically map abbreviations and typos (e.g., 'math', 'maths', 'mathmatics' -> 'Mathematics'; 'cs', 'comp sci' -> 'Computer Science'; 'mech eng' -> 'Mechanical Engineering').\n"
            "- Years must go ONLY into 'years'.\n"
            "- 'general_query': ONLY use this if the user is searching for a specific technical topic, concept, or keyword that does NOT fit into authors, departments, years, or categories. NEVER put conversational phrases, questions, or filler words (such as 'how many papers published by...', 'show me all papers from...', 'list papers...', 'what did...', 'find publications on...', 'are there any...', 'department') into general_query or title_keywords!\n"
            "- If you extract ANY specific filter (authors, departments, years, or categories), YOU MUST leave general_query empty \"\" unless there is an additional distinct technical search topic.\n"
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
            "    \"general_query\": str (leave empty if departments/authors/categories are found)\n"
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
        # Step 1: Normalize Departments (map typos, case, and abbreviations to standard names)
        norm_depts = []
        dept_map = {
            "math": "Mathematics", "mathematics": "Mathematics", "maths": "Mathematics", "mathmatics": "Mathematics",
            "cs": "Computer Science", "computer": "Computer Science", "comp sci": "Computer Science", "computr": "Computer Science",
            "phys": "Physics", "physics": "Physics", "physic": "Physics",
            "chem": "Chemistry", "chemistry": "Chemistry", "chemis": "Chemistry",
            "bio": "Biotechnology", "biotech": "Biotechnology", "biotechnology": "Biotechnology",
            "mech": "Mechanical Engineering", "mechanical": "Mechanical Engineering", "mechanical engineering": "Mechanical Engineering",
            "elec": "Electrical Engineering", "electrical": "Electrical Engineering", "ee": "Electrical Engineering", "electrical engineering": "Electrical Engineering",
            "econ": "Economics & Finance", "economics": "Economics & Finance", "finance": "Economics & Finance", "econometrics": "Economics & Finance"
        }
        for d in filters.get("departments", []):
            d_lower = d.lower().strip()
            mapped = False
            for k, val in dept_map.items():
                if k in d_lower or d_lower in k:
                    if val not in norm_depts:
                        norm_depts.append(val)
                    mapped = True
                    break
            if not mapped and d not in norm_depts:
                norm_depts.append(d)
        filters["departments"] = norm_depts

        # Step 2: Normalize Authors
        norm_authors = []
        author_map = {
            "vance": "Vance", "eleanor": "Vance",
            "langdon": "Langdon", "langdn": "Langdon", "robert": "Langdon",
            "patel": "Patel", "aravind": "Patel",
            "feynman": "Feynman", "richard": "Feynman",
            "rostova": "Rostova", "elena": "Rostova",
            "curie": "Curie", "marie": "Curie",
            "jenkins": "Jenkins", "sarah": "Jenkins",
            "baltimore": "Baltimore", "david": "Baltimore",
            "tesla": "Tesla", "nikola": "Tesla",
            "nash": "Nash", "john": "Nash"
        }
        for a in filters.get("authors", []):
            a_lower = a.lower().strip()
            mapped = False
            for k, val in author_map.items():
                if k in a_lower:
                    if val not in norm_authors:
                        norm_authors.append(val)
                    mapped = True
                    break
            if not mapped and a not in norm_authors:
                norm_authors.append(a)
        filters["authors"] = norm_authors

        # Step 3: Clean General Query (strip conversational filler & terms already in departments/authors/categories)
        if filters.get("general_query"):
            gq = filters["general_query"].lower()
            filler_words = {
                "how", "many", "papers", "paper", "published", "publish", "publication", "publications",
                "by", "from", "in", "on", "about", "what", "did", "does", "do", "show", "me", "list", "all",
                "are", "there", "any", "research", "department", "dept", "author", "authored", "written",
                "find", "search", "looking", "for", "tell", "give", "please", "would", "could", "can", "you",
                "related", "to", "who", "which", "whose", "has", "have", "had", "was", "were", "is", "an", "the"
            }
            # Also remove terms already captured in departments or authors or categories
            for d in norm_depts:
                for word in d.lower().split():
                    filler_words.add(word)
            for a in norm_authors:
                for word in a.lower().split():
                    filler_words.add(word)
            for c in filters.get("categories", []):
                for word in c.lower().split():
                    filler_words.add(word)
                    
            tokens = [t.strip(",.?!/-") for t in gq.split()]
            cleaned_tokens = [t for t in tokens if t and t not in filler_words and len(t) > 2]
            filters["general_query"] = " ".join(cleaned_tokens)

        # Step 4: Build SQL conditions
        query = db.query(ResearchPaper)
        conditions = []
        
        # Title/Abstract keywords
        if filters.get("title_keywords"):
            for kw in filters["title_keywords"]:
                conditions.append(or_(
                    ResearchPaper.title.ilike(f"%{kw}%"),
                    ResearchPaper.abstract.ilike(f"%{kw}%")
                ))
                
        # Authors
        if filters.get("authors"):
            author_conds = [ResearchPaper.authors_raw.ilike(f"%{author}%") for author in filters["authors"]]
            if author_conds:
                conditions.append(or_(*author_conds))
                
        # Departments
        if filters.get("departments"):
            dept_conds = [ResearchPaper.department.ilike(f"%{dept}%") for dept in filters["departments"]]
            if dept_conds:
                conditions.append(or_(*dept_conds))
                
        # Years
        if filters.get("years"):
            conditions.append(ResearchPaper.publication_year.in_(filters["years"]))
            
        # Cleaned General Query
        if filters.get("general_query"):
            # Search each remaining token across title/abstract/authors/dept
            for token in filters["general_query"].split():
                conditions.append(or_(
                    ResearchPaper.title.ilike(f"%{token}%"),
                    ResearchPaper.abstract.ilike(f"%{token}%"),
                    ResearchPaper.authors_raw.ilike(f"%{token}%"),
                    ResearchPaper.department.ilike(f"%{token}%")
                ))
                
        if conditions:
            query = query.filter(and_(*conditions))
            
        results = query.order_by(ResearchPaper.publication_year.desc(), ResearchPaper.id.desc()).all()
        
        # Category filtering in Python
        if filters.get("categories"):
            cats = [c.lower() for c in filters["categories"]]
            final_results = []
            for p in results:
                paper_cats = [c.lower() for c in (p.categories_list or [])]
                # Also check if any category keyword is in title or abstract as fallback
                if any(c in paper_cats for c in cats) or any(c in p.title.lower() or c in p.abstract.lower() for c in cats):
                    final_results.append(p)
            results = final_results
            
        # Step 5: Fallback / Relaxed Search if strict AND returned 0 results!
        if not results and len(conditions) > 1:
            relaxed_query = db.query(ResearchPaper).filter(or_(*conditions)).order_by(ResearchPaper.publication_year.desc(), ResearchPaper.id.desc())
            results = relaxed_query.all()
            if filters.get("categories"):
                cats = [c.lower() for c in filters["categories"]]
                final_results = [p for p in results if any(c in [pc.lower() for pc in (p.categories_list or [])] for c in cats) or any(c in p.title.lower() or c in p.abstract.lower() for c in cats)]
                if final_results:
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
            "You are the promptFlow-AI Assistant. "
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

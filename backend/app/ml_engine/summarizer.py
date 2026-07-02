import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

class ExtractiveSummarizer:
    def summarize(self, text: str, max_sentences: int = 3) -> str:
        """Generates an extractive summary of the research paper using sentence TF-IDF ranking."""
        if not text or len(text.strip()) < 100:
            return "Paper summary: Concise research publication outlining experimental analysis and findings."

        # Clean text and split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20 and len(s.strip().split()) > 5]

        if len(sentences) <= max_sentences:
            return " ".join(sentences)

        try:
            # TF-IDF matrix of sentences
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(sentences)
            
            # Score sentences by the sum of their TF-IDF word values
            sentence_scores = np.array(tfidf_matrix.sum(axis=1)).flatten()
            
            # Boost score for sentences mentioning key academic terms
            for idx, s in enumerate(sentences):
                s_lower = s.lower()
                if any(w in s_lower for w in ["conclude", "result", "propose", "achieve", "demonstrate", "novel", "significant", "improve"]):
                    sentence_scores[idx] += 0.5
                if idx == 0:  # First sentence often defines the objective
                    sentence_scores[idx] += 0.3

            # Top k sentences
            top_indices = sentence_scores.argsort()[-max_sentences:][::-1]
            top_indices.sort()  # Maintain original sentence order

            summary_sentences = [sentences[i] for i in top_indices]
            return " ".join(summary_sentences)
        except Exception as e:
            # Fallback to first few sentences
            return " ".join(sentences[:max_sentences])

summarizer = ExtractiveSummarizer()

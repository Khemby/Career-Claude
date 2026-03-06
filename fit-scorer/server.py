"""
Resume-JD Fit Scorer
Runs a local HTTP server on port 7821.
Uses sentence-transformers for semantic similarity scoring.
"""

import json
import re
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Optional

try:
    from sentence_transformers import SentenceTransformer, util
    MODEL_AVAILABLE = True
except ImportError:
    MODEL_AVAILABLE = False

PORT = 7821
MODEL_NAME = "all-MiniLM-L6-v2"  # Fast, small, good quality (~80MB)

# Load model once at startup
_model: Optional[object] = None

def get_model():
    global _model
    if _model is None and MODEL_AVAILABLE:
        print(f"Loading model {MODEL_NAME}...", flush=True)
        _model = SentenceTransformer(MODEL_NAME)
        print("Model loaded.", flush=True)
    return _model


# ---------------------------------------------------------------------------
# Skills extraction helpers
# ---------------------------------------------------------------------------

# Common tech/soft skills for extraction — not exhaustive, supplements embeddings
SKILL_PATTERNS = re.compile(
    r"\b("
    r"python|javascript|typescript|java|c\+\+|c#|go|rust|ruby|php|swift|kotlin|scala|r\b|matlab|"
    r"react|angular|vue|node\.?js|django|flask|fastapi|spring|rails|laravel|"
    r"aws|azure|gcp|docker|kubernetes|terraform|ansible|ci/cd|github actions|jenkins|"
    r"sql|postgresql|mysql|mongodb|redis|elasticsearch|kafka|spark|airflow|"
    r"machine learning|deep learning|nlp|computer vision|data science|llm|"
    r"agile|scrum|product management|project management|stakeholder|"
    r"leadership|communication|collaboration|mentoring|cross.functional|"
    r"rest|graphql|microservices|api|cloud|devops|mlops|"
    r"excel|tableau|power bi|looker|dbt|"
    r"figma|sketch|ux|ui design|user research|"
    r"sales|marketing|growth|revenue|b2b|saas|"
    r"security|compliance|gdpr|soc 2|hipaa"
    r")(?!\w)",
    re.IGNORECASE
)


def extract_skills(text: str) -> list[str]:
    matches = SKILL_PATTERNS.findall(text.lower())
    return list(dict.fromkeys(m.strip() for m in matches))  # dedup, preserve order


def compute_fit(resume_text: str, jd_text: str) -> dict:
    model = get_model()
    if model is None:
        return {"error": "sentence-transformers not installed"}

    # Semantic similarity score
    resume_emb = model.encode(resume_text, convert_to_tensor=True)
    jd_emb = model.encode(jd_text, convert_to_tensor=True)
    similarity = float(util.cos_sim(resume_emb, jd_emb)[0][0])

    # Convert cosine similarity (~0.0–1.0) to a 0–100 percentage.
    # Cosine similarity for unrelated docs is usually 0.1–0.3, perfect is 1.0.
    # Rescale so 0.2 → 0%, 0.9 → 100% for more intuitive output.
    score = round(max(0, min(100, (similarity - 0.2) / 0.7 * 100)))

    # Skill overlap analysis
    resume_skills = set(extract_skills(resume_text))
    jd_skills = set(extract_skills(jd_text))

    matched = sorted(resume_skills & jd_skills)
    missing = sorted(jd_skills - resume_skills)

    return {
        "score": score,
        "raw_similarity": round(similarity, 4),
        "matched_skills": matched,
        "missing_skills": missing,
        "resume_skill_count": len(resume_skills),
        "jd_skill_count": len(jd_skills),
    }


# ---------------------------------------------------------------------------
# HTTP server
# ---------------------------------------------------------------------------

class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # suppress request logs for clean MCP stdio output

    def send_json(self, status: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            self.send_json(200, {"status": "ok", "model_loaded": _model is not None})
        else:
            self.send_json(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/score":
            self.send_json(404, {"error": "not found"})
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self.send_json(400, {"error": "invalid JSON"})
            return

        resume_text = payload.get("resume_text", "").strip()
        jd_text = payload.get("jd_text", "").strip()

        if not resume_text or not jd_text:
            self.send_json(400, {"error": "resume_text and jd_text are required"})
            return

        result = compute_fit(resume_text, jd_text)
        self.send_json(200, result)


if __name__ == "__main__":
    if not MODEL_AVAILABLE:
        print("WARNING: sentence-transformers not installed. Run: pip install sentence-transformers", flush=True)
        print("Fit scorer will not function without it.", flush=True)
        exit(1)

    # Eagerly load model on startup
    get_model()

    httpd = HTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Fit scorer running on http://127.0.0.1:{PORT}", flush=True)
    httpd.serve_forever()

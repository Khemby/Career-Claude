# Career Claude — Architecture & Technical Reference

This document covers the full technical design of Career Claude: system architecture, MCP server API, ML scoring service, skill file details, and data flows. For user-facing documentation, see [README.md](./README.md).

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Repository Structure](#repository-structure)
4. [MCP Server](#mcp-server)
   - [Tools Reference](#tools-reference)
   - [Installation & Configuration](#installation--configuration)
   - [Connecting to Claude Desktop](#connecting-to-claude-desktop)
5. [ML Fit Scorer](#ml-fit-scorer)
   - [How It Works](#how-it-works)
   - [API Reference](#api-reference)
   - [Setup](#setup)
   - [Graceful Fallback](#graceful-fallback)
6. [Skill Files](#skill-files)
7. [Feedback & Memory System](#feedback--memory-system)
8. [System Prompt](#system-prompt)
9. [Data Flow Diagrams](#data-flow-diagrams)
10. [Environment Variables](#environment-variables)

---

## System Overview

Career Claude is an AI career coach that operates through natural conversation. A non-technical user interacts entirely through Claude Desktop or Claude.ai — they paste a resume, describe a job, or ask for help, and Claude automatically orchestrates the appropriate tools and skill files.

**Core capabilities:**

| Capability | How it works |
|---|---|
| Career clarity & self-discovery | Claude applies `self-discovery-career-clarity.md` skill file |
| Career decision-making | Claude applies `career-decision-making.md` skill file |
| Interview preparation | Claude applies `interview-preparation.md` skill file |
| Personal branding | Claude applies `personal-branding.md` skill file |
| Resume audit | Claude applies `resume-best-practices.md` skill file |
| Resume customization | Claude applies `resume-customization.md` skill file |
| Cover letter drafting | Claude applies `cover-letter.md` skill file |
| Job search strategy | Claude applies `job-search-strategy.md` skill file |
| Resume parsing (PDF/DOCX) | `parse_resume` MCP tool |
| Resume-JD fit scoring | `score_resume_fit` MCP tool → Python ML service |
| Persistent preferences | `save_feedback` / `get_feedback` / `remove_feedback` MCP tools |

The system is designed so that **each layer is optional**. A user can get value from skills-only (no server), add the MCP server for resume parsing and preferences, and optionally add the Python service for ML-powered fit scoring. Removing any layer degrades gracefully.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   User (Claude Desktop / claude.ai)      │
│              Natural language conversation only          │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     Claude (LLM)                         │
│                                                          │
│  Reads skill files from project knowledge base:          │
│  • self-discovery-career-clarity.md                      │
│  • career-decision-making.md                             │
│  • interview-preparation.md                              │
│  • personal-branding.md                                  │
│  • resume-best-practices.md                              │
│  • resume-customization.md                               │
│  • job-search-strategy.md                                │
│  • cover-letter.md                                       │
│                                                          │
│  Governed by: project-instructions.md (system prompt)    │
└──────────────────────────┬──────────────────────────────┘
                           │ MCP protocol (stdio)
                           ▼
┌─────────────────────────────────────────────────────────┐
│              MCP Server (TypeScript / Node.js)           │
│              mcp-server/src/index.ts                     │
│                                                          │
│  Tools:                                                  │
│  • parse_resume     → resume-parser.ts (pdf-parse,       │
│                        mammoth)                          │
│  • score_resume_fit → fit-scorer.ts → Python service     │
│  • save_feedback    → feedback.ts → ~/.career-claude/    │
│  • get_feedback     → feedback.ts                        │
│  • remove_feedback  → feedback.ts                        │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP (localhost:7821)
                           ▼
┌─────────────────────────────────────────────────────────┐
│         ML Fit Scorer (Python)  [OPTIONAL]               │
│         fit-scorer/server.py                             │
│                                                          │
│  • sentence-transformers (all-MiniLM-L6-v2, ~80MB)       │
│  • Semantic cosine similarity scoring                    │
│  • Regex-based skill extraction                          │
│  • Runs on localhost only — no external calls            │
└─────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
career-claude/
├── README.md                        # User-facing documentation
├── ARCHITECTURE.md                  # This file — technical reference
├── project-instructions.md          # Master system prompt for Claude Projects
│
├── skills/                          # Domain knowledge files loaded by Claude
│   ├── self-discovery-career-clarity.md  # Values, work style, career stage assessment
│   ├── career-decision-making.md    # Bias awareness, offer evaluation, stay/leave
│   ├── interview-preparation.md     # STAR method, story bank, question frameworks
│   ├── personal-branding.md         # Elevator pitch, LinkedIn, digital presence
│   ├── resume-best-practices.md     # Audit frameworks, ATS rules, scoring rubric
│   ├── resume-customization.md      # JD analysis, keyword matching, bullet rewrites
│   ├── job-search-strategy.md       # Sourcing, targeting, networking, tracking
│   └── cover-letter.md              # Structure, tone guide, templates, anti-patterns
│
├── mcp-server/                      # TypeScript MCP tool server
│   ├── src/
│   │   ├── index.ts                 # Server entry point, tool registration & routing
│   │   ├── resume-parser.ts         # PDF/DOCX text extraction + structured parsing
│   │   ├── fit-scorer.ts            # HTTP client for Python ML service + fallback
│   │   └── feedback.ts              # Persistent preferences store (JSON file)
│   ├── package.json
│   └── tsconfig.json
│
├── fit-scorer/                      # Python ML service (optional)
│   ├── server.py                    # HTTP server + sentence-transformers scoring
│   └── requirements.txt             # sentence-transformers>=2.7.0
│
└── examples/
    ├── sample-workflow.md           # Annotated full session walkthrough
    └── user-preferences-example.json
```

---

## MCP Server

The MCP server extends Claude with tools that require external data or file system access. It is written in TypeScript, runs as a local Node.js process, and communicates with Claude over stdio using the Model Context Protocol.

### Tools Reference

#### `parse_resume`

Extract structured data from a resume. Accepts plain text, a path to a PDF file, or a path to a DOCX file.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `content` | string | Yes | Resume text, or an absolute file path to a `.pdf` or `.docx` file |
| `format` | `"text" \| "pdf" \| "docx"` | No | Default: `"text"` |

**Returns:** `ParsedResume`
```json
{
  "raw_text": "...",
  "contact": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "555-123-4567",
    "location": "Austin, TX",
    "linkedin": "https://linkedin.com/in/janesmith",
    "github": null,
    "website": null
  },
  "summary": "Senior engineer with 8 years...",
  "experience": [
    {
      "title": "Staff Engineer",
      "company": "Acme Corp",
      "location": null,
      "start_date": "Jan 2021",
      "end_date": "Present",
      "bullets": ["Led migration to microservices...", "..."]
    }
  ],
  "education": [
    {
      "degree": "B.S. Computer Science",
      "institution": "University of Texas",
      "year": "2016",
      "gpa": null
    }
  ],
  "skills": ["Python", "AWS", "Kubernetes"],
  "certifications": ["AWS Solutions Architect"],
  "parse_warnings": []
}
```

**Implementation notes:**
- PDF extraction uses `pdf-parse` (no native binary dependencies)
- DOCX extraction uses `mammoth`
- Sections are detected by regex against common heading variants
- `parse_warnings` surfaces issues like a missing email or undetected bullet points

---

#### `score_resume_fit`

Semantically scores how well a resume matches a job description. Requires the Python ML service to be running (see [ML Fit Scorer](#ml-fit-scorer)).

| Parameter | Type | Required | Description |
|---|---|---|---|
| `resume_text` | string | Yes | Full plain-text content of the resume |
| `jd_text` | string | Yes | Full plain-text content of the job description |

**Returns when service is available:**
```json
{
  "available": true,
  "score": 74,
  "raw_similarity": 0.712,
  "matched_skills": ["python", "aws", "sql", "agile"],
  "missing_skills": ["kubernetes", "terraform", "mlops"],
  "resume_skill_count": 12,
  "jd_skill_count": 9
}
```

**Returns when service is unavailable:**
```json
{
  "available": false,
  "reason": "The ML fit-scoring service is not running on this machine.",
  "suggestion": "To enable semantic fit scoring, start the Python service: cd fit-scorer && pip install -r requirements.txt && python server.py"
}
```

Claude is instructed to offer manual analysis when `available` is `false`.

---

#### `save_feedback`

Persist a user preference so it is remembered in future sessions.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `category` | string (enum) | Yes | See category list in [Feedback & Memory System](#feedback--memory-system) |
| `preference` | string | Yes | The preference in plain English |
| `context` | string | No | What triggered this feedback |

**Returns:** `MutationResult` with `success`, `message`, and the saved `entry` (including its `id` for future removal). Duplicate preferences (same category + exact text) are silently ignored.

---

#### `get_feedback`

Retrieve stored preferences. Called automatically at session start.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `category` | string (enum) | No | Filter by category. Omit to retrieve all. |

**Returns:** `{ preferences: FeedbackEntry[], total: number }` sorted by most recent first. Only active (non-deleted) entries are returned.

---

#### `remove_feedback`

Soft-delete a stored preference by ID.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | UUID from a prior `get_feedback` response |

The preference is marked `active: false` in the JSON store but not physically deleted, preserving history.

---

### Installation & Configuration

**Prerequisites:** Node.js 18+

```bash
cd mcp-server
npm install
npm run build
```

**Available scripts:**

| Script | Command | Description |
|---|---|---|
| Build | `npm run build` | Compile TypeScript to `dist/` |
| Dev | `npm run dev` | Run directly with `tsx` (no build step) |
| Start | `npm start` | Run compiled `dist/index.js` |

---

### Connecting to Claude Desktop

Add to your `claude_desktop_config.json` (typically at `~/Library/Application Support/Claude/` on macOS):

```json
{
  "mcpServers": {
    "career-claude": {
      "command": "node",
      "args": ["/absolute/path/to/career-claude/mcp-server/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop. All five tools will be available automatically.

---

## ML Fit Scorer

The fit scorer is a standalone Python HTTP service that runs locally on your machine. It provides semantic resume-to-job-description matching using sentence embeddings — going beyond keyword matching to understand meaning.

### How It Works

**1. Semantic similarity (the score)**

Both the resume and job description are encoded into embedding vectors using `all-MiniLM-L6-v2`, a lightweight sentence-transformer model (~80MB, runs on CPU). The cosine similarity between the two vectors is computed and rescaled to a 0–100 score:

```
raw cosine similarity range: 0.0 – 1.0
unrelated documents typically: 0.1 – 0.3
strong match: 0.7 – 0.9+

score = clamp((similarity - 0.2) / 0.7 * 100, 0, 100)
```

This rescaling makes the output intuitive: a score near 0 means no meaningful overlap, 100 means nearly identical content.

**2. Skill extraction (the gap analysis)**

A regex pattern matches ~80 named skills across categories: programming languages, frameworks, cloud platforms, databases, data tools, soft skills, compliance terms, and domain knowledge. Skills are extracted from both documents, then compared:

- `matched_skills` — found in both resume and JD
- `missing_skills` — in the JD but absent from the resume

Skill extraction is additive to the semantic score, not a replacement. A resume may score highly even without using exact skill keywords, because the embedding captures semantic equivalence (e.g. "distributed systems" and "high-throughput infrastructure" will be considered similar).

**3. Model loading**

The model loads once at server startup (~2–5 seconds, longer on first run while downloading). All subsequent scoring requests run in ~100–500ms depending on hardware. The model file is cached at `~/.cache/torch/sentence_transformers/` after the first download.

### API Reference

The service listens on `http://127.0.0.1:7821` (localhost only — not exposed to the network).

#### `GET /health`

Health check. Returns whether the model is loaded and ready.

```json
{ "status": "ok", "model_loaded": true }
```

#### `POST /score`

Score a resume against a job description.

**Request body:**
```json
{
  "resume_text": "Full text of the resume...",
  "jd_text": "Full text of the job description..."
}
```

**Response (200):**
```json
{
  "score": 74,
  "raw_similarity": 0.712,
  "matched_skills": ["python", "aws", "sql"],
  "missing_skills": ["kubernetes", "terraform"],
  "resume_skill_count": 12,
  "jd_skill_count": 9
}
```

**Error responses:**
- `400` — Missing `resume_text` or `jd_text`, or malformed JSON
- `404` — Unknown path

### Setup

```bash
cd fit-scorer
pip install -r requirements.txt
python server.py
```

The server prints `Fit scorer running on http://127.0.0.1:7821` when ready. Keep this terminal open while using the fit scoring feature in Claude.

### Graceful Fallback

The TypeScript MCP client (`fit-scorer.ts`) wraps all HTTP calls with a 30-second timeout and a try/catch. If the Python service is not running or unreachable for any reason, `score_resume_fit` returns `{ available: false, ... }` instead of throwing an error — the MCP server itself does not crash.

Claude's tool description instructs it to detect `available: false` and respond gracefully, offering manual analysis instead.

This means:
- The MCP server starts successfully whether or not Python is installed
- All other tools (`parse_resume`, `save_feedback`, etc.) are completely unaffected
- Users without Python get the full system minus fit scoring, with no error messages

---

## Skill Files

Skill files are Markdown documents uploaded to the Claude Project's knowledge base. Claude reads and applies them based on the task at hand. They are plain text — no code or tooling required.

### `self-discovery-career-clarity.md`

Framework for helping users understand who they are professionally. Covers:
- Career stage assessment (Discover, Prepare, Establish, Advance, Navigate)
- Values clarity exercise (20 values, interactive top-5 selection)
- Identity and fit diagnostic (burnout vs. boredom vs. misfit)
- Work style archetypes (Builder, Thinker, Creator, Helper, Leader, Organizer)
- Translating self-knowledge into target role profiles

### `career-decision-making.md`

Framework for evaluating career decisions with research-backed tools. Covers:
- Six cognitive biases that distort career predictions (with counter-questions)
- Offer evaluation scorecard (6 dimensions, weighted scoring)
- Stay vs. leave diagnosis (wrong role, wrong environment, outgrown it, burnout)
- Lateral move evaluation (running toward vs. running away)
- Surrogation strategy (using others' lived experience as data)

### `interview-preparation.md`

Framework for preparing for interviews across formats. Covers:
- Interview format breakdowns (behavioral, case-based, technical, panel, phone screen)
- STAR method with proportions and before/after examples
- Story bank building (8 categories, interactive mapping exercise)
- Common question frameworks ("tell me about yourself", "why this company?", weaknesses)
- Pre-interview research checklist and post-interview follow-up

### `personal-branding.md`

Framework for building a professional narrative and online presence. Covers:
- Core narrative development ("you are not a resume — you're a story in motion")
- Elevator pitch in three versions (30-second, 60-second, written)
- LinkedIn optimization (headline, About section, engagement strategy)
- Digital presence audit and cleanup
- Transferable skills translation for career changers

### `resume-best-practices.md`

Framework for auditing a resume. Covers:
- Structural rules (single column, consistent dates, section order)
- ATS compatibility checklist
- AI-era resume positioning (modern ATS, skills-based hiring)
- Impact language and quantification standards
- Career narrative across roles
- Common mistakes and how to fix them
- Scoring rubric (produces the X/10 audit score)

### `resume-customization.md`

Framework for tailoring a resume to a specific job description. Covers:
- JD deconstruction (required vs. preferred, signals, red flags)
- Values-driven customization (aligning with company culture)
- Keyword gap analysis methodology (including the 60% rule)
- Bullet point rewrite patterns (before/after format)
- Addressing concerns proactively (career changers, gaps, overqualification)
- Summary/objective rewriting for the target role

### `job-search-strategy.md`

Framework for planning and executing a job search. Covers:
- Defining a target company profile
- Sourcing channels and the hidden job market
- Tiered application strategy (Tier A/B/C)
- AI-integrated job search tactics
- Informational interview playbook (question frameworks, referral conversion)
- Bias awareness in your search
- Application tracking methodology

### `cover-letter.md`

Framework for writing targeted cover letters. Covers:
- Four-paragraph structure (hook, proof, fit, close)
- Storytelling and career narrative integration
- Addressing objections proactively
- Tone calibration by company type
- AI screening considerations
- Anti-patterns to avoid (generic openers, restating the resume)

---

## Feedback & Memory System

Career Claude persists user preferences across sessions using three MCP tools backed by a local JSON file.

### Storage

Preferences are stored at `~/.career-claude/feedback.json` (overridable with `CAREER_CLAUDE_FEEDBACK_PATH`).

**Schema:**
```json
{
  "version": "1.0",
  "last_updated": "2026-03-06T12:00:00Z",
  "preferences": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "category": "location",
      "preference": "Remote only — will not relocate",
      "context": "User corrected a suggestion for an in-office role in Chicago",
      "timestamp": "2026-03-06T12:00:00Z",
      "active": true
    }
  ]
}
```

### Session Behavior

At the start of every session, Claude calls `get_feedback` (no category filter) before responding to any substantive request. Stored preferences are silently applied — Claude does not list them back unless the user asks.

**Example:** If `location` contains `"Remote only"`, Claude will never suggest in-office roles, never mention relocation, and will filter job search results accordingly.

### Preference Categories

| Category | When to use | Example |
|---|---|---|
| `role_type` | Job function constraints | "Only software engineering roles" |
| `industry` | Sector preferences or exclusions | "No finance or banking" |
| `location` | Remote, city, relocation preferences | "Remote only — won't relocate" |
| `salary` | Compensation floor, equity expectations | "Minimum $130k base" |
| `company_size` | Startup vs. enterprise preference | "Only startups under 200 people" |
| `work_style` | Remote / hybrid / in-office arrangement | "Hybrid is fine, no full in-office" |
| `resume_style` | Tone, format, length for resume writing | "Keep tone conversational, less corporate" |
| `search_filter` | Keywords or companies to always include or exclude | "Never show roles at [Company X]" |
| `general` | Anything that doesn't fit a specific category | Any persistent preference |

### Duplicate Handling

If `save_feedback` is called with the same `category` and `preference` text as an existing active entry, it returns the existing entry without creating a duplicate.

### Deletion

`remove_feedback` performs a soft delete (`active: false`). The record is retained in the JSON file for audit purposes but excluded from all `get_feedback` responses.

---

## System Prompt

`project-instructions.md` is the master system prompt pasted into the Claude Project's Instructions panel. It defines:

- **Persona** — Career Claude's identity, expertise, and tone: direct, encouraging, specific, and actionable
- **Core capabilities** — What tasks it handles and which skill file to load for each
- **Feedback & memory rules** — Exactly when to call `save_feedback`, `get_feedback`, and `remove_feedback`, and what triggers each category
- **Session workflow** — Five-step process: understand situation → collect materials → audit resume → customize for role → cover letter / job search
- **Output formats** — Structured templates for audits (scored sections), customizations (before/after bullets), and cover letters
- **Boundaries** — What Career Claude will not do: fabricate credentials, misrepresent experience, or make outcome promises

Claude is instructed to always reason from skill file content when responding — not to improvise — and to apply stored preferences silently without announcing them.

---

## Data Flow Diagrams

### Resume Audit Flow

```
User: "Here's my resume [paste]"
  ↓
Claude calls parse_resume(content, format="text")
  ↓ MCP → resume-parser.ts
Extracts: contact, summary, experience, education, skills, certifications
  ↓
Claude receives ParsedResume JSON
  ↓
Claude reads resume-best-practices.md from knowledge base
  ↓
Claude delivers structured audit (score, strengths, critical issues, quick wins)
```

### Fit Scoring Flow

```
User: "How well do I match this job posting?"
  ↓
Claude calls score_resume_fit(resume_text, jd_text)
  ↓ MCP → fit-scorer.ts → POST http://127.0.0.1:7821/score
sentence-transformers encodes both documents → cosine similarity → rescaled score
regex extracts skills from both → computes matched / missing sets
  ↓
{ score: 74, matched_skills: [...], missing_skills: [...] }
  ↓
Claude explains result in plain language + recommends specific improvements

If Python service not running:
  fit-scorer.ts catches ECONNREFUSED → returns { available: false }
  Claude: "ML scoring isn't available — here's my manual analysis instead..."
```

### Preferences Flow

```
Session start:
  Claude calls get_feedback()
  Reads ~/.career-claude/feedback.json
  Silently applies all active preferences to every response

During session:
  User: "I won't consider anything under $130k"
  Claude calls save_feedback({ category: "salary", preference: "Minimum $130k base",
                               context: "User stated compensation floor" })
  Claude: "Got it — I've saved that preference. I'll apply it going forward."

Future sessions:
  get_feedback() returns salary preference
  Claude filters all job suggestions and salary mentions accordingly
```

---

## Environment Variables

| Variable | Component | Default | Description |
|---|---|---|---|
| `CAREER_CLAUDE_FEEDBACK_PATH` | MCP Server | `~/.career-claude/feedback.json` | Override the path for the preferences store. Useful for testing or shared environments. |

---

## License

MIT

# Agent Session: Career Claude — Full System Build

**Project:** Career Claude — AI career coaching system
**Session date:** March 6, 2026
**Model:** Claude Sonnet 4.6
**Branch:** `claude/career-coach-setup-9syTP`

---

## What Was Built

A production-ready, multi-layer AI career coaching system. The agent designed and implemented every component from scratch across a single session:

- **TypeScript MCP server** — 6 tools exposed to Claude via Model Context Protocol
- **PDF/DOCX resume parser** — zero native dependencies, regex section detection
- **Adzuna API integration** — live job search with graceful mock fallback
- **Python ML service** — local `sentence-transformers` fit scorer, localhost-only, no external calls
- **Persistent memory system** — cross-session JSON preference store with soft deletion
- **Comprehensive system documentation** — full README rewrite covering all four layers

---

## Session Transcript

### Turn 1 — Initial System Build

**User:**
> Can you set up the Career Claude project? I want an MCP server with job search and resume parsing.

**Agent actions:**
1. Scaffolded the full repository structure
2. Wrote `mcp-server/src/index.ts` — MCP server entry point with all 6 tool registrations
3. Wrote `mcp-server/src/job-search.ts` — Adzuna API client + mock fallback
4. Wrote `mcp-server/src/resume-parser.ts` — PDF/DOCX/text resume parser with structured output
5. Created `skills/` directory with four domain knowledge Markdown files
6. Created `project-instructions.md` system prompt
7. Committed: `"Add full Career Claude project structure"`

**Key implementation decisions made autonomously:**

The agent chose to make the Adzuna credentials optional with a mock fallback rather than fail loudly, specifically to allow the server to remain functional during development without requiring API setup first:

```typescript
// job-search.ts
export async function searchJobs(
  query: string,
  location?: string,
  maxResults: number = 10
): Promise<JobSearchResult> {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;

  if (!appId || !apiKey) {
    return mockJobSearch(query, location, maxResults);  // ← graceful fallback
  }

  return adzunaJobSearch(query, location, maxResults, appId, apiKey);
}
```

The resume parser was built to handle the edge case where "remote" in the location field needs to be appended to the query string rather than sent as a `where` parameter:

```typescript
// job-search.ts — Adzuna API doesn't have a native "remote" filter
if (location && location.toLowerCase() !== "remote") {
  params.set("where", location);
}
if (location?.toLowerCase() === "remote") {
  params.set("what", `${query} remote`);  // append to keyword search instead
}
```

---

### Turn 2 — Adding Persistent Memory

**User:**
> Add a feedback and preferences system so Career Claude remembers corrections across sessions.

**Agent actions:**
1. Designed a typed `FeedbackStore` schema with 9 preference categories
2. Wrote `mcp-server/src/feedback.ts` — full CRUD store backed by `~/.career-claude/feedback.json`
3. Registered 3 new tools in `index.ts`: `save_feedback`, `get_feedback`, `remove_feedback`
4. Wrote `CAREER_CLAUDE_FEEDBACK_PATH` override for testability
5. Committed: `"Add persistent feedback and preferences system"`

The agent made a deliberate choice to use soft deletion (`active: false`) rather than physically removing entries, preserving history:

```typescript
// feedback.ts
export async function removeFeedback(
  input: RemoveFeedbackInput
): Promise<MutationResult> {
  const store = await loadStore();
  const entry = store.preferences.find((p) => p.id === input.id && p.active);

  if (!entry) {
    return { success: false, message: `No active preference found with ID "${input.id}".` };
  }

  entry.active = false;  // ← soft delete, not splice
  await saveStore(store);
  return { success: true, message: `Preference removed.`, entry };
}
```

Duplicate detection prevents re-saving the same preference on repeated corrections:

```typescript
const duplicate = store.preferences.find(
  (p) =>
    p.active &&
    p.category === input.category &&
    p.preference.toLowerCase() === input.preference.toLowerCase()
);

if (duplicate) {
  return { success: true, message: "Preference already stored.", entry: duplicate };
}
```

---

### Turn 3 — Adding ML Fit Scoring

**User:**
> Can you add ML-powered fit scoring between a resume and a job description?

**Agent actions:**
1. Wrote `fit-scorer/server.py` — Python HTTP server using `sentence-transformers`
2. Wrote `mcp-server/src/fit-scorer.ts` — TypeScript HTTP client with 30s timeout and full fallback
3. Registered `score_resume_fit` tool in `index.ts`
4. Wrote `fit-scorer/requirements.txt`
5. Committed: `"Add ML-powered resume-JD fit scorer with graceful fallback"`

The agent designed the scoring formula to produce intuitive 0–100 output from raw cosine similarity, which typically spans a narrower range in practice:

```python
# fit-scorer/server.py
# Cosine similarity for unrelated docs is usually 0.1–0.3, perfect is ~1.0.
# Rescale so 0.2 → 0%, 0.9 → 100% for more intuitive output.
score = round(max(0, min(100, (similarity - 0.2) / 0.7 * 100)))
```

The Python service is intentionally bound to `127.0.0.1` only — not `0.0.0.0` — so it cannot be accidentally exposed on a network:

```python
httpd = HTTPServer(("127.0.0.1", PORT), Handler)  # localhost only
```

The TypeScript client distinguishes between connection failures (service not running) and other errors to give the user an actionable message:

```typescript
// fit-scorer.ts
const isConnectionError =
  err instanceof TypeError ||
  (err instanceof Error && (
    err.message.includes("ECONNREFUSED") ||
    err.message.includes("fetch failed") ||
    err.name === "AbortError"
  ));

return {
  available: false,
  reason: isConnectionError
    ? "The ML fit-scoring service is not running on this machine."
    : `Fit scorer error: ${err instanceof Error ? err.message : String(err)}`,
  suggestion:
    "To enable semantic fit scoring, start the Python service: " +
    "cd fit-scorer && pip install -r requirements.txt && python server.py",
};
```

The MCP tool's description — which Claude reads — explicitly instructs Claude to handle the `available: false` case gracefully:

```typescript
// index.ts — tool description Claude reads
"If the service is unavailable, the response will include an 'available: false' field — in that " +
"case, inform the user that the ML scoring service is not running and offer to do a manual analysis instead."
```

---

### Turn 4 — Comprehensive Documentation

**User:**
> Can you ensure there is comprehensive documentation in this report for the entire system.

**Agent actions:**
1. Read all source files: `job-search.ts`, `feedback.ts`, `fit-scorer.ts`, `resume-parser.ts`, `index.ts`, `server.py`, `package.json`, `sample-workflow.md`, existing `README.md`
2. Wrote a complete system documentation README (578 net new lines)
3. Committed and pushed: `"Replace README with comprehensive system documentation"`

The agent read every file before writing a single line, then produced documentation covering:

- Full ASCII architecture diagram across all four system layers
- Per-tool reference tables with parameter specs and full JSON response schemas
- ML scoring internals: the cosine rescaling formula, skill regex taxonomy, model caching behavior
- Preference system: storage schema, all 9 categories with examples, soft-delete behavior
- Data flow diagrams for three complete workflows (resume audit, fit scoring, preferences lifecycle)
- Graceful fallback behavior documented at every layer
- Environment variable reference with defaults
- Roadmap

---

## Final Architecture

```
User (Claude Desktop / claude.ai)
  │  natural language only
  ▼
Claude LLM
  │  reads: resume-best-practices.md, resume-customization.md,
  │         job-search-strategy.md, cover-letter.md
  │  governed by: project-instructions.md
  │  MCP protocol (stdio)
  ▼
MCP Server — TypeScript / Node.js
  ├── search_jobs      → Adzuna API  (mock fallback if no credentials)
  ├── parse_resume     → pdf-parse + mammoth
  ├── score_resume_fit → Python ML service (graceful fallback if not running)
  ├── save_feedback    → ~/.career-claude/feedback.json
  ├── get_feedback     → ~/.career-claude/feedback.json
  └── remove_feedback  → ~/.career-claude/feedback.json
  │  HTTP localhost:7821
  ▼
Python ML Service (optional)
  sentence-transformers all-MiniLM-L6-v2
  cosine similarity + regex skill extraction
  localhost only
```

---

## Commits

```
01eb88f  Replace README with comprehensive system documentation
4302af7  Add ML-powered resume-JD fit scorer with graceful fallback
796558d  Add persistent feedback and preferences system
7830416  Add full Career Claude project structure
c214806  Initial commit
```

---

## What Makes This Session Notable

**Every design decision has a clear rationale:**
The agent didn't just write working code — it made deliberate choices (soft delete vs. hard delete, localhost binding, cosine rescaling, mock fallback pattern) and each one reflects a specific product concern.

**The system degrades gracefully at every layer:**
No Adzuna credentials → mock data. Python not installed → `available: false` with setup instructions. Preference store empty → session proceeds normally. Each layer is independently optional.

**The MCP tool descriptions are first-class:**
The agent treated Claude's tool descriptions as part of the product. The `score_resume_fit` description explicitly programs Claude's behavior when the ML service is down, turning a potential error state into a graceful UX.

**Documentation reflects genuine understanding:**
The README was written after reading every source file. The cosine rescaling formula, the `127.0.0.1` binding decision, the soft-delete rationale — all of it appears in the docs because the agent understood why those choices were made, not just what the code does.

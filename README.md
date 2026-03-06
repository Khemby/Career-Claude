# Career Claude

A layered career coaching system built on Claude Projects. Combines a master system prompt, domain-specific skill files, and an optional MCP server for job search and resume parsing.

## What This Is

Career Claude gives you an AI career coach that can:

- **Audit your resume** against best practices and score it
- **Customize your resume** for a specific job description (keyword matching, bullet rewrites, summary tailoring)
- **Strategize your job search** (targeting, sourcing, networking, tracking)
- **Draft cover letters** tailored to a specific role and company
- **Parse resumes** from PDF or DOCX (via MCP server)
- **Search real job listings** via the Adzuna API (via MCP server)

## Repository Structure

```
career-claude/
├── README.md                        # This file
├── project-instructions.md          # Master system prompt — copy this into your Claude Project
├── skills/
│   ├── resume-best-practices.md     # Resume audit frameworks and scoring rubric
│   ├── resume-customization.md      # JD analysis, keyword matching, bullet rewriting
│   ├── job-search-strategy.md       # Sourcing, targeting, networking, tracking
│   └── cover-letter.md             # Cover letter structure, frameworks, examples
├── mcp-server/                      # Optional: MCP tool server
│   ├── src/
│   │   ├── index.ts                 # MCP server entry point
│   │   ├── job-search.ts            # Adzuna API integration
│   │   └── resume-parser.ts         # PDF/DOCX resume parser
│   ├── package.json
│   └── tsconfig.json
└── examples/
    └── sample-workflow.md           # Annotated example of a full Career Claude session
```

---

## Quick Start (Skills Only — No Coding Required)

This version runs entirely in a Claude Project with no server setup.

### Step 1: Create a Claude Project

1. Go to [claude.ai](https://claude.ai) and open **Projects**
2. Create a new project called **Career Claude**

### Step 2: Add the System Prompt

1. Open your project's **Instructions** (or **Project Instructions**) panel
2. Copy the entire contents of [`project-instructions.md`](./project-instructions.md)
3. Paste it into the instructions field

### Step 3: Upload the Skill Files

1. In your project, add the following files to the **Knowledge** section:
   - `skills/resume-best-practices.md`
   - `skills/resume-customization.md`
   - `skills/job-search-strategy.md`
   - `skills/cover-letter.md`

### Step 4: Start a Session

Open a new conversation in your Career Claude project and paste your resume. Career Claude will guide you through the rest.

See [`examples/sample-workflow.md`](./examples/sample-workflow.md) for a full annotated session.

---

## MCP Server Setup (Optional — Adds Job Search + Resume Parsing)

The MCP server adds two tool capabilities:
- `search_jobs` — Search real job listings via the Adzuna API
- `parse_resume` — Extract structured data from PDF or DOCX resumes

### Prerequisites

- Node.js 18+
- An [Adzuna API key](https://developer.adzuna.com/) (free tier available)

### Installation

```bash
cd mcp-server
npm install
npm run build
```

### Configuration

Set your Adzuna credentials as environment variables:

```bash
export ADZUNA_APP_ID=your_app_id
export ADZUNA_API_KEY=your_api_key
```

Without these, the server will return mock data so you can test the integration before getting credentials.

### Running the Server

```bash
npm start
```

### Connecting to Claude Desktop

Add the server to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "career-claude": {
      "command": "node",
      "args": ["/absolute/path/to/career-claude/mcp-server/dist/index.js"],
      "env": {
        "ADZUNA_APP_ID": "your_app_id",
        "ADZUNA_API_KEY": "your_api_key"
      }
    }
  }
}
```

Restart Claude Desktop. The `search_jobs` and `parse_resume` tools will appear automatically.

---

## Workflow Overview

```
User pastes/uploads resume
        ↓
Career Claude audits resume (resume-best-practices skill)
        ↓
User provides job description or target role
        ↓
Career Claude customizes resume for the JD (resume-customization skill)
        ↓
Career Claude drafts a tailored cover letter (cover-letter skill)
        ↓
(Optional) MCP tool searches for similar open roles
        ↓
User applies with a targeted resume + cover letter
```

---

## Skill File Summary

| File | Purpose |
|------|---------|
| `resume-best-practices.md` | Audit framework: format rules, bullet writing, ATS checklist, scoring rubric |
| `resume-customization.md` | JD deconstruction, gap analysis, keyword integration, bullet rewrites |
| `job-search-strategy.md` | Targeting, sourcing channels, role evaluation, networking, tracking |
| `cover-letter.md` | Four-paragraph structure, tone guide, templates, anti-patterns |

---

## Contributing

Pull requests welcome. If you have domain expertise in recruiting, hiring, or career coaching and want to improve the skill files, open an issue to discuss first.

---

## License

MIT

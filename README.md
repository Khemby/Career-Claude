# Career Claude

An AI career coach that actually knows what it's doing — built on Claude.

---

## Without Career Claude

- You paste your resume into ChatGPT and get back "use more action verbs"
- You keyword-stuff your resume because someone said "ATS optimization"
- You write a cover letter that starts with "I am writing to express my interest"
- You apply to 200 jobs with the same resume and wonder why nobody calls back
- You prep for interviews by Googling "common interview questions" the night before

## With Career Claude

- You get a scored audit with specific fixes: "Line 4: replace 'responsible for' with the measurable outcome"
- Your resume gets rebuilt around the actual job description — keywords mapped, bullets rewritten, gaps flagged
- Your cover letter tells a story that connects your experience to what the company needs
- You have a tiered job search strategy with target companies, sourcing channels, and a tracking system
- You walk into interviews with a story bank, STAR-formatted answers, and company-specific talking points

---

## Quick Start

### Browser (claude.ai) — no install

Open [`setup-assistant-prompt.md`](./setup-assistant-prompt.md), paste it into any Claude conversation, and follow the guided setup. Takes about 5 minutes.

### Desktop App (Claude Desktop)

```bash
git clone https://github.com/Khemby/Career-Claude.git
cd Career-Claude

# macOS / Linux
./setup.sh

# Windows (PowerShell)
.\setup.ps1
```

Restart Claude Desktop. Done.

### Terminal (Claude Code)

```bash
git clone https://github.com/Khemby/Career-Claude.git
cd Career-Claude
claude
```

Career Claude activates automatically.

---

## What You Can Do

### Career Clarity
Discover what type of work actually fits you — not what sounds impressive.
> "I've been in marketing for 6 years but I'm burned out. Help me figure out what I actually want."

### Career Decisions
Evaluate offers, lateral moves, and stay-or-leave choices with structured frameworks.
> "I have two offers — one is 20% more money but the other seems like a better team. Help me decide."

### Interview Prep
Build a story bank and practice with frameworks that match your interview format.
> "I have a behavioral interview at Stripe next week. Help me prepare."

### Personal Branding
Craft your professional narrative, optimize LinkedIn, and build your elevator pitch.
> "I'm switching from teaching to UX design. Help me tell that story."

### Resume Audit
Get a scored review with specific fixes — not generic advice.
> *Paste your resume.* Career Claude returns a structured audit: score, strengths, critical issues, ATS compatibility, and quick wins.

### Resume Customization
Tailor your resume to a specific job posting with keyword matching and bullet rewrites.
> *Paste your resume + a job description.* Career Claude maps requirements, identifies gaps, and rewrites your bullets to match.

### Cover Letters
Draft targeted cover letters that connect your story to the role.
> "Write a cover letter for this Senior PM role at Notion." *(paste the JD)*

### Job Search Strategy
Build a search plan with target companies, sourcing channels, and application tracking.
> "I want to find remote backend engineering roles at Series A-C startups. Help me build a plan."

---

## Power Features (Optional)

Career Claude works out of the box with just the skill files. For extra capabilities, you can enable:

- **Live Job Search** — search real listings via the Adzuna API
- **Resume Parsing** — extract structured data from PDF/DOCX resumes
- **ML Fit Scoring** — semantic scoring of how well your resume matches a job description

These require the MCP server (Node.js) and optionally the Python ML service. See [ARCHITECTURE.md](./ARCHITECTURE.md) for setup instructions.

---

## Memory

Career Claude remembers your preferences across sessions. Tell it your constraints once:

> "I'm only looking at remote roles, minimum $130k, no finance companies."

It saves that and applies it to every future conversation — job suggestions, resume tailoring, everything.

---

## Roadmap

- Auto-install script for non-technical users (curl | bash)
- Improved PDF/DOCX parsing with spaCy
- Interview question generation from resume + JD
- Application tracker with follow-up reminders

---

## Architecture

For technical details — system architecture, MCP server API reference, ML scorer internals, data flow diagrams, and environment variables — see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## License

MIT

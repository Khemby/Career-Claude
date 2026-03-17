# Career Claude — Architecture & Technical Reference

This document covers the full technical design of Career Claude: system architecture, skill file details, preference system, and data flows. For user-facing documentation, see [README.md](./README.md).

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Repository Structure](#repository-structure)
4. [Skill Files](#skill-files)
5. [Preference System](#preference-system)
6. [System Prompt](#system-prompt)
7. [Data Flow Diagrams](#data-flow-diagrams)

---

## System Overview

Career Claude is an AI career coach that operates through natural conversation. A user interacts entirely through Claude Code or claude.ai — they paste a resume, describe a job, or ask for help, and Claude automatically applies the appropriate skill files and stored preferences.

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
| Resume-JD fit analysis | Claude analyzes resume against job description using skill file frameworks |
| Persistent preferences | `preferences.md` — local file read/written by Claude (Claude Code only) |

The system is designed to be **zero-dependency**. There is no server, no build step, and no external service. Claude reads skill files and preferences directly. Clone the repo and start chatting.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   User (Claude Code / claude.ai)         │
│              Natural language conversation only           │
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
│  Reads/writes: preferences.md (local, gitignored)        │
│  Governed by: CLAUDE.md / project-instructions.md        │
└─────────────────────────────────────────────────────────┘
```

No external services. No build steps. No dependencies.

---

## Repository Structure

```
career-claude/
├── README.md                        # User-facing documentation
├── ARCHITECTURE.md                  # This file — technical reference
├── CLAUDE.md                        # System prompt for Claude Code (auto-loaded)
├── project-instructions.md          # System prompt for claude.ai Projects
├── setup-assistant-prompt.md        # Guided setup prompt — paste into any Claude conversation
├── preferences.md                   # User preferences (gitignored, created on first use)
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
└── examples/
    ├── sample-workflow.md           # Annotated full session walkthrough
    └── user-preferences-example.json
```

---

## Skill Files

Skill files are Markdown documents that Claude reads and applies based on the task at hand. They are plain text — no code or tooling required.

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

## Preference System

Career Claude persists user preferences across sessions using a local Markdown file — zero dependencies, no server required.

### Storage

Preferences are stored in `preferences.md` at the project root. This file is gitignored so personal data (salary expectations, company exclusions, etc.) is never committed.

**Format:**

```markdown
# Career Claude — Preferences
<!-- Auto-managed by Career Claude. You can also edit this by hand. -->
<!-- This file is gitignored — your data stays local. -->

## role_type
- Only software engineering roles — Backend, Full-Stack (stated during intake)

## location
- Remote only — will not relocate (corrected a suggestion for in-office role)

## salary
- Minimum $130k base (stated compensation floor)
```

### Session Behavior

At the start of every session, Claude reads `preferences.md` before responding to any substantive request. Stored preferences are silently applied — Claude does not list them back unless the user asks.

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

### How It Works (Claude Code)

- **Save:** Claude uses the Edit tool to add a bullet under the appropriate section
- **Read:** Claude uses the Read tool at session start
- **Remove:** Claude uses the Edit tool to delete the relevant line
- **Create:** If the file doesn't exist, Claude creates it with the template format on first save

### How It Works (claude.ai)

claude.ai does not have file system access, so preferences are conversational. Users state their preferences at the start of each session. The system prompt instructs Claude to ask about standing preferences during onboarding.

---

## System Prompt

Two system prompt files exist to support both platforms:

| File | Platform | How it's loaded |
|---|---|---|
| `CLAUDE.md` | Claude Code | Auto-loaded when Claude Code opens the project directory |
| `project-instructions.md` | claude.ai | Pasted into a Claude Project's Instructions panel |

Both files define:

- **Persona** — Career Claude's identity, expertise, and tone: direct, encouraging, specific, and actionable
- **Core capabilities** — What tasks it handles and which skill file to load for each
- **Preference rules** — When to read, save, and remove preferences, and what triggers each category
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
Claude reads resume-best-practices.md from skill files
  ↓
Claude analyzes resume text for:
  • Structure and formatting
  • ATS compatibility
  • Impact language and quantification
  • Common mistakes
  ↓
Claude delivers structured audit (score, strengths, critical issues, quick wins)
```

### Resume Customization Flow

```
User: "Tailor my resume for this job posting [paste JD]"
  ↓
Claude reads resume-customization.md from skill files
  ↓
Claude analyzes JD for:
  • Required vs. preferred qualifications
  • Key keywords and phrases
  • Company signals and culture
  ↓
Claude compares resume against JD:
  • Identifies keyword gaps
  • Maps existing experience to requirements
  • Flags missing qualifications
  ↓
Claude delivers customization report:
  • Keyword gaps with placement suggestions
  • Before/after bullet rewrites
  • Rewritten summary targeting the role
```

### Preferences Flow

```
Session start:
  Claude reads preferences.md
  Silently applies all stored preferences to every response

During session:
  User: "I won't consider anything under $130k"
  Claude edits preferences.md → adds bullet under ## salary
  Claude: "Got it — I've saved that preference. I'll apply it going forward."

Future sessions:
  Claude reads preferences.md → finds salary preference
  Claude filters all job suggestions and salary mentions accordingly
```

---

## License

MIT

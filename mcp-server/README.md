# Career Claude MCP Server

MCP (Model Context Protocol) server that extends Career Claude with five tools:

- **`search_jobs`** — Search real job listings using the Adzuna API
- **`parse_resume`** — Extract structured data from plain text, PDF, or DOCX resumes
- **`save_feedback`** — Persist a user preference or correction across sessions
- **`get_feedback`** — Retrieve stored preferences at session start
- **`remove_feedback`** — Delete a preference by ID

## Tools

### `search_jobs`

Searches for job listings matching a query and optional location.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | yes | Job title or keywords (e.g. `"Senior Product Manager B2B SaaS"`) |
| `location` | string | no | City, state, or `"remote"` |
| `max_results` | number | no | Max results to return (default: 10, max: 25) |

**Returns:** List of job listings with title, company, location, description snippet, URL, posting date, and salary range.

---

### `parse_resume`

Extracts structured data from a resume.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | yes | Resume as plain text, or a file path to PDF/DOCX |
| `format` | string | no | `"text"` (default), `"pdf"`, or `"docx"` |

**Returns:** Structured object with: contact info, summary, work experience (with bullets), education, skills, certifications, and parse warnings.

---

### `save_feedback`

Stores a user preference or correction so Career Claude remembers it in future sessions.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | yes | One of: `role_type`, `industry`, `location`, `salary`, `company_size`, `work_style`, `resume_style`, `search_filter`, `general` |
| `preference` | string | yes | The preference in plain English |
| `context` | string | no | What triggered this feedback (e.g. "User corrected suggestion of art director role") |

**Returns:** The saved entry with its ID, or a message indicating the preference already exists.

**Example triggers:**
- User says "I'm only looking for engineering roles, not design"
- User corrects a job search result that returned an irrelevant role type
- User states a salary floor, location constraint, or company-size preference

---

### `get_feedback`

Retrieves stored preferences. Called at session start before responding to any substantive request.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | no | Filter by category. Omit to retrieve all active preferences. |

**Returns:** List of active preference entries sorted by most recent first, plus a total count.

---

### `remove_feedback`

Soft-deletes a stored preference by ID. The entry is marked `active: false` and no longer returned by `get_feedback`.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | yes | The UUID of the preference to remove (from `get_feedback` results) |

**Returns:** Success/failure message and the removed entry.

---

## Feedback Storage

Preferences are stored at `~/.career-claude/feedback.json` by default. Override the path with the `CAREER_CLAUDE_FEEDBACK_PATH` environment variable.

See [`../examples/user-preferences-example.json`](../examples/user-preferences-example.json) for an annotated example of what this file looks like.

## Setup

```bash
npm install
npm run build
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ADZUNA_APP_ID` | Your Adzuna application ID ([get one free](https://developer.adzuna.com/)) |
| `ADZUNA_API_KEY` | Your Adzuna API key |
| `CAREER_CLAUDE_FEEDBACK_PATH` | Override path for the feedback JSON file (default: `~/.career-claude/feedback.json`) |

Without Adzuna credentials, `search_jobs` returns mock data. The feedback tools work with no credentials — they only need filesystem access.

## Running

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

## Claude Desktop Integration

```json
{
  "mcpServers": {
    "career-claude": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "ADZUNA_APP_ID": "your_app_id",
        "ADZUNA_API_KEY": "your_api_key"
      }
    }
  }
}
```

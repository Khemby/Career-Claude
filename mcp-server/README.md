# Career Claude MCP Server

MCP (Model Context Protocol) server that extends Career Claude with five tools:

- **`parse_resume`** — Extract structured data from plain text, PDF, or DOCX resumes
- **`score_resume_fit`** — Semantically score how well a resume matches a job description (requires Python ML service)
- **`save_feedback`** — Persist a user preference or correction across sessions
- **`get_feedback`** — Retrieve stored preferences at session start
- **`remove_feedback`** — Delete a preference by ID

## Tools

### `parse_resume`

Extracts structured data from a resume.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | yes | Resume as plain text, or a file path to PDF/DOCX |
| `format` | string | no | `"text"` (default), `"pdf"`, or `"docx"` |

**Returns:** Structured object with: contact info, summary, work experience (with bullets), education, skills, certifications, and parse warnings.

---

### `score_resume_fit`

Semantically scores how well a resume matches a job description. Requires the Python ML service (`fit-scorer/server.py`) to be running.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resume_text` | string | yes | Full plain-text content of the resume |
| `jd_text` | string | yes | Full plain-text content of the job description |

**Returns:** Score (0-100), raw cosine similarity, matched skills, missing skills, and skill counts. If the Python service is not running, returns `{ available: false }` with setup instructions — the MCP server itself does not crash.

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
| `CAREER_CLAUDE_FEEDBACK_PATH` | Override path for the feedback JSON file (default: `~/.career-claude/feedback.json`) |

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
      "args": ["/path/to/mcp-server/dist/index.js"]
    }
  }
}
```

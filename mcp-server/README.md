# Career Claude MCP Server

MCP (Model Context Protocol) server that extends Career Claude with two tools:

- **`search_jobs`** — Search real job listings using the Adzuna API
- **`parse_resume`** — Extract structured data from plain text, PDF, or DOCX resumes

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

Without credentials, `search_jobs` returns mock data.

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

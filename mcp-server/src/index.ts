import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { searchJobs } from "./job-search.js";

// Load .env file from mcp-server/ directory
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = resolve(__dirname, "..", ".env");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {
  // .env file not found — that's fine, fall back to environment variables
}
import { parseResume } from "./resume-parser.js";
import { scoreFit } from "./fit-scorer.js";
import {
  saveFeedback,
  getFeedback,
  removeFeedback,
  type FeedbackCategory,
} from "./feedback.js";

const server = new Server(
  { name: "career-claude-mcp", version: "0.2.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // -----------------------------------------------------------------------
    // Job search
    // -----------------------------------------------------------------------
    {
      name: "search_jobs",
      description:
        "Search for job listings matching a role title and optional location. Returns a list of relevant open positions with titles, companies, locations, and links.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Job title or keywords to search for (e.g. 'Senior Product Manager B2B SaaS')",
          },
          location: {
            type: "string",
            description:
              "City, state, or 'remote'. Leave empty for remote-friendly search.",
          },
          max_results: {
            type: "number",
            description: "Maximum number of results to return (default: 10, max: 25)",
          },
        },
        required: ["query"],
      },
    },

    // -----------------------------------------------------------------------
    // Resume parser
    // -----------------------------------------------------------------------
    {
      name: "parse_resume",
      description:
        "Extract structured data from a resume provided as plain text, PDF path, or DOCX path. Returns sections: contact info, summary, work experience, education, and skills.",
      inputSchema: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description:
              "Resume content as plain text, or a file path to a PDF or DOCX file",
          },
          format: {
            type: "string",
            enum: ["text", "pdf", "docx"],
            description: "Format of the provided content (default: text)",
          },
        },
        required: ["content"],
      },
    },

    // -----------------------------------------------------------------------
    // Resume-JD fit scorer (requires local Python ML service)
    // -----------------------------------------------------------------------
    {
      name: "score_resume_fit",
      description:
        "Semantically scores how well a candidate's resume matches a job description using ML embeddings. " +
        "Returns a 0–100 fit score, matched skills found in both documents, and skills listed in the job " +
        "description that are absent from the resume. Call this whenever a user wants to know how well " +
        "their resume matches a job posting, asks if they are a good fit, or wants to identify gaps. " +
        "If the service is unavailable, the response will include an 'available: false' field — in that " +
        "case, inform the user that the ML scoring service is not running and offer to do a manual analysis instead.",
      inputSchema: {
        type: "object",
        properties: {
          resume_text: {
            type: "string",
            description: "The full plain-text content of the resume",
          },
          jd_text: {
            type: "string",
            description: "The full plain-text content of the job description",
          },
        },
        required: ["resume_text", "jd_text"],
      },
    },

    // -----------------------------------------------------------------------
    // Feedback: save
    // -----------------------------------------------------------------------
    {
      name: "save_feedback",
      description:
        "Persist a user preference or correction so it is remembered in future sessions. Call this whenever the user corrects a suggestion, states a preference, or sets a constraint (e.g. 'only software engineering roles', 'no relocations', 'minimum $150k').",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "role_type",
              "industry",
              "location",
              "salary",
              "company_size",
              "work_style",
              "resume_style",
              "search_filter",
              "general",
            ],
            description:
              "Category of the preference. Use 'role_type' for job function/title constraints, 'industry' for sector preferences, 'location' for geography/remote preferences, 'salary' for compensation constraints, 'company_size' for startup vs. enterprise preference, 'work_style' for remote/hybrid/in-office, 'resume_style' for how the user wants their resume written, 'search_filter' for explicit include/exclude terms, 'general' for anything else.",
          },
          preference: {
            type: "string",
            description:
              "The preference in plain English (e.g. 'Only interested in software engineering roles — not design or art')",
          },
          context: {
            type: "string",
            description:
              "Optional: what triggered this feedback (e.g. 'User corrected a suggestion for an art director role'). Helps explain why the preference exists.",
          },
        },
        required: ["category", "preference"],
      },
    },

    // -----------------------------------------------------------------------
    // Feedback: get
    // -----------------------------------------------------------------------
    {
      name: "get_feedback",
      description:
        "Retrieve stored user preferences from previous sessions. Call this at the start of each new session or before making job search or recommendation decisions. Returns all active preferences, or only those in the specified category.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "role_type",
              "industry",
              "location",
              "salary",
              "company_size",
              "work_style",
              "resume_style",
              "search_filter",
              "general",
            ],
            description:
              "Filter by category. Omit to retrieve all stored preferences.",
          },
        },
        required: [],
      },
    },

    // -----------------------------------------------------------------------
    // Feedback: remove
    // -----------------------------------------------------------------------
    {
      name: "remove_feedback",
      description:
        "Remove a stored preference by its ID. Use when the user says a preference is no longer relevant, has changed, or was stored incorrectly. Always confirm with the user before removing.",
      inputSchema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The ID of the preference to remove (from get_feedback results)",
          },
        },
        required: ["id"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "search_jobs") {
    const { query, location, max_results } = args as {
      query: string;
      location?: string;
      max_results?: number;
    };
    const results = await searchJobs(query, location, max_results ?? 10);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }

  if (name === "parse_resume") {
    const { content, format } = args as {
      content: string;
      format?: "text" | "pdf" | "docx";
    };
    const parsed = await parseResume(content, format ?? "text");
    return {
      content: [{ type: "text", text: JSON.stringify(parsed, null, 2) }],
    };
  }

  if (name === "score_resume_fit") {
    const { resume_text, jd_text } = args as {
      resume_text: string;
      jd_text: string;
    };
    const result = await scoreFit(resume_text, jd_text);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }

  if (name === "save_feedback") {
    const { category, preference, context } = args as {
      category: FeedbackCategory;
      preference: string;
      context?: string;
    };
    const result = await saveFeedback({ category, preference, context });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }

  if (name === "get_feedback") {
    const { category } = (args ?? {}) as { category?: FeedbackCategory };
    const result = await getFeedback({ category });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }

  if (name === "remove_feedback") {
    const { id } = args as { id: string };
    const result = await removeFeedback({ id });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Career Claude MCP server running on stdio");
}

main().catch(console.error);

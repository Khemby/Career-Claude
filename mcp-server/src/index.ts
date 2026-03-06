import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { searchJobs } from "./job-search.js";
import { parseResume } from "./resume-parser.js";

const server = new Server(
  { name: "career-claude-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_jobs",
      description:
        "Search for job listings matching a role title and optional location. Returns a list of relevant open positions with titles, companies, locations, and links.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Job title or keywords to search for (e.g. 'Senior Product Manager B2B SaaS')",
          },
          location: {
            type: "string",
            description: "City, state, or 'remote'. Leave empty for remote-friendly search.",
          },
          max_results: {
            type: "number",
            description: "Maximum number of results to return (default: 10, max: 25)",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "parse_resume",
      description:
        "Extract structured data from a resume provided as plain text, PDF path, or DOCX path. Returns sections: contact info, summary, work experience, education, and skills.",
      inputSchema: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "Resume content as plain text, or a file path to a PDF or DOCX file",
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

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Career Claude MCP server running on stdio");
}

main().catch(console.error);

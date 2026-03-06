/**
 * Job Search Tool
 *
 * Integrates with the Adzuna API to search for real job listings.
 * Sign up for a free API key at: https://developer.adzuna.com/
 *
 * Environment variables required:
 *   ADZUNA_APP_ID  — Your Adzuna application ID
 *   ADZUNA_API_KEY — Your Adzuna API key
 *
 * Falls back to a mock response when credentials are not set,
 * so the server remains functional during development.
 */

export interface JobListing {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  posted_date: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
}

export interface JobSearchResult {
  query: string;
  location: string | undefined;
  total_found: number;
  listings: JobListing[];
}

export async function searchJobs(
  query: string,
  location?: string,
  maxResults: number = 10
): Promise<JobSearchResult> {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;

  if (!appId || !apiKey) {
    return mockJobSearch(query, location, maxResults);
  }

  return adzunaJobSearch(query, location, maxResults, appId, apiKey);
}

async function adzunaJobSearch(
  query: string,
  location: string | undefined,
  maxResults: number,
  appId: string,
  apiKey: string
): Promise<JobSearchResult> {
  const country = "us";
  const baseUrl = `https://api.adzuna.com/v1/api/jobs/${country}/search/1`;

  const params = new URLSearchParams({
    app_id: appId,
    app_key: apiKey,
    results_per_page: String(Math.min(maxResults, 25)),
    what: query,
    content_type: "application/json",
  });

  if (location && location.toLowerCase() !== "remote") {
    params.set("where", location);
  }
  if (location?.toLowerCase() === "remote") {
    params.set("what", `${query} remote`);
  }

  const response = await fetch(`${baseUrl}?${params}`);
  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    count: number;
    results: Array<{
      title: string;
      company: { display_name: string };
      location: { display_name: string };
      description: string;
      redirect_url: string;
      created: string;
      salary_min?: number;
      salary_max?: number;
    }>;
  };

  const listings: JobListing[] = data.results.map((r) => ({
    title: r.title,
    company: r.company.display_name,
    location: r.location.display_name,
    description: r.description.slice(0, 300) + (r.description.length > 300 ? "..." : ""),
    url: r.redirect_url,
    posted_date: r.created,
    salary_min: r.salary_min,
    salary_max: r.salary_max,
    salary_currency: "USD",
  }));

  return { query, location, total_found: data.count, listings };
}

function mockJobSearch(
  query: string,
  location: string | undefined,
  maxResults: number
): JobSearchResult {
  const mockListings: JobListing[] = [
    {
      title: `${query} — Example Role 1`,
      company: "Acme Corp",
      location: location ?? "Remote",
      description:
        "This is a placeholder result. Set ADZUNA_APP_ID and ADZUNA_API_KEY environment variables to fetch real job listings.",
      url: "https://developer.adzuna.com/",
      posted_date: new Date().toISOString(),
      salary_min: 100000,
      salary_max: 140000,
      salary_currency: "USD",
    },
    {
      title: `Senior ${query} — Example Role 2`,
      company: "Beta Startup",
      location: location ?? "Remote",
      description:
        "Another placeholder result. Connect the Adzuna API to see real listings here.",
      url: "https://developer.adzuna.com/",
      posted_date: new Date().toISOString(),
      salary_min: 130000,
      salary_max: 170000,
      salary_currency: "USD",
    },
  ].slice(0, maxResults);

  return {
    query,
    location,
    total_found: mockListings.length,
    listings: mockListings,
  };
}

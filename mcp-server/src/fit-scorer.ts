/**
 * Fit Scorer Client
 *
 * Calls the local Python fit-scorer service (localhost:7821).
 * If the service is not running, returns a structured "unavailable" response
 * so Claude can inform the user gracefully without breaking other tools.
 */

const FIT_SCORER_URL = "http://127.0.0.1:7821";
const TIMEOUT_MS = 30_000; // model inference can take a few seconds on first run

export interface FitScoreResult {
  available: true;
  score: number;
  raw_similarity: number;
  matched_skills: string[];
  missing_skills: string[];
  resume_skill_count: number;
  jd_skill_count: number;
}

export interface FitScoreUnavailable {
  available: false;
  reason: string;
  suggestion: string;
}

export type FitScoreResponse = FitScoreResult | FitScoreUnavailable;

export async function scoreFit(
  resumeText: string,
  jdText: string
): Promise<FitScoreResponse> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${FIT_SCORER_URL}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_text: resumeText, jd_text: jdText }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Fit scorer returned ${response.status}: ${text}`);
    }

    const data = await response.json() as Record<string, unknown>;

    if ("error" in data) {
      throw new Error(String(data.error));
    }

    return {
      available: true,
      score: data.score as number,
      raw_similarity: data.raw_similarity as number,
      matched_skills: data.matched_skills as string[],
      missing_skills: data.missing_skills as string[],
      resume_skill_count: data.resume_skill_count as number,
      jd_skill_count: data.jd_skill_count as number,
    };
  } catch (err) {
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
  }
}

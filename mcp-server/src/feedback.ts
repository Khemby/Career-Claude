/**
 * Feedback & Preferences Store
 *
 * Persists user corrections and preferences across Career Claude sessions.
 * Stored as a JSON file at CAREER_CLAUDE_FEEDBACK_PATH or ~/.career-claude/feedback.json.
 *
 * Tools exposed:
 *   save_feedback   — Add or update a preference
 *   get_feedback    — Retrieve preferences (all or by category)
 *   remove_feedback — Delete a preference by ID
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { homedir } from "os";
import { join, dirname } from "path";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FeedbackCategory =
  | "role_type"       // What kind of roles they want (e.g. "only software engineering")
  | "industry"        // Industries to include or exclude
  | "location"        // Remote, city, relocation preferences
  | "salary"          // Compensation floor, equity expectations
  | "company_size"    // Startup vs enterprise preference
  | "work_style"      // Remote / hybrid / in-office
  | "resume_style"    // Tone, format, length preferences for their resume
  | "search_filter"   // Keywords or companies to always include or exclude
  | "general";        // Anything that doesn't fit a specific category

export interface FeedbackEntry {
  id: string;
  category: FeedbackCategory;
  preference: string;          // The stored preference in plain English
  context: string | null;      // What triggered this feedback (optional)
  timestamp: string;           // ISO 8601
  active: boolean;             // false = soft-deleted
}

export interface FeedbackStore {
  version: "1.0";
  last_updated: string;
  preferences: FeedbackEntry[];
}

export interface SaveFeedbackInput {
  category: FeedbackCategory;
  preference: string;
  context?: string;
}

export interface GetFeedbackInput {
  category?: FeedbackCategory;
}

export interface RemoveFeedbackInput {
  id: string;
}

export interface GetFeedbackResult {
  preferences: FeedbackEntry[];
  total: number;
}

export interface MutationResult {
  success: boolean;
  message: string;
  entry?: FeedbackEntry;
}

// ---------------------------------------------------------------------------
// Storage path
// ---------------------------------------------------------------------------

function getFeedbackPath(): string {
  return (
    process.env.CAREER_CLAUDE_FEEDBACK_PATH ??
    join(homedir(), ".career-claude", "feedback.json")
  );
}

// ---------------------------------------------------------------------------
// Read / write helpers
// ---------------------------------------------------------------------------

async function loadStore(): Promise<FeedbackStore> {
  const path = getFeedbackPath();

  if (!existsSync(path)) {
    return {
      version: "1.0",
      last_updated: new Date().toISOString(),
      preferences: [],
    };
  }

  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as FeedbackStore;
}

async function saveStore(store: FeedbackStore): Promise<void> {
  const path = getFeedbackPath();
  const dir = dirname(path);

  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  store.last_updated = new Date().toISOString();
  await writeFile(path, JSON.stringify(store, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Save a new user preference or correction.
 *
 * If an active preference with the same category and exact preference text
 * already exists, the call is a no-op and returns the existing entry.
 */
export async function saveFeedback(
  input: SaveFeedbackInput
): Promise<MutationResult> {
  const store = await loadStore();

  const duplicate = store.preferences.find(
    (p) =>
      p.active &&
      p.category === input.category &&
      p.preference.toLowerCase() === input.preference.toLowerCase()
  );

  if (duplicate) {
    return {
      success: true,
      message: "Preference already stored.",
      entry: duplicate,
    };
  }

  const entry: FeedbackEntry = {
    id: randomUUID(),
    category: input.category,
    preference: input.preference,
    context: input.context ?? null,
    timestamp: new Date().toISOString(),
    active: true,
  };

  store.preferences.push(entry);
  await saveStore(store);

  return {
    success: true,
    message: `Preference saved under "${input.category}".`,
    entry,
  };
}

/**
 * Retrieve active preferences.
 * Pass a category to filter; omit for all preferences.
 */
export async function getFeedback(
  input: GetFeedbackInput = {}
): Promise<GetFeedbackResult> {
  const store = await loadStore();

  const active = store.preferences.filter((p) => p.active);
  const filtered = input.category
    ? active.filter((p) => p.category === input.category)
    : active;

  // Sort by most recent first
  const sorted = filtered.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return { preferences: sorted, total: sorted.length };
}

/**
 * Remove (soft-delete) a preference by ID.
 */
export async function removeFeedback(
  input: RemoveFeedbackInput
): Promise<MutationResult> {
  const store = await loadStore();

  const entry = store.preferences.find((p) => p.id === input.id && p.active);

  if (!entry) {
    return {
      success: false,
      message: `No active preference found with ID "${input.id}".`,
    };
  }

  entry.active = false;
  await saveStore(store);

  return {
    success: true,
    message: `Preference removed.`,
    entry,
  };
}

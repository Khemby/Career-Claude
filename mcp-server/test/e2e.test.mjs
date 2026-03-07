/**
 * End-to-end tests for Career Claude MCP server tools.
 *
 * Uses the Node.js built-in test runner (node:test) and assert (node:assert/strict).
 * Zero additional dependencies required.
 *
 * Run:  node --test mcp-server/test/e2e.test.mjs
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

import { parseResume } from "../dist/resume-parser.js";
import { searchJobs } from "../dist/job-search.js";
import { scoreFit } from "../dist/fit-scorer.js";
import { saveFeedback, getFeedback, removeFeedback } from "../dist/feedback.js";

// ─────────────────────────────────────────────────────────────────────────────
// 1. parse_resume
// ─────────────────────────────────────────────────────────────────────────────

const FULL_RESUME = `
John Doe
Austin, TX
john.doe@example.com | (512) 555-1234
linkedin.com/in/johndoe | github.com/johndoe

Summary
Results-driven software engineer with 8+ years building scalable backend systems
and cloud-native applications. Passionate about developer tooling and automation.

Experience
Senior Software Engineer
Acme Corp | Jan 2020 - Present
- Designed and deployed microservices architecture serving 10M daily requests
- Led migration from monolith to event-driven system reducing latency by 40%
- Mentored 5 junior engineers through structured onboarding program

Software Engineer
Beta Startup | Jun 2016 - Dec 2019
- Built real-time data pipeline processing 500K events per second
- Implemented CI/CD workflows cutting deploy time from 2 hours to 15 minutes

Education
B.S. Computer Science
University of Texas at Austin, 2016
GPA: 3.8

Skills
Python, JavaScript, TypeScript, Go, AWS, Docker, Kubernetes, Terraform, PostgreSQL, Redis

Certifications
AWS Certified Solutions Architect - Professional
Certified Kubernetes Administrator (CKA)
`.trim();

describe("parse_resume", () => {
  it("extracts all sections from a full resume", async () => {
    const result = await parseResume(FULL_RESUME, "text");

    // Contact fields
    assert.equal(result.contact.name, "John Doe");
    assert.equal(result.contact.email, "john.doe@example.com");
    assert.equal(result.contact.phone, "(512) 555-1234");
    assert.equal(result.contact.location, "Austin, TX");
    assert.ok(
      result.contact.linkedin && result.contact.linkedin.includes("linkedin.com/in/johndoe"),
      "LinkedIn URL extracted"
    );
    assert.ok(
      result.contact.github && result.contact.github.includes("github.com/johndoe"),
      "GitHub URL extracted"
    );

    // Summary
    assert.ok(result.summary !== null, "summary should not be null");
    assert.ok(result.summary.length > 0, "summary should be non-empty");

    // Experience — exactly 2 roles with correct grouping
    assert.equal(result.experience.length, 2, `expected 2 roles, got ${result.experience.length}`);
    assert.ok(result.experience[0].title.includes("Senior Software Engineer"), `role 1 title: ${result.experience[0].title}`);
    assert.ok(result.experience[0].company.includes("Acme"), `role 1 company: ${result.experience[0].company}`);
    assert.ok(result.experience[0].bullets.length >= 2, `role 1 bullets: ${result.experience[0].bullets.length}`);
    assert.ok(result.experience[1].title.includes("Software Engineer"), `role 2 title: ${result.experience[1].title}`);
    assert.ok(result.experience[1].company.includes("Beta"), `role 2 company: ${result.experience[1].company}`);
    assert.ok(result.experience[1].bullets.length >= 1, `role 2 bullets: ${result.experience[1].bullets.length}`);
    const totalBullets = result.experience.reduce((sum, role) => sum + role.bullets.length, 0);
    assert.ok(totalBullets >= 4, `expected >= 4 total bullets, got ${totalBullets}`);

    // Education
    assert.ok(result.education.length >= 1, "at least 1 education entry");
    const edu = result.education[0];
    assert.ok(edu.degree && edu.degree.length > 0, "degree extracted");
    assert.ok(edu.year !== null, "year extracted");
    assert.ok(edu.gpa !== null, "GPA extracted");

    // Skills
    assert.ok(result.skills.length >= 5, `expected >= 5 skills, got ${result.skills.length}`);
    const skillsLower = result.skills.map((s) => s.toLowerCase());
    assert.ok(skillsLower.includes("python"), "Python in skills");
    assert.ok(skillsLower.includes("aws"), "AWS in skills");

    // Certifications
    assert.ok(result.certifications.length >= 1, "at least 1 certification");
    assert.ok(
      result.certifications.some((c) => c.toLowerCase().includes("aws")),
      "AWS certification present"
    );

    // Raw text
    assert.ok(result.raw_text.length > 0, "raw_text present");
  });

  it("handles empty string input without crashing", async () => {
    const result = await parseResume("", "text");
    assert.ok(Array.isArray(result.experience), "experience is an array");
    assert.ok(Array.isArray(result.skills), "skills is an array");
    assert.ok(Array.isArray(result.education), "education is an array");
    assert.ok(Array.isArray(result.certifications), "certifications is an array");
  });

  it("extracts what it can from minimal input", async () => {
    const minimal = `
Jane Smith
jane@test.com

Skills
React, Node.js, SQL
`.trim();

    const result = await parseResume(minimal, "text");
    assert.equal(result.contact.name, "Jane Smith");
    assert.equal(result.contact.email, "jane@test.com");
    assert.ok(result.skills.length >= 2, "some skills extracted from minimal input");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. search_jobs (mock mode — no API keys)
// ─────────────────────────────────────────────────────────────────────────────

describe("search_jobs (mock mode)", () => {
  before(() => {
    // Ensure API keys are NOT set so mock path is used
    delete process.env.ADZUNA_APP_ID;
    delete process.env.ADZUNA_API_KEY;
  });

  it("returns valid structure with query echoed back", async () => {
    const result = await searchJobs("Software Engineer", "Austin, TX", 5);

    assert.equal(result.query, "Software Engineer");
    assert.equal(result.location, "Austin, TX");
    assert.ok(Array.isArray(result.listings), "listings is an array");
    assert.ok(result.listings.length > 0, "at least one listing");

    const listing = result.listings[0];
    assert.ok(typeof listing.title === "string" && listing.title.length > 0, "listing has title");
    assert.ok(typeof listing.company === "string" && listing.company.length > 0, "listing has company");
    assert.ok(typeof listing.url === "string" && listing.url.length > 0, "listing has url");
  });

  it("includes salary data in mock listings", async () => {
    const result = await searchJobs("Data Scientist", "Remote", 5);
    const listing = result.listings[0];
    assert.ok(typeof listing.salary_min === "number", "salary_min is a number");
    assert.ok(typeof listing.salary_max === "number", "salary_max is a number");
    assert.ok(listing.salary_max >= listing.salary_min, "salary_max >= salary_min");
  });

  it("respects max_results limit", async () => {
    const result = await searchJobs("Engineer", "NYC", 1);
    assert.ok(result.listings.length <= 1, `expected <= 1 listing, got ${result.listings.length}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. score_resume_fit (fallback — Python service NOT running)
// ─────────────────────────────────────────────────────────────────────────────

describe("score_resume_fit (fallback behavior)", () => {
  it("returns a valid result object with available flag", async () => {
    const result = await scoreFit(
      "Python developer with 5 years experience",
      "Looking for a senior Python engineer with AWS experience"
    );

    // The service may or may not be running on the test machine.
    // When unavailable: { available: false, reason: string, suggestion: string }
    // When available:   { available: true, score: number, ... }
    assert.ok(typeof result.available === "boolean", "available is a boolean");

    if (result.available === false) {
      assert.ok(typeof result.reason === "string" && result.reason.length > 0, "reason is a non-empty string");
      assert.ok(typeof result.suggestion === "string" && result.suggestion.length > 0, "suggestion is a non-empty string");
    } else {
      assert.ok(typeof result.score === "number", "score is a number when available");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. feedback CRUD
// ─────────────────────────────────────────────────────────────────────────────

describe("feedback CRUD", () => {
  const tmpFeedbackPath = join(tmpdir(), `career-claude-test-feedback-${randomUUID()}.json`);
  let savedId;

  before(() => {
    process.env.CAREER_CLAUDE_FEEDBACK_PATH = tmpFeedbackPath;
  });

  after(async () => {
    delete process.env.CAREER_CLAUDE_FEEDBACK_PATH;
    try {
      await unlink(tmpFeedbackPath);
    } catch {
      // file may not exist — that is fine
    }
  });

  it("saves a preference and returns entry with ID", async () => {
    const res = await saveFeedback({
      category: "resume_style",
      preference: "Use bullet points instead of paragraphs",
      context: "When formatting experience sections",
    });
    assert.equal(res.success, true);
    assert.ok(res.entry, "entry should be present");
    assert.ok(typeof res.entry.id === "string" && res.entry.id.length > 0, "entry has an ID");
    savedId = res.entry.id;
  });

  it("saves a second preference with a different category", async () => {
    const res = await saveFeedback({
      category: "search_filter",
      preference: "Prefer remote positions",
    });
    assert.equal(res.success, true);
    assert.ok(res.entry, "entry should be present");
    assert.notEqual(res.entry.id, savedId, "different ID from first entry");
  });

  it("detects duplicate preference (same category + text)", async () => {
    const res = await saveFeedback({
      category: "resume_style",
      preference: "Use bullet points instead of paragraphs",
    });
    assert.equal(res.success, true);
    assert.equal(res.message, "Preference already stored.");
  });

  it("detects case-insensitive duplicate", async () => {
    const res = await saveFeedback({
      category: "resume_style",
      preference: "USE BULLET POINTS INSTEAD OF PARAGRAPHS",
    });
    assert.equal(res.success, true);
    assert.equal(res.message, "Preference already stored.");
  });

  it("gets all preferences (returns 2)", async () => {
    const res = await getFeedback();
    assert.equal(res.total, 2, "should have 2 active preferences");
  });

  it("gets preferences by category (returns 1)", async () => {
    const res = await getFeedback({ category: "search_filter" });
    assert.equal(res.total, 1);
    assert.equal(res.preferences[0].category, "search_filter");
  });

  it("removes a preference by ID", async () => {
    const res = await removeFeedback({ id: savedId });
    assert.equal(res.success, true);
  });

  it("after removal, total count is 1", async () => {
    const res = await getFeedback();
    assert.equal(res.total, 1);
  });

  it("removing a nonexistent ID fails gracefully", async () => {
    const res = await removeFeedback({ id: "nonexistent-id-12345" });
    assert.equal(res.success, false);
    assert.ok(typeof res.message === "string", "has a message");
  });

  it("saves a preference without optional context", async () => {
    const res = await saveFeedback({
      category: "general",
      preference: "Keep responses concise",
    });
    assert.equal(res.success, true);
    assert.ok(res.entry, "entry present");
    assert.equal(res.entry.context, null, "context defaults to null");
  });
});

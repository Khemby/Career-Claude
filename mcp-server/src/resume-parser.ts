/**
 * Resume Parser Tool
 *
 * Accepts resume content as plain text, a path to a PDF, or a path to a DOCX file.
 * Returns a structured representation of the resume with labeled sections.
 *
 * PDF parsing uses pdf-parse (no native dependencies required).
 * DOCX parsing uses mammoth.
 */

import { readFile } from "fs/promises";

export interface ParsedResume {
  raw_text: string;
  contact: ContactInfo;
  summary: string | null;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: string[];
  parse_warnings: string[];
}

export interface ContactInfo {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  github: string | null;
  website: string | null;
}

export interface WorkExperience {
  title: string;
  company: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  bullets: string[];
}

export interface Education {
  degree: string;
  institution: string;
  year: string | null;
  gpa: string | null;
}

export async function parseResume(
  content: string,
  format: "text" | "pdf" | "docx" = "text"
): Promise<ParsedResume> {
  let rawText: string;

  if (format === "text") {
    rawText = content;
  } else if (format === "pdf") {
    rawText = await extractTextFromPdf(content);
  } else if (format === "docx") {
    rawText = await extractTextFromDocx(content);
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }

  return parseResumeText(rawText);
}

async function extractTextFromPdf(filePath: string): Promise<string> {
  const { default: pdfParse } = await import("pdf-parse");
  const buffer = await readFile(filePath);
  const result = await pdfParse(buffer);
  return result.text;
}

async function extractTextFromDocx(filePath: string): Promise<string> {
  const mammoth = await import("mammoth");
  const buffer = await readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function parseResumeText(text: string): ParsedResume {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const warnings: string[] = [];

  const contact = extractContact(lines, warnings);
  const summary = extractSummary(lines);
  const experience = extractExperience(lines, warnings);
  const education = extractEducation(lines);
  const skills = extractSkills(lines);
  const certifications = extractCertifications(lines);

  if (experience.length === 0) {
    warnings.push(
      "No work experience sections detected. Check that your experience section uses a standard heading."
    );
  }
  if (!contact.email) {
    warnings.push("No email address detected.");
  }

  return {
    raw_text: text,
    contact,
    summary,
    experience,
    education,
    skills,
    certifications,
    parse_warnings: warnings,
  };
}

function extractContact(lines: string[], warnings: string[]): ContactInfo {
  const emailRegex = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i;
  const phoneRegex = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/;
  const linkedinRegex = /linkedin\.com\/in\/[\w-]+/i;
  const githubRegex = /github\.com\/[\w-]+/i;
  const locationRegex = /^[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(\s+\d{5})?$/;

  const fullText = lines.join(" ");

  const emailMatch = fullText.match(emailRegex);
  const phoneMatch = fullText.match(phoneRegex);
  const linkedinMatch = fullText.match(linkedinRegex);
  const githubMatch = fullText.match(githubRegex);

  // Heuristic: name is usually the first non-empty line
  const name = lines[0] ?? null;

  // Location: look for City, ST pattern in first 10 lines
  let location: string | null = null;
  for (const line of lines.slice(0, 10)) {
    if (locationRegex.test(line)) {
      location = line;
      break;
    }
  }

  return {
    name,
    email: emailMatch?.[0] ?? null,
    phone: phoneMatch?.[0] ?? null,
    location,
    linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : null,
    github: githubMatch ? `https://${githubMatch[0]}` : null,
    website: null, // extend as needed
  };
}

function extractSummary(lines: string[]): string | null {
  const summaryHeadings = /^(summary|professional summary|profile|about|objective)/i;
  const nextSectionHeadings = /^(experience|work|employment|education|skills|certifications)/i;

  let inSummary = false;
  const summaryLines: string[] = [];

  for (const line of lines) {
    if (summaryHeadings.test(line)) {
      inSummary = true;
      continue;
    }
    if (inSummary) {
      if (nextSectionHeadings.test(line)) break;
      summaryLines.push(line);
    }
  }

  return summaryLines.length > 0 ? summaryLines.join(" ").trim() : null;
}

function extractExperience(lines: string[], warnings: string[]): WorkExperience[] {
  const experienceHeadings =
    /^(experience|work experience|professional experience|employment|work history)/i;
  const nextSectionHeadings =
    /^(education|skills|certifications|projects|volunteer|publications)/i;
  const datePattern = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b|\b\d{4}\b/i;
  const bulletPrefix = /^[•\-·]\s*/;

  let inExperience = false;
  const experienceLines: string[] = [];

  for (const line of lines) {
    if (experienceHeadings.test(line)) {
      inExperience = true;
      continue;
    }
    if (inExperience && nextSectionHeadings.test(line)) break;
    if (inExperience) experienceLines.push(line);
  }

  if (experienceLines.length === 0) return [];

  // Simple heuristic: group lines into roles by detecting lines with dates.
  // Bullets are checked first — they have unambiguous markers (•, -, ·).
  const roles: WorkExperience[] = [];
  let current: Partial<WorkExperience> & { bullets: string[] } = { bullets: [] };

  for (const line of experienceLines) {
    if (bulletPrefix.test(line)) {
      current.bullets.push(line.replace(bulletPrefix, "").trim());
    } else if (datePattern.test(line) && line.length < 80) {
      // Likely a company/date header line.
      // If current has only a title (no company, no bullets), it's the title
      // for THIS role — carry it forward instead of pushing an empty role.
      const carryTitle = (current.title && !current.company && current.bullets.length === 0)
        ? current.title
        : undefined;

      if (!carryTitle && (current.title || current.company)) {
        roles.push({
          title: current.title ?? "Unknown Title",
          company: current.company ?? "Unknown Company",
          location: current.location ?? null,
          start_date: current.start_date ?? null,
          end_date: current.end_date ?? null,
          bullets: current.bullets,
        });
      }
      current = { bullets: [] };
      // Try to extract dates from the line
      const dateRange = line.match(/(\w+ \d{4}|\d{4})\s*[-–—]\s*(\w+ \d{4}|\d{4}|present)/i);
      if (dateRange) {
        current.start_date = dateRange[1];
        current.end_date = dateRange[2];
      }
      // Carry forward the title from the preceding line
      if (carryTitle) {
        current.title = carryTitle;
      }
      // Extract company name (text before the pipe or date)
      current.company = line.replace(/\|.*$/, "").replace(/\d{4}.*$/, "").trim();
    } else if (!current.title && current.bullets.length === 0) {
      // First non-bullet, non-date line — likely a role title
      current.title = line;
    } else if (current.bullets.length > 0 && !datePattern.test(line)) {
      // Non-bullet, non-date line appearing after bullets — likely the title
      // of the next role. Push the current role and start a new one.
      if (current.title || current.company) {
        roles.push({
          title: current.title ?? "Unknown Title",
          company: current.company ?? "Unknown Company",
          location: current.location ?? null,
          start_date: current.start_date ?? null,
          end_date: current.end_date ?? null,
          bullets: current.bullets,
        });
      }
      current = { title: line, bullets: [] };
    } else {
      current.bullets.push(line);
    }
  }

  if (current.title || current.company) {
    roles.push({
      title: current.title ?? "Unknown Title",
      company: current.company ?? "Unknown Company",
      location: current.location ?? null,
      start_date: current.start_date ?? null,
      end_date: current.end_date ?? null,
      bullets: current.bullets,
    });
  }

  if (roles.length > 0 && roles.every((r) => r.bullets.length === 0)) {
    warnings.push(
      "Experience sections detected but no bullet points found. Ensure bullets use •, -, or standard formatting."
    );
  }

  return roles;
}

function extractEducation(lines: string[]): Education[] {
  const educationHeading = /^(education|academic background|academics)/i;
  const nextSectionHeadings =
    /^(skills|certifications|projects|experience|work|volunteer|publications)/i;

  let inEducation = false;
  const educationLines: string[] = [];

  for (const line of lines) {
    if (educationHeading.test(line)) {
      inEducation = true;
      continue;
    }
    if (inEducation && nextSectionHeadings.test(line)) break;
    if (inEducation) educationLines.push(line);
  }

  if (educationLines.length === 0) return [];

  const degrees: Education[] = [];
  const degreeKeywords = /\b(b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?b\.?a\.?|ph\.?d\.?|bachelor|master|associate|doctor)/i;
  const yearPattern = /\b(19|20)\d{2}\b/;
  const gpaPattern = /gpa[:\s]+([0-9.]+)/i;

  let current: Partial<Education> = {};

  for (const line of educationLines) {
    if (degreeKeywords.test(line)) {
      if (current.degree) degrees.push(current as Education);
      current = { degree: line, institution: "", year: null, gpa: null };
    } else if (current.degree && !current.institution) {
      current.institution = line;
    }
    if (yearPattern.test(line) && current.degree && !current.year) {
      current.year = line.match(yearPattern)?.[0] ?? null;
    }
    const gpaMatch = line.match(gpaPattern);
    if (gpaMatch && current.degree) {
      current.gpa = gpaMatch[1];
    }
  }

  if (current.degree) degrees.push(current as Education);

  return degrees;
}

function extractSkills(lines: string[]): string[] {
  const skillsHeading = /^(skills|technical skills|core competencies|competencies|technologies)/i;
  const nextSectionHeadings =
    /^(certifications|projects|experience|education|work|volunteer|publications|interests)/i;

  let inSkills = false;
  const skillLines: string[] = [];

  for (const line of lines) {
    if (skillsHeading.test(line)) {
      inSkills = true;
      continue;
    }
    if (inSkills && nextSectionHeadings.test(line)) break;
    if (inSkills) skillLines.push(line);
  }

  // Split on commas, pipes, bullets, or newlines
  const skills = skillLines
    .join(", ")
    .split(/[,|•\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 50);

  return [...new Set(skills)];
}

function extractCertifications(lines: string[]): string[] {
  const certHeading = /^(certifications?|licenses?|credentials?)/i;
  const nextSectionHeadings =
    /^(skills|projects|experience|education|work|volunteer|publications|interests)/i;

  let inCerts = false;
  const certLines: string[] = [];

  for (const line of lines) {
    if (certHeading.test(line)) {
      inCerts = true;
      continue;
    }
    if (inCerts && nextSectionHeadings.test(line)) break;
    if (inCerts) certLines.push(line);
  }

  return certLines
    .map((l) => l.replace(/^[•\-·]\s*/, "").trim())
    .filter((l) => l.length > 2);
}

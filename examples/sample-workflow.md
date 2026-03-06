# Sample Workflow: Full Career Claude Session

This is an annotated example of a complete Career Claude session — from first message to a customized, ATS-optimized resume and cover letter.

---

## Context

**User**: Mid-level marketing professional, 5 years of experience, currently a Marketing Manager at a SaaS startup. Targeting Senior Marketing Manager or Director of Marketing roles at Series B / growth-stage companies.

---

## Step 1: Intake

**User message:**
> I'm looking to transition from my current Marketing Manager role into a Senior Marketing Manager or Director-level position at a growth-stage B2B SaaS company. I've been in my current role for 2 years and feel like I'm ready to level up. Here's my current resume: [paste]

**Career Claude response:**
> Thanks for sharing your background. Before I dig into your resume, two quick questions:
> 1. Are you actively applying now, or still in early exploration mode?
> 2. Do you have a specific company or job posting you're targeting first, or are you looking for general optimization?

---

## Step 2: Resume Audit

Career Claude reads `skills/resume-best-practices.md` and delivers a structured audit.

**Career Claude response:**

```
## Resume Audit

**Overall Score: 6.2/10**

### Strengths
- Clean single-column format — ATS friendly
- Consistent date formatting
- Education section is appropriately brief

### Critical Issues
1. Summary is generic → Replace with a targeted pitch for Senior/Director roles at B2B SaaS
2. Bullets describe duties, not achievements → Every bullet needs a result
3. Missing: any mention of budget ownership, team leadership, or revenue impact

### ATS Compatibility
- Missing keywords: demand generation, pipeline contribution, MQL, SQL, marketing attribution
- Skills section only lists tools — add methodologies (ABM, PLG, content-led growth)

### Quick Wins
- First bullet under current role: "Managed social media channels" → "Grew LinkedIn following 4x and drove 340 MQLs through organic content strategy in Q1–Q3 2024"
- Add "B2B SaaS" and "Series B" context to summary — these are filtered on by recruiters
```

---

## Step 3: Targeting a Role

**User message:**
> Here's a job description I'm excited about — Senior Marketing Manager at Acme Corp: [paste JD]

Career Claude reads `skills/resume-customization.md` and performs a gap analysis.

**Career Claude response:**

```
## Customization Analysis: Senior Marketing Manager at Acme Corp

### Key Requirements Identified
- Required: Demand generation experience (appears 4x in JD)
- Required: Experience managing marketing budget >$500K
- Required: Cross-functional work with Sales and RevOps
- Preferred: ABM program ownership
- Preferred: Experience with HubSpot and Salesforce

### Keyword Gaps
- "Demand generation" → Not mentioned on resume. Add to summary and current role bullets.
- "Pipeline contribution" → You have data but it's buried. Surface it.
- "Marketing qualified leads (MQLs)" → Appears 3x in JD. Use exact phrase.
- "Sales alignment" → You have this experience — currently called "cross-team work"

### Bullet Rewrites

**Current role, Bullet 1:**
Before: "Ran campaigns across email, social, and paid channels"
After: "Owned demand generation across email, paid, and social, contributing 38% of company MQLs and $1.2M in sourced pipeline in FY2024"

**Current role, Bullet 3:**
Before: "Worked with the sales team to improve lead handoffs"
After: "Partnered with Sales and RevOps to redesign lead scoring model, reducing time-to-contact by 40% and improving SQL conversion rate from 18% to 27%"

### Summary Rewrite
Before: "Marketing Manager with experience across digital channels. Strong communicator and team player."

After: "Senior Marketing Manager with 5 years in B2B SaaS, specializing in demand generation and pipeline-focused campaign strategy. Proven track record of building cross-channel programs that drive MQL volume and support revenue targets. Experienced working alongside Sales and RevOps at Series A–B stage companies. Ready to lead the function at a scaling team."
```

---

## Step 4: Cover Letter

**User message:**
> Can you draft a cover letter for the Acme Corp role?

Career Claude reads `skills/cover-letter.md` and drafts a tailored letter.

**Career Claude response:**

```
## Cover Letter — Senior Marketing Manager, Acme Corp

---

[Your Name]
your@email.com | (555) 000-0000 | linkedin.com/in/yourprofile

Dear [Hiring Manager's Name],

Acme Corp's approach to product-led growth in the mid-market caught my attention long before this role was posted — the shift you made from outbound-first to a PLG motion backed by sales overlay is exactly the architecture I've been building toward in my own work. The fact that you're now hiring to scale the demand generation engine behind that motion is where I want to be.

In my current role at [Company], I own demand generation across paid, email, and content — contributing 38% of company MQLs and $1.2M in sourced pipeline last fiscal year. One of my highest-leverage projects was redesigning our lead scoring model in partnership with Sales and RevOps: we cut time-to-contact by 40% and improved SQL conversion from 18% to 27%. I mention this because I understand that at Acme's stage, marketing's job isn't just to generate top-of-funnel volume — it's to put the right signal in front of sales at the right moment.

I've operated at the Series A–B stage long enough to know what changes between 50 and 200 accounts in the pipeline. I'd bring that pattern recognition — plus a playbook for ABM program buildout and cross-functional alignment — to your team.

I'd welcome a conversation about what you're building. I'm available at your convenience — feel free to reach me at your@email.com.

[Your Name]
```

---

## Step 5: Job Search Expansion (Optional)

If the user wants to find similar roles:

**User message:**
> Are there other companies like Acme Corp I should be targeting?

Career Claude reads `skills/job-search-strategy.md` and advises:

**Career Claude response:**
> Based on what you've described — B2B SaaS, Series B stage, PLG motion, demand gen focus — here's how I'd build your target list:

```
## Target Company Profile

Stage: Series B–C (50–250 employees)
Model: B2B SaaS, product-led growth
Function: Marketing (demand gen / pipeline-focused)
Size signal: Companies with recent funding rounds, active hiring in go-to-market

## Where to Find These Companies
- Crunchbase: filter by B2B SaaS + Series B + funded in last 12 months
- LinkedIn: "Senior Marketing Manager" + "B2B SaaS" + posted last 7 days
- G2 / Capterra: Browse software categories you know; companies with strong review velocity are growing

## Sourcing Strategy
1. Build a target list of 20–25 companies matching this profile
2. Follow them on LinkedIn — role postings often appear in your feed before search
3. Connect with 2–3 marketing leaders at each target company for informational interviews
4. Apply to 5 tailored Tier A applications before broadening to Tier B
```

---

## Session Summary

In this session, Career Claude:
1. Audited the resume and scored it 6.2/10
2. Identified critical gaps (quantification, ATS keywords, leadership signals)
3. Analyzed a target JD and extracted required + preferred keywords
4. Rewrote the summary and key bullets for the specific role
5. Drafted a targeted, 3-paragraph cover letter
6. Provided a job search strategy for finding similar roles

**Estimated session time**: 45–60 minutes
**Output**: 1 customized resume + 1 cover letter + job search strategy

---

## How to Run This Yourself

1. Copy the contents of `project-instructions.md` into a Claude Project's system prompt
2. Add the skill files to the project's knowledge base
3. Start a new conversation and paste your resume
4. Follow the workflow above

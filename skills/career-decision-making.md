# Skill: Career Decision-Making

## Purpose
Use this skill when a user has a job offer to evaluate, is considering a lateral move, feels unhappy and is thinking about leaving, is comparing multiple opportunities, or is stuck in analysis paralysis. This skill operates in two modes:

- **Passive mode**: Claude detects bias patterns in user reasoning and surfaces counter-questions without lecturing. When a user makes a statement that matches a recognition pattern, name the bias and ask the counter-question.
- **Interactive mode**: Claude walks the user through structured evaluation frameworks step by step, scoring and diagnosing before recommending action.

---

## The Six Career Decision Biases

These biases distort how we predict our future feelings about career choices. Knowing them does not eliminate them, but awareness alone improves prediction accuracy by up to 30% (Wilson et al., 2004).

### 1. Impact Bias
**Definition**: Overestimating how strongly a single career event will affect your overall happiness.

Research: People overestimate negative emotional reactions by 30-60%. Professors predicted tenure would make them far happier than it actually did (Wilson & Gilbert, 2005; Gilbert et al., 1998).

**You might be doing this if**: "If I get this offer, everything changes." / "If I don't get this job, I'm stuck."

**Counter-question**: "Think about the last big career event you experienced — a promotion, a rejection, a new job. How long did the emotional high or low actually last?"

### 2. Durability Bias
**Definition**: Believing your emotional reaction to a decision will last far longer than it actually does.

Research: People predicted they would be upset for 11+ days after a negative event — the actual average was 3 days (Gilbert et al., 2004).

**You might be doing this if**: "I'll regret this forever." / "I'll never get over passing on this opportunity."

**Counter-question**: "Can you recall a career decision you agonized over that barely registers emotionally now? What changed?"

### 3. Projection Bias
**Definition**: Assuming your current emotional state will be your emotional state in the new role.

Research: Current moods bias predictions about the future by up to 30% (Loewenstein et al., 2003). Hungry shoppers buy 45% more food than those who just ate (Read & van Leeuwen, 1998).

**You might be doing this if**: "I'm anxious about this, so I'll be anxious there." / "I'm excited right now, so this must be the right move."

**Counter-question**: "Are you making this decision from a stable baseline, or are you reacting to how you feel right now — stressed, excited, burned out?"

### 4. Focalism
**Definition**: Letting one dimension of an opportunity dominate your entire evaluation.

Research: When people are prompted to consider the full picture of daily life — not just the focal change — their prediction accuracy improves by 35% (Wilson et al., 2000).

**You might be doing this if**: "The salary is low, so the whole opportunity is bad." / "The title is amazing, so everything else will work out."

**Counter-question**: "Set aside the one thing you keep coming back to. How does the rest of the opportunity look?"

### 5. Social Comparison
**Definition**: Evaluating your career decisions against other people's timelines and outcomes instead of your own goals.

Research: When people compare their predicted feelings to others' situations, error rates increase by 25% (Sevdalis & Harvey, 2006). We only predict our emotional reactions with about 30% accuracy when using others as the reference point (Van Boven & Loewenstein, 2003).

**You might be doing this if**: "My friend just made Director — I should be at that level too." / "Everyone from my cohort is at a startup, so I should be too."

**Counter-question**: "Whose career are you actually evaluating right now — yours or theirs? What would you choose if no one else's path were visible to you?"

### 6. Immune Neglect
**Definition**: Underestimating your own ability to adapt, recover, and find satisfaction in new circumstances.

Research: 85% of people under-predict how quickly they will emotionally recover from setbacks (Gilbert et al., 1998; Gilbert & Ebert, 2002).

**You might be doing this if**: "I could never adjust to that kind of role." / "If this doesn't work out, I won't recover."

**Counter-question**: "Think about a past career setback — a rejection, a bad role, a layoff. How long did it actually take you to adapt? Was it as bad as you predicted?"

### How Claude Uses This Section

In passive mode: when a user makes a statement that matches a recognition pattern above, name the bias briefly and ask the corresponding counter-question. Do not lecture or explain the research unprompted. One question is more useful than a paragraph of explanation. If the user asks why you flagged it, then share the research backing.

---

## Offer Evaluation Framework

### The Scorecard

Use this table to evaluate any opportunity systematically. Each dimension is scored 1-5.

| Dimension | 1 (Poor) | 3 (Acceptable) | 5 (Excellent) |
|-----------|----------|-----------------|---------------|
| **Role Fit** | Core work drains me or uses none of my strengths | Some tasks align, some don't | Daily work directly matches what I do best and want to keep doing |
| **Growth Trajectory** | No learning, no path forward | Some skill development, unclear advancement | Clear skill growth, visible next steps, stretch opportunities |
| **Compensation** | Below market, no upside | Market rate, standard benefits | Above market with equity, bonus, or strong upside |
| **Culture & Values Alignment** | Conflicts with my top values | Neutral — no strong signals either way | Company values match my top 3 personal values |
| **Manager Quality** | Red flags in interviews, poor reputation | Seems competent but hard to read | Strong signal of support, development focus, trust |
| **Work-Life Balance** | Always-on expectations, no boundaries | Reasonable hours with occasional spikes | Clear boundaries respected, sustainable pace |

### Interactive Exercise: Evaluate Your Offer

Walk the user through each dimension one at a time. For each, ask a specific prompting question:

1. **Role Fit**: "Describe a typical day in this role based on what you know. Which parts energize you? Which parts feel like a chore?"
2. **Growth Trajectory**: "Where does this role put you in two years? Can you name a specific skill or capability you'd gain?"
3. **Compensation**: "How does the total package compare to your market research? Are you trading comp for something else you value more?"
4. **Culture & Values**: "What signals have you picked up about the culture — from interviews, Glassdoor, people you've talked to? Do those signals match what matters to you?"
5. **Manager Quality**: "What is your read on the person you'd report to? Did they ask about your development, or only about what you'd deliver for them?"
6. **Work-Life Balance**: "Did anyone mention hours, on-call expectations, or pace? What did you observe about when people sent emails or scheduled interviews?"

After scoring all six dimensions:

- **Total 24-30**: Strong opportunity. Confirm your top-weighted dimensions are scoring high, then move forward with confidence.
- **Total 18-23**: Solid but not obvious. Identify which dimensions are pulling the score down and whether those are dealbreakers or trade-offs you can live with.
- **Total 12-17**: Significant concerns. Do not accept without addressing the low-scoring dimensions directly — ask more questions, negotiate, or walk away.
- **Total below 12**: Walk away unless extraordinary circumstances exist.

**Weighting step**: Ask the user to rank the six dimensions by personal importance. Flag if the total score is being carried by a high-scoring dimension the user ranked as less important while low-scoring dimensions sit at the top of their priority list. A 5 in Compensation and a 2 in Role Fit is a warning sign for someone who ranked Role Fit first.

---

## Stay vs. Leave Diagnosis

### Four Root Causes of Career Dissatisfaction

Not all unhappiness at work has the same fix. Misdiagnosing the problem leads to the wrong move — like quitting when you need a conversation with your manager, or staying when the role itself is the problem.

**1. Wrong Role — The work itself doesn't fit.**

Signals: The core tasks drain you regardless of workload. You don't admire the people who are great at your job. Your strengths go unused. You would not choose this function again.

What to do: This requires a real change — different function, different type of work. Use the offer evaluation framework or the self-discovery skill to identify what fits better. A lateral move or career pivot is appropriate here.

**2. Wrong Environment — The team, manager, or culture is the problem.**

Signals: You like the work but dread the people dynamics. Your manager is unsupportive or micromanaging. The culture conflicts with your values. You perform better on solo projects or when leadership is absent.

What to do: Explore internal transfers first. Same function, different team. If the culture is company-wide, then an external move makes sense — but target the same type of role at a different organization.

**3. Outgrown It — You've plateaued.**

Signals: You can do the job easily but feel unchallenged. You haven't learned anything new in months. You watch the clock. You are competent but not growing. This is the six-month check-in pattern — early excitement fades into routine.

What to do: Before leaving, pursue stretch opportunities — new projects, a lateral move, mentorship, expanded scope. Talk to your manager about what growth looks like. If the ceiling is real and the company cannot offer more, then search externally for a role one level up or with broader scope.

**4. External Stress — Burnout or life is bleeding in.**

Signals: Exhaustion persists even after weekends. Cynicism about work you used to enjoy. Physical symptoms — poor sleep, irritability, headaches. The problem feels like everything, not one specific thing.

What to do: Do not make career decisions from this state. Recover first — take PTO, set boundaries, reduce workload. Projection bias is strongest when you are burned out. If dissatisfaction persists after genuine rest, then reassess.

### Interactive Exercise: What's Really Going On?

Ask these four questions one at a time. Each one points toward a root cause.

1. "If you could do your exact job function at a completely different company with a great manager, would you be happy?" (Yes = Wrong Environment / No = Wrong Role)
2. "When was the last time you learned something new at work that excited you?" (Can't remember = Outgrown It / Recently, but it doesn't help = Wrong Role or Environment)
3. "If your workload were cut in half tomorrow, would the job become appealing?" (Yes = External Stress / No = deeper issue — Wrong Role or Outgrown It)
4. "Do you want to be the best version of someone in your current role, or does that goal feel irrelevant?" (Irrelevant = Wrong Role / Yes, but I can't get there here = Wrong Environment or Outgrown It)

**Different diagnosis leads to different action:**

| Diagnosis | Recommended Action |
|-----------|--------------------|
| Wrong Role | Explore new functions. Use values and work style exercises. Do not jump to another version of the same role. |
| Wrong Environment | Internal transfer first. If culture is company-wide, same role at a new company. |
| Outgrown It | Request stretch projects and scope expansion. If no growth path exists, search externally at the next level. |
| External Stress | Recover before deciding. Set a 4-6 week recovery window. Reassess after genuine rest. |

---

## Lateral Move Evaluation

### Running Toward vs. Running Away

Both motivations can be valid, but running toward is a stronger foundation for a successful move. Use these questions to distinguish them.

**Running Toward (growth-motivated)**:
- "I'm genuinely curious about this function and want to learn it."
- "This role connects to where I want to be in 3-5 years."
- "I've explored this interest through conversations, reading, or side projects — not just a passing thought."
- "I would want this role even if my current job were going perfectly."

**Running Away (escape-motivated)**:
- "I mostly want to get away from my current situation."
- "I haven't thought much about what the new role involves day-to-day."
- "Any change sounds better than what I have now."
- "I'm reacting to a recent negative event — a bad review, a conflict, being passed over."

**If the move is primarily escape-motivated**, flag it. The user may be solving the wrong problem — a manager conversation, a boundary reset, or recovery time might address the real issue without the risk of starting over in an unfamiliar function.

**If the move is growth-motivated**, support it. A lateral move that builds new skills or redirects toward stronger long-term fit is one of the most underused career strategies. Same pay does not mean same value — new capabilities compound over time.

### Locus of Control Check

People with an internal locus of control ("I shape my outcomes") tend to make more deliberate career moves and recover faster from setbacks. People with an external locus ("things happen to me") are more likely to feel stuck or passive.

If a user's language skews external — "there's nothing I can do," "it's all politics," "I just got unlucky" — gently surface this pattern. Ask: "What's the one thing in this situation that is within your control? What would you do differently if you believed your next move was entirely up to you?"

### Conversation Script: Discussing a Lateral Move With Your Manager

**What to say:**
- "I want to be transparent with you. I've been thinking about the [role] opening in [department]. I'm not unhappy here — I've learned a lot and I value our working relationship. But I'm realizing I'm curious about [function] and want to explore whether it's a fit."
- "I wanted to talk to you before applying so you hear it from me first. I'd appreciate your perspective."

**What not to say:**
- Do not frame it as a complaint about your current role.
- Do not blindside your manager by applying without a conversation — internal moves require trust.
- Do not apologize for being interested. Curiosity about growth is normal and healthy.

**What to expect**: A good manager will ask questions and may offer to help. A mediocre manager may take it personally. Either way, having the conversation directly is better than the alternative — your manager finding out from someone else.

---

## Surrogation: Your Best Decision Tool

### Why This Works

When facing a career decision, most people try to predict how they will feel by imagining the scenario in their head. This approach is unreliable — it activates every bias listed above.

A far better method: talk to someone who has already lived your scenario. Research shows this improves emotional prediction accuracy by 25-35% (Gilbert et al., 2009). Hearing one person's real experience is more useful than hours of introspection.

This is surrogation — using someone else's lived experience as data instead of relying on your own imagination.

### How to Find the Right Person

Look for someone who:
- Made the specific transition you are considering (e.g., marketing to product, big company to startup, IC to manager)
- Is 6-18 months into the new situation (recent enough to remember the adjustment, far enough to have perspective)
- Has a similar career stage or background to yours (their experience will be more transferable)

Where to look: LinkedIn, alumni networks, professional communities, your extended network. Ask your contacts: "Do you know anyone who recently moved from [X] to [Y]?"

### Outreach Template

> "Hi [Name], I found your profile while researching [transition/role type]. I'm currently a [your role] considering [the move you're evaluating], and I noticed you made a similar transition. Would you have 20 minutes for a quick call? I'm specifically trying to understand what the reality of [new role/path] looks like day-to-day. Happy to work around your schedule."

### Five Questions to Ask

1. "What surprised you most about the transition — something you couldn't have predicted beforehand?"
2. "What do you miss about your previous role, if anything?"
3. "How long did it take before you felt competent and comfortable?"
4. "If you could go back, would you make the same move? What would you do differently?"
5. "What's one thing you wish someone had told you before you made the switch?"

These questions are designed to surface real emotional data — not job descriptions or logistics, but what the experience actually felt like. That is the information your own imagination cannot reliably generate.

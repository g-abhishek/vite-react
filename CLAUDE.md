# CLAUDE.md — Project Rules & Documentation Standards

This file is read by Claude at the start of every conversation in this project.
Follow these rules precisely whenever the user asks to create a guide, learn a topic, or document anything.

---

## Project Overview

This is a **personal learning and reference repository**. It contains deep-dive technical guides written in Markdown, organized by topic area. The user is a developer who learns by reading well-structured, teaching-style documents — not just code snippets.

Current guide folders:
- `javascript/` — JavaScript, Node.js, React internals, patterns
- `CSSLearning/` — CSS concepts
- `DesignPattern/` — software design patterns
- `Docker/` — Docker and container guides
- `MongoDB/` — MongoDB internals and usage
- `PostgreSQL/` — PostgreSQL guides

---

## Rule 1 — When to Create a Guide

Trigger this doc-creation workflow whenever the user says any of:
- "lets learn X"
- "teach me X"
- "explain X in detail"
- "create a guide for X"
- "create me a doc on X"
- "add X to my notes"
- or any phrasing that asks for a comprehensive explanation of a technical topic

---

## Rule 2 — File Naming & Placement

### Naming format
```
{NN}-{Topic-Name}-Complete-Guide.md
```

- `NN` = next sequential number in the folder (check existing files first)
- `Topic-Name` = PascalCase-with-hyphens, descriptive name
- Always ends in `-Complete-Guide.md`

### Examples
```
09-Caching-Complete-Guide.md
10-WebSockets-Complete-Guide.md
11-JWT-Authentication-Complete-Guide.md
```

### Placement
- JavaScript / Node.js / React topics → `javascript/`
- CSS / styling topics → `CSSLearning/`
- Design patterns → `DesignPattern/`
- Docker / containers → `Docker/`
- New topic area → create a new folder named after the topic

**Always check the folder first with ls to get the correct next number.**

---

## Rule 3 — Mandatory Document Structure

Every guide MUST follow this exact structure, in this order:

```
# {Topic} — Complete Guide (Basics to Advanced)

> One-line description of what the guide covers and at what depth.

---

## Table of Contents
(numbered list linking to every section)

---

## 1. What is {Topic}? — The Real Explanation
## 2. Why {Topic} Matters — The Problems It Solves
## 3. Core Concepts & Mental Models
## 4. [Core sections specific to the topic]
   ...
## N-2. Advanced Patterns
## N-1. When to Use What — Decision Guide
## N.   Common Pitfalls & How to Avoid Them

---
## Summary Cheatsheet
(compact reference table at the very end)
```

The number of sections depends on the topic. The first 3 and last 3 sections are always present.

---

## Rule 4 — Teaching Style (MOST IMPORTANT)

The user explicitly wants guides that **teach from basics to advanced**, not just document APIs. Every section must follow this teaching pattern:

### 4a. Start with the "Why" before the "How"
Before showing any code or algorithm, explain:
- What problem does this solve?
- Why does it exist?
- What would break without it?

```
BAD:  "Token Bucket algorithm increments a counter at a refill rate..."
GOOD: "Imagine a bucket filled with tokens. Each request consumes one token.
       Tokens refill at a steady rate. This lets users burst briefly,
       then enforces a steady rate — perfect for real-world bursty traffic."
```

### 4b. Use Real-World Analogies First
Before technical details, give a concrete mental model from the real world.
- Rate limiting → bouncer at a club checking a logbook
- Event loop → a restaurant with one waiter
- Promises → ordering food and getting a ticket number

### 4c. Walk Through Step-by-Step Before Showing Code
Show what the algorithm does on concrete values before the implementation.

```
Setup: limit=3, window=10s

t=1  → Request arrives. Log: [1].        Count=1 → ALLOW
t=4  → Request arrives. Log: [1,4].      Count=2 → ALLOW
t=7  → Request arrives. Log: [1,4,7].    Count=3 → ALLOW
t=9  → Request arrives. Log: [1,4,7].    Count=3 → BLOCK
t=12 → Remove expired. Log: [4,7].       Count=2 → ALLOW
```

### 4d. Use ASCII Flow Diagrams for Every Algorithm
Every algorithm needs a flow diagram showing the decision path:

```
Request arrives
      │
      ▼
  Compute key
      │
      ▼
  count >= limit? ──YES──► Return 429
      │
      NO
      ▼
  Increment counter
      │
      ▼
  Allow request
```

### 4e. Code Must Be Self-Explaining
- Every class and function gets a JSDoc comment
- Non-obvious lines get inline `// Why:` comments
- Group related lines with `// ── Section Name ──` banners
- Show example output as comments after key calls

```javascript
// ── Lazy Refill ────────────────────────────────────────────────
// We don't use a background timer (wasteful for millions of users).
// Instead, compute how many tokens earned since the last request.
const elapsed = (now - bucket.lastRefill) / 1000;        // seconds
const tokensEarned = elapsed * this.refillRate;           // tokens added
bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensEarned);
```

### 4f. Explain the Flaw / Edge Case of Every Approach
Every algorithm has a weakness. Find it and explain it clearly with a concrete example.

```
The Boundary Attack (Fixed Window):
  Limit = 100/min. Windows reset at :00, :01, etc.

  Attacker sends 100 requests at :59  → Window 1 is at limit (allowed).
  Attacker sends 100 requests at :01  → Window 2 starts fresh (allowed).
  Result: 200 requests in 2 seconds — twice the intended limit.
```

### 4g. Always Include Pros & Cons Tables
After each algorithm or approach, add a structured pros/cons table.

### 4h. Code Examples Must Be Runnable
All code examples must be:
- Complete (not pseudo-code unless labelled as such)
- Runnable in Node.js without modification (for JS topics)
- Including a `// ─── Demo ───` section that shows actual usage
- Showing expected output as comments

---

## Rule 5 — Depth Requirements Per Section

### Section: "What is X?"
- Start from zero — assume reader knows nothing about this topic
- Explain the core idea in one clear sentence, then expand
- Show what the world looks like WITHOUT this thing (the problem state)
- Show what it looks like WITH it (the solution state)
- ASCII diagram showing the before/after

### Section: "Why X Matters"
- List at least 4–6 concrete real-world problems it solves
- For each problem: name it, explain it with a brief scenario or numbers
- Include code showing what breaks without it (where applicable)

### Section: "Core Concepts & Terminology"
- Define every term that will be used in the guide
- Use concrete examples for each term, not just dictionary definitions
- Show how the terms relate to each other

### Algorithm / Concept Sections (the main body)
Each concept or algorithm section MUST contain:
1. **The Idea** — mental model / analogy (2–5 sentences)
2. **Key Parameters** — what you configure and what each does
3. **Step-by-Step Walkthrough** — concrete values, not generalities
4. **Flow Diagram** — ASCII decision tree
5. **Full Implementation** — runnable code with inline comments
6. **The Flaw / Edge Case** — what breaks, when, with example
7. **Pros & Cons Table**

### Section: "Advanced Patterns"
- At least 3–5 patterns
- Each pattern: problem statement → solution → annotated code
- Real-world context: "This is how Stripe does X", "GitHub uses this for Y"

### Section: "When to Use What"
- Decision flowchart (ASCII tree)
- Lookup table: use case → recommended approach → reason
- By traffic level, by team size, by accuracy requirement

### Section: "Common Pitfalls"
- At least 5–7 pitfalls
- Each pitfall: name → BAD code → GOOD code → explanation of why BAD fails
- Include the failure mode, not just "don't do this"

### Summary Cheatsheet
- One compact table covering all major options
- Columns: name, memory, speed, key properties, best use case
- Single-line "default choice" recommendation with justification

---

## Rule 6 — Formatting Rules

### Headers
- `##` for top-level sections (numbered)
- `###` for subsections within a section
- `####` only for deeply nested sub-subsections (use sparingly)

### Code blocks
- Always include the language identifier: ` ```javascript `, ` ```bash `, ` ```sql `
- Unnamed/conceptual flows: ` ``` ` (no language)
- Keep lines under 100 characters where possible

### Tables
- Use for: comparisons, pros/cons, use-case lookups, parameter references
- Always have a header row with `│` alignment
- Add a separator row under the header

### Diagrams
- Use ASCII art for all diagrams — no external image dependencies
- Boxes: `┌─┐ │ └─┘`
- Arrows: `─► ◄─ │ ▼ ▲`
- Use consistent box-drawing characters throughout the guide

### Emphasis
- `**bold**` for key terms being defined
- `` `code` `` for inline code, variable names, config values
- `_italic_` sparingly, only for genuine emphasis

---

## Rule 7 — Length & Completeness

- There is **no maximum length**. Depth is the goal.
- A guide should be long enough that a developer can go from zero knowledge to production-ready understanding by reading only that guide.
- Every section should be completable as a standalone reference.
- Do NOT truncate explanations to keep the file short.
- If a topic has 8 algorithms, document all 8. Do not say "see X for details."

---

## Rule 8 — What NOT to Do

- **Do NOT** write a guide that is mostly code with minimal explanation.
- **Do NOT** start with implementation before motivation.
- **Do NOT** use vague statements like "this is better" without saying why.
- **Do NOT** skip the pitfalls section — it is often the most valuable part.
- **Do NOT** write pseudo-code unless clearly labelled and followed by real code.
- **Do NOT** create a guide that requires reading external links to understand the topic.
- **Do NOT** use emojis in guides unless the user explicitly requests them.

---

## Rule 9 — Before Writing, Always Check

1. `ls javascript/` (or relevant folder) — get the correct next file number
2. Check if a guide on this topic already exists — if so, update it rather than creating a duplicate
3. Confirm which subfolder is correct for the topic

---

## Example: Prompt → Action Mapping

| User says                                    | Action                                              |
|----------------------------------------------|-----------------------------------------------------|
| "lets learn caching"                         | Create `javascript/09-Caching-Complete-Guide.md`    |
| "teach me about websockets"                  | Create `javascript/09-WebSockets-Complete-Guide.md` |
| "create a guide on design patterns"          | Create `DesignPattern/01-Design-Patterns-Guide.md`  |
| "add docker networking to my notes"          | Create `Docker/XX-Docker-Networking-Guide.md`       |
| "explain how JWT works in detail"            | Create `javascript/09-JWT-Complete-Guide.md`        |
| "update the rate limiting guide with X"      | Edit `javascript/08-Rate-Limiting-Complete-Guide.md`|

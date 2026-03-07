# CI Test Suite Design
**Date:** 2026-03-06
**Status:** Approved

## Goal

Add automated tests that run on every PR, plus a local full-stack test script that includes the Python ML service.

## Approach

Node.js built-in test runner (`node:test` + `node:assert`). Zero new dependencies.

## CI Tests (`mcp-server/test/e2e.test.mjs`)

Runs in GitHub Actions on every PR to `main`.

| Test group | What it covers |
|-----------|---------------|
| Resume parser | Contact extraction, summary, education, skills, certs, edge cases (empty/minimal) |
| Job search | Mock mode returns valid structure, respects max_results |
| Fit scorer fallback | Returns `available:false` with reason/suggestion when Python is down |
| Feedback CRUD | Save, duplicate detection, get all, get by category, remove, bad ID, case-insensitive dup |

Feedback tests use `CAREER_CLAUDE_FEEDBACK_PATH` pointed at a temp file to isolate from real user data.

## Local Full-Stack Script (`test-full.sh`)

Run manually before releases. Covers everything in CI plus:

- Starts Python fit scorer, waits for `/health` endpoint
- Tests live ML scoring (score endpoint, error handling: 400, 404, bad JSON)
- Tests MCP TypeScript client → Python HTTP integration
- Cleans up Python process on exit (trap)

## GitHub Action (`.github/workflows/ci.yml`)

- Trigger: PR to `main`
- Matrix: Node 18, 20
- Steps: `npm install` → `npm run build` → `npm test`
- Also validates skill files exist and are non-empty
- No Python in CI (model download too slow)

## Files

| File | Purpose |
|------|---------|
| `mcp-server/test/e2e.test.mjs` | CI test suite using `node:test` |
| `mcp-server/package.json` | Add `"test"` script |
| `.github/workflows/ci.yml` | GitHub Actions workflow |
| `test-full.sh` | Local full-stack test including Python ML |

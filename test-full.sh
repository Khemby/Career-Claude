#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAIL=0
FIT_PID=""

cleanup() {
  if [ -n "$FIT_PID" ]; then
    kill "$FIT_PID" 2>/dev/null || true
    wait "$FIT_PID" 2>/dev/null || true
    echo "Stopped fit scorer (PID $FIT_PID)"
  fi
}
trap cleanup EXIT

echo ""
echo "════════════════════════════════════════════════════"
echo " Career Claude — Full-Stack Test"
echo "════════════════════════════════════════════════════"

# ── Layer 1: Skill files ─────────────────────────────────────────────────────

echo ""
echo "── Layer 1: Skill Files ──"

for f in skills/resume-best-practices.md skills/resume-customization.md skills/job-search-strategy.md skills/cover-letter.md project-instructions.md; do
  if [ ! -s "$SCRIPT_DIR/$f" ]; then
    echo "  FAIL: $f missing or empty"
    FAIL=1
  else
    lines=$(wc -l < "$SCRIPT_DIR/$f")
    echo "  OK: $f ($lines lines)"
  fi
done

# ── Layer 2: MCP Server ──────────────────────────────────────────────────────

echo ""
echo "── Layer 2: MCP Server ──"

cd "$SCRIPT_DIR/mcp-server"

echo "  Building..."
npm run build --silent

echo "  Running tests..."
if npm test 2>&1; then
  echo "  OK: All MCP tests passed"
else
  echo "  FAIL: MCP tests failed"
  FAIL=1
fi

# ── Layer 3: Python ML Fit Scorer ────────────────────────────────────────────

echo ""
echo "── Layer 3: Python ML Fit Scorer ──"

PYTHON_CMD=""
if command -v python3 &>/dev/null; then
  PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
  PYTHON_CMD="python"
fi

if [ -z "$PYTHON_CMD" ]; then
  echo "  SKIP: Python not installed"
elif ! $PYTHON_CMD -c "import sentence_transformers" 2>/dev/null; then
  echo "  SKIP: sentence-transformers not installed (run: pip install -r fit-scorer/requirements.txt)"
else
  echo "  Starting fit scorer..."
  cd "$SCRIPT_DIR/fit-scorer"
  $PYTHON_CMD server.py &
  FIT_PID=$!

  # Wait for health check (up to 60 seconds)
  echo "  Waiting for model to load..."
  READY=0
  for i in $(seq 1 60); do
    if curl -sf http://127.0.0.1:7821/health > /dev/null 2>&1; then
      READY=1
      break
    fi
    sleep 1
  done

  if [ "$READY" -eq 0 ]; then
    echo "  FAIL: Fit scorer did not start within 60 seconds"
    FAIL=1
  else
    echo "  Fit scorer ready."

    # Health endpoint
    HEALTH=$(curl -sf http://127.0.0.1:7821/health)
    if echo "$HEALTH" | grep -q '"model_loaded": true'; then
      echo "  OK: /health returns model_loaded:true"
    else
      echo "  FAIL: /health unexpected response: $HEALTH"
      FAIL=1
    fi

    # Score endpoint
    SCORE=$(curl -sf -X POST http://127.0.0.1:7821/score \
      -H "Content-Type: application/json" \
      -d '{"resume_text":"Python developer with AWS and Docker","jd_text":"Looking for Python dev with AWS, Kubernetes, Terraform"}')
    if echo "$SCORE" | grep -q '"score"'; then
      echo "  OK: /score returns valid result"
    else
      echo "  FAIL: /score unexpected response: $SCORE"
      FAIL=1
    fi

    # 404 endpoint
    ERR404=$(curl -s http://127.0.0.1:7821/nonexistent)
    if echo "$ERR404" | grep -q '"not found"'; then
      echo "  OK: 404 returns proper error"
    else
      echo "  FAIL: 404 unexpected response: $ERR404"
      FAIL=1
    fi

    # Empty body (400)
    ERR400=$(curl -s -X POST http://127.0.0.1:7821/score \
      -H "Content-Type: application/json" \
      -d '{"resume_text":"","jd_text":""}')
    if echo "$ERR400" | grep -q '"resume_text and jd_text are required"'; then
      echo "  OK: Empty body returns 400"
    else
      echo "  FAIL: Empty body unexpected response: $ERR400"
      FAIL=1
    fi

    # MCP → Python integration
    echo "  Testing MCP → Python integration..."
    cd "$SCRIPT_DIR/mcp-server"
    INTEGRATION=$(node --input-type=module -e "
      import { scoreFit } from './dist/fit-scorer.js';
      const r = await scoreFit('Python dev with AWS', 'Need Python AWS Kubernetes');
      if (r.available === true && typeof r.score === 'number') {
        console.log('PASS');
      } else {
        console.log('FAIL: ' + JSON.stringify(r));
      }
    " 2>&1)
    if [ "$INTEGRATION" = "PASS" ]; then
      echo "  OK: MCP client → Python service integration"
    else
      echo "  FAIL: Integration test: $INTEGRATION"
      FAIL=1
    fi
  fi
fi

# ── Summary ──────────────────────────────────────────────────────────────────

echo ""
echo "════════════════════════════════════════════════════"
if [ "$FAIL" -eq 0 ]; then
  echo " ALL TESTS PASSED"
else
  echo " SOME TESTS FAILED"
fi
echo "════════════════════════════════════════════════════"
echo ""

exit $FAIL

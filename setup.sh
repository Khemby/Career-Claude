#!/usr/bin/env bash
set -euo pipefail

# ── Career Claude Setup ────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_ENTRY_PATH="$SCRIPT_DIR/mcp-server/dist/index.js"
MCP_ONLY=false

for arg in "$@"; do
  case $arg in
    --mcp-only) MCP_ONLY=true ;;
  esac
done

echo ""
echo "Career Claude Setup"
echo "───────────────────────────────────────────────"

# ── Locate Claude Desktop config ──────────────────────────────────────────────

detect_config_path() {
  local os
  os="$(uname -s)"
  case "$os" in
    Darwin) echo "$HOME/Library/Application Support/Claude/claude_desktop_config.json" ;;
    Linux)  echo "$HOME/.config/Claude/claude_desktop_config.json" ;;
    *)      echo "" ;;
  esac
}

CONFIG_PATH="$(detect_config_path)"

# ── Patch claude_desktop_config.json ─────────────────────────────────────────

patch_config() {
  local config_path="$1"
  local mcp_path="$2"

  mkdir -p "$(dirname "$config_path")"

  python3 - "$config_path" "$mcp_path" <<'PYEOF'
import json, sys

config_path = sys.argv[1]
mcp_path    = sys.argv[2]

try:
    with open(config_path, "r") as f:
        config = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    config = {}

config.setdefault("mcpServers", {})
config["mcpServers"]["career-claude"] = {
    "command": "node",
    "args": [mcp_path]
}

with open(config_path, "w") as f:
    json.dump(config, f, indent=2)
    f.write("\n")

print(f"Patched: {config_path}")
PYEOF
}

# ── Build MCP server ──────────────────────────────────────────────────────────

build_mcp() {
  echo ""
  echo "Checking for Node.js..."

  if ! command -v node &>/dev/null; then
    echo ""
    echo "Node.js is not installed."
    echo "Install it from https://nodejs.org (LTS version) and re-run:"
    echo "  ./setup.sh --mcp-only"
    exit 1
  fi

  local node_version
  node_version="$(node --version | sed 's/v//' | cut -d. -f1)"
  if [ "$node_version" -lt 18 ]; then
    echo "Node.js 18+ required (found v$node_version). Please upgrade and re-run."
    exit 1
  fi

  echo "Node.js $(node --version) found."
  echo ""
  echo "Installing dependencies and building MCP server..."

  (cd "$SCRIPT_DIR/mcp-server" && npm install && npm run build)

  echo ""
  echo "MCP server built successfully."
}

# ── Main flow ─────────────────────────────────────────────────────────────────

if [ "$MCP_ONLY" = true ]; then
  build_mcp
  if [ -n "$CONFIG_PATH" ]; then
    patch_config "$CONFIG_PATH" "$MCP_ENTRY_PATH"
    echo "Claude Desktop config updated."
    echo "Restart Claude Desktop to activate."
  else
    echo ""
    echo "Could not detect Claude Desktop config path on this OS."
    echo "Add the MCP entry manually — see README.md for the JSON snippet."
  fi
  exit 0
fi

# Normal flow — ask about MCP
echo ""
read -r -p "Enable MCP tools (job search, resume parsing, fit scoring)? Requires Node.js 18+. [y/N] " response

case "$response" in
  [yY][eE][sS]|[yY])
    build_mcp
    if [ -n "$CONFIG_PATH" ]; then
      patch_config "$CONFIG_PATH" "$MCP_ENTRY_PATH"
      echo ""
      echo "Claude Desktop config updated."
      echo "Restart Claude Desktop to activate all tools."
    else
      echo ""
      echo "Could not detect Claude Desktop config path on this OS."
      echo "Add the MCP entry manually — see README.md for the JSON snippet."
    fi
    ;;
  *)
    echo ""
    echo "Skipped. Run ./setup.sh --mcp-only anytime to enable MCP tools later."
    ;;
esac

echo ""
echo "───────────────────────────────────────────────"
echo "For claude.ai setup: open setup-assistant-prompt.md and paste it into any Claude conversation."
echo "For Claude Code (terminal): just run 'claude' in this directory — it's already configured."
echo ""

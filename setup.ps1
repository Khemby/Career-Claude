#Requires -Version 5.1
<#
.SYNOPSIS
    Career Claude setup for Windows — Claude Desktop + optional MCP server build.
.PARAMETER McpOnly
    Skip the prompt and only build the MCP server + patch config.
#>
param(
    [switch]$McpOnly
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$McpEntryPath = Join-Path $ScriptDir "mcp-server\dist\index.js"
$ConfigPath = Join-Path $env:APPDATA "Claude\claude_desktop_config.json"

Write-Host ""
Write-Host "Career Claude Setup"
Write-Host "───────────────────────────────────────────────"

function Patch-Config {
    param([string]$ConfigPath, [string]$McpPath)

    $dir = Split-Path -Parent $ConfigPath
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

    if (Test-Path $ConfigPath) {
        try {
            $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
        } catch {
            $config = [PSCustomObject]@{ mcpServers = [PSCustomObject]@{} }
        }
    } else {
        $config = [PSCustomObject]@{ mcpServers = [PSCustomObject]@{} }
    }

    if (-not (Get-Member -InputObject $config -Name "mcpServers" -MemberType NoteProperty)) {
        $config | Add-Member -NotePropertyName "mcpServers" -NotePropertyValue ([PSCustomObject]@{})
    }

    $mcpEntry = [PSCustomObject]@{
        command = "node"
        args    = @($McpPath)
    }

    $config.mcpServers | Add-Member -NotePropertyName "career-claude" -NotePropertyValue $mcpEntry -Force
    $config | ConvertTo-Json -Depth 10 | Set-Content $ConfigPath -Encoding UTF8
    Write-Host "Patched: $ConfigPath"
}

function Build-Mcp {
    Write-Host ""
    Write-Host "Checking for Node.js..."

    try {
        $nodeVersion = (node --version 2>&1).TrimStart("v").Split(".")[0]
    } catch {
        Write-Host ""
        Write-Host "Node.js is not installed."
        Write-Host "Install it from https://nodejs.org (LTS version) and re-run:"
        Write-Host "  .\setup.ps1 -McpOnly"
        exit 1
    }

    if ([int]$nodeVersion -lt 18) {
        Write-Host "Node.js 18+ required (found v$nodeVersion). Please upgrade and re-run."
        exit 1
    }

    Write-Host "Node.js v$nodeVersion found."
    Write-Host ""
    Write-Host "Installing dependencies and building MCP server..."

    Push-Location (Join-Path $ScriptDir "mcp-server")
    try {
        npm install
        npm run build
    } finally {
        Pop-Location
    }

    Write-Host ""
    Write-Host "MCP server built successfully."
}

# ── Main flow ──────────────────────────────────────────────────────────────────

if ($McpOnly) {
    Build-Mcp
    Patch-Config -ConfigPath $ConfigPath -McpPath $McpEntryPath
    Write-Host "Restart Claude Desktop to activate."
    exit 0
}

Write-Host ""
$response = Read-Host "Enable MCP tools (job search, resume parsing, fit scoring)? Requires Node.js 18+. [y/N]"

if ($response -match "^[yY]") {
    Build-Mcp
    Patch-Config -ConfigPath $ConfigPath -McpPath $McpEntryPath
    Write-Host ""
    Write-Host "Claude Desktop config updated."
    Write-Host "Restart Claude Desktop to activate all tools."
} else {
    Write-Host ""
    Write-Host "Skipped. Run .\setup.ps1 -McpOnly anytime to enable MCP tools later."
}

Write-Host ""
Write-Host "───────────────────────────────────────────────"
Write-Host "For claude.ai setup: open setup-assistant-prompt.md and paste it into any Claude conversation."
Write-Host "For Claude Code (terminal): just run 'claude' in this directory — it's already configured."
Write-Host ""

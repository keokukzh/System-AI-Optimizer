#!/bin/bash
# MCP Server Startup Script for OptiAI

echo "🚀 Starting MCP servers..."

# Start filesystem server
npx @modelcontextprotocol/server-filesystem &
echo "📁 Filesystem server started"

# Start GitHub server (if token available)
if [ ! -z "$GITHUB_TOKEN" ]; then
  npx @modelcontextprotocol/server-github &
  echo "🐙 GitHub server started"
fi

# Start fetch server
npx @modelcontextprotocol/server-fetch &
echo "🌐 Fetch server started"

# Start Playwright server
npx @modelcontextprotocol/server-playwright &
echo "🎭 Playwright server started"

echo "✅ All MCP servers started"

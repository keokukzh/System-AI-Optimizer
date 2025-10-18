@echo off
REM MCP Server Startup Script for OptiAI (Windows)

echo 🚀 Starting MCP servers...

REM Start filesystem server
echo 📁 Starting filesystem server...
start /B npx @modelcontextprotocol/server-filesystem
echo ✅ Filesystem server started

REM Start GitHub server (if token available)
if defined GITHUB_TOKEN (
    echo 🐙 Starting GitHub server...
    start /B npx @modelcontextprotocol/server-github
    echo ✅ GitHub server started
) else (
    echo ⚠️  GITHUB_TOKEN not set, skipping GitHub server
)

echo ✅ MCP servers started successfully!
echo.
echo 📋 Available MCP servers:
echo   - Filesystem: @modelcontextprotocol/server-filesystem
echo   - GitHub: @modelcontextprotocol/server-github (if token set)
echo.
echo 💡 To set GitHub token: set GITHUB_TOKEN=your_token_here
echo 💡 To stop servers: Close this window or use Ctrl+C

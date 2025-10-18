# MCP Server Startup Script for OptiAI (PowerShell)

Write-Host "🚀 Starting MCP servers..." -ForegroundColor Green

# Start filesystem server
Write-Host "📁 Starting filesystem server..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "@modelcontextprotocol/server-filesystem"
Write-Host "✅ Filesystem server started" -ForegroundColor Green

# Start GitHub server (if token available)
if ($env:GITHUB_TOKEN) {
    Write-Host "🐙 Starting GitHub server..." -ForegroundColor Yellow
    Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "@modelcontextprotocol/server-github"
    Write-Host "✅ GitHub server started" -ForegroundColor Green
} else {
    Write-Host "⚠️  GITHUB_TOKEN not set, skipping GitHub server" -ForegroundColor Yellow
}

Write-Host "✅ MCP servers started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Available MCP servers:" -ForegroundColor Cyan
Write-Host "  - Filesystem: @modelcontextprotocol/server-filesystem" -ForegroundColor White
Write-Host "  - GitHub: @modelcontextprotocol/server-github (if token set)" -ForegroundColor White
Write-Host ""
Write-Host "💡 To set GitHub token: `$env:GITHUB_TOKEN = 'your_token_here'" -ForegroundColor Magenta
Write-Host "💡 To stop servers: Close this window or use Ctrl+C" -ForegroundColor Magenta

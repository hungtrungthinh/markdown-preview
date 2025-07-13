#!/bin/bash

# Development Setup Script for Markdown Preview
set -e

echo "🚀 Setting up Markdown Preview development environment..."

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust is not installed. Please install Rust first:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install Rust dependencies
echo "📦 Installing Rust dependencies..."
cargo check

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p deploy
mkdir -p monitoring

# Set up environment
echo "⚙️ Setting up environment..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Created .env file from template"
else
    echo "✅ .env file already exists"
fi

# Install development tools
echo "🔧 Installing development tools..."
npm install -g concurrently

# Set up Git hooks (if in a Git repository)
if [ -d .git ]; then
    echo "🔗 Setting up Git hooks..."
    if [ ! -f .git/hooks/pre-commit ]; then
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Running pre-commit checks..."

# Check Rust code
echo "Checking Rust code..."
cargo check
if [ $? -ne 0 ]; then
    echo "❌ Rust check failed"
    exit 1
fi

# Check frontend code
echo "Checking frontend code..."
cd frontend
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Frontend lint failed"
    exit 1
fi
cd ..

echo "✅ Pre-commit checks passed"
EOF
        chmod +x .git/hooks/pre-commit
        echo "✅ Created pre-commit hook"
    fi
fi

# Create VS Code workspace settings
echo "⚙️ Setting up VS Code workspace..."
mkdir -p .vscode
if [ ! -f .vscode/settings.json ]; then
    cat > .vscode/settings.json << 'EOF'
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "rust-analyzer.checkOnSave.command": "clippy",
  "rust-analyzer.cargo.buildScripts.enable": true,
  "rust-analyzer.procMacro.enable": true,
  "files.associations": {
    "*.rs": "rust"
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
EOF
    echo "✅ Created VS Code settings"
fi

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Start development servers: make dev"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Start coding!"
echo ""
echo "Available commands:"
echo "  make dev          - Start development servers"
echo "  make build        - Build for production"
echo "  make test         - Run all tests"
echo "  make clean        - Clean build artifacts"
echo ""
echo "Happy coding! 🚀" 
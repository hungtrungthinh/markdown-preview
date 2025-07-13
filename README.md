# Markdown Preview - Live Editor

A beautiful, modern markdown preview editor with real-time rendering, built with Rust backend and Next.js 15 frontend.

## Features

- ✨ **Real-time preview** - See changes instantly as you type
- 🎨 **Beautiful syntax highlighting** - Code blocks with syntax highlighting
- 📱 **Responsive design** - Works perfectly on all devices
- ⚡ **Fast rendering** - Powered by Rust backend for optimal performance
- 🔧 **Customizable themes** - Toggle between light and dark modes
- 📁 **File operations** - Upload, download, and copy markdown files
- 🎯 **Modern UI** - Built with Fluent UI 2 and Tailwind CSS

## Tech Stack

### Backend
- **Rust** - High-performance backend
- **Axum** - Modern web framework
- **Markdown** - Markdown parsing and rendering
- **Syntect** - Syntax highlighting

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Fluent UI 2** - Microsoft's design system
- **Tailwind CSS** - Utility-first CSS framework
- **React Markdown** - Markdown rendering
- **Lucide React** - Beautiful icons

## Quick Start

### Prerequisites
- Rust (latest stable)
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd markdown-preview
   ```

2. **Start the Rust backend**
   ```bash
   # Install dependencies and run
   cargo run
   ```
   The backend will start on `http://localhost:3001`

3. **Start the Next.js frontend**
   ```bash
   # Navigate to frontend directory
   cd frontend
   
   # Install dependencies
   npm install
   
   # Start development server
   npm run dev
   ```
   The frontend will start on `http://localhost:3000`

4. **Open your browser**
   Navigate to `http://localhost:3000` to start using the markdown editor!

## Development

### Backend Development
```bash
# Run in development mode with hot reload
cargo watch -x run

# Run tests
cargo test

# Build for production
cargo build --release
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## API Endpoints

### POST `/api/convert`
Convert markdown to HTML

**Request Body:**
```json
{
  "content": "# Hello World\n\nThis is **markdown** content.",
  "theme": "light" // optional: "light" or "dark"
}
```

**Response:**
```json
{
  "html": "<h1>Hello World</h1><p>This is <strong>markdown</strong> content.</p>",
  "error": null
}
```

### GET `/health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "service": "markdown-preview-backend"
}
```

## Project Structure

```
markdown-preview/
├── src/                    # Rust backend source
│   └── main.rs            # Main server file
├── frontend/              # Next.js frontend
│   ├── app/               # App Router pages
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Main page
│   │   └── globals.css    # Global styles
│   ├── package.json       # Frontend dependencies
│   ├── next.config.js     # Next.js configuration
│   ├── tailwind.config.js # Tailwind CSS configuration
│   └── tsconfig.json      # TypeScript configuration
├── Cargo.toml             # Rust dependencies
└── README.md              # This file
```

## Features in Detail

### Real-time Preview
The editor provides instant feedback as you type, with a 300ms debounce to ensure smooth performance.

### Syntax Highlighting
Code blocks are automatically highlighted based on the language specified in the markdown.

### File Operations
- **Upload**: Drag and drop or click to upload `.md` files
- **Download**: Save your current markdown as a file
- **Copy**: Copy markdown content to clipboard

### Theme Support
Toggle between light and dark themes with the switch in the header.

### Responsive Design
The interface adapts beautifully to different screen sizes, from mobile to desktop.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
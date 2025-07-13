"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import {
  EyeIcon,
  CodeIcon,
  DownloadIcon,
  UploadIcon,
  CopyIcon,
  CheckIcon,
  SunIcon,
  MoonIcon,
  GithubIcon, // Add this import
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import dynamic from "next/dynamic";

// Dynamic import ExportMenu with SSR disabled
const ExportMenu = dynamic(() => import("./components/ExportMenu"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
      <span>Loading...</span>
    </div>
  ),
});

const defaultMarkdown = `# Welcome to Markdown Preview

This is a **live markdown editor** with real-time preview.

## Features

- ✨ **Real-time preview**
- 🎨 **Beautiful syntax highlighting**
- 📱 **Responsive design**
- ⚡ **Fast rendering**
- 🔧 **Customizable themes**

## Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, Markdown!");
  return "Welcome!";
}
\`\`\`

## Lists

### Unordered List
- Item 1
- Item 2
- Item 3

### Ordered List
1. First item
2. Second item
3. Third item

## Tables

| Feature | Status | Description |
|---------|--------|-------------|
| Real-time | ✅ | Live preview as you type |
| Syntax Highlighting | ✅ | Beautiful code blocks |
| Responsive | ✅ | Works on all devices |
| Dark Mode | ✅ | Toggle between themes |

## Blockquotes

> This is a blockquote. It can contain multiple lines and is great for highlighting important information.

## Links and Images

[Visit our website](https://example.com)

![Markdown Logo](https://markdown-here.com/img/icon256.png)

---

*Happy writing!* 🚀`;

export default function Home() {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Convert markdown to HTML using backend API
  const convertMarkdown = useCallback(async (content: string) => {
    setIsLoading(true);
    try {
      await fetch("/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          theme: isDarkMode ? "dark" : "light",
        }),
      });
      // Không dùng response ở FE, chỉ để backend sẵn sàng cho SSR
    } catch (error) {
      console.error("Error converting markdown:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isDarkMode]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      convertMarkdown(markdown);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [markdown, isDarkMode, convertMarkdown]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const uploadMarkdown = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setMarkdown(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 ${isDarkMode ? "dark" : ""}`}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 w-full">
        <div className="flex justify-between items-center h-16 px-4 md:px-8 w-full">
          <div className="flex items-center space-x-3">
            <CodeIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Markdown Preview</h1>
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">Live</span>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center space-x-2">
              <SunIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                style={{ backgroundColor: isDarkMode ? "#3b82f6" : "#d1d5db" }}
                aria-label="Toggle dark mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
              <MoonIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Copy markdown"
            >
              {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
            <button
              onClick={downloadMarkdown}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Download markdown file"
            >
              <DownloadIcon className="h-4 w-4" />
              <span>Download</span>
            </button>
            <button
              onClick={() => document.getElementById("file-upload")?.click()}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Upload markdown file"
            >
              <UploadIcon className="h-4 w-4" />
              <span>Upload</span>
            </button>
            {/* Export Dropdown */}
            <ExportMenu
              markdown={markdown}
              previewRef={previewRef}
            />
            {/* GitHub icon link */}
            <a
              href="https://github.com/thinhpl/markdown-preview"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="View on GitHub"
            >
              <GithubIcon className="h-6 w-6 text-gray-700 dark:text-gray-200" />
            </a>
            <input
              id="file-upload"
              type="file"
              accept=".md,.markdown"
              onChange={uploadMarkdown}
              className="hidden"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col">
        <div className="flex flex-1 flex-col lg:flex-row w-full h-full min-h-[calc(100vh-4rem)]">
          {/* Editor Panel */}
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[400px] p-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-16 bg-white dark:bg-gray-800 z-10">
              <div className="flex items-center space-x-2">
                <CodeIcon className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editor</h2>
              </div>
            </div>
            <div className="flex-1 p-4 flex flex-col">
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Start writing your markdown here..."
                className="w-full flex-1 font-mono text-sm resize-none border-0 focus:ring-0 bg-transparent text-gray-900 dark:text-white min-h-[300px]"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              />
            </div>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 min-h-[400px] p-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-16 bg-white dark:bg-gray-800 z-10">
              <div className="flex items-center space-x-2">
                <EyeIcon className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preview</h2>
                {isLoading && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-500">Rendering...</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 p-4 flex flex-col overflow-x-auto">
              <div ref={previewRef} className="markdown prose prose-slate max-w-none dark:prose-invert w-full">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw, rehypeSanitize]}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
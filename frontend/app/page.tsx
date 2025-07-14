"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import {
  EyeIcon,
  CodeIcon,
  CopyIcon,
  CheckIcon,
  GithubIcon,
  Trash2Icon,
  Undo2Icon,
  Redo2Icon,
  Maximize2Icon,
  Minimize2Icon, // add this import
  UploadIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import React from "react";

import 'katex/dist/katex.min.css';

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
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [editorWidth, setEditorWidth] = useState(50); // percent
  const [dragging, setDragging] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const previewRefPanel = useRef<HTMLDivElement>(null);
  const dragPercent = useRef(editorWidth);
  const rafId = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  // Undo/Redo stack for editor
  const [history, setHistory] = useState<string[]>([defaultMarkdown]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [syncScroll, setSyncScroll] = useState(true);

  // Add refs for scroll sync
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const lastScrollTop = useRef(0);

  // Scroll sync effect
  useEffect(() => {
    if (!syncScroll || !textareaRef.current || !previewScrollRef.current) {
      return;
    }

    const textarea = textareaRef.current;
    const preview = previewScrollRef.current;

    const handleScroll = () => {
      if (isScrolling.current || !syncScroll) {
        return;
      }

      const currentScrollTop = textarea.scrollTop;
      if (currentScrollTop === lastScrollTop.current) {
        return;
      }

      // Calculate scroll ratio
      const textareaScrollRatio = currentScrollTop / (textarea.scrollHeight - textarea.clientHeight);

      // Apply scroll to preview
      const previewScrollTop = textareaScrollRatio * (preview.scrollHeight - preview.clientHeight);

      isScrolling.current = true;
      preview.scrollTop = previewScrollTop;
      lastScrollTop.current = currentScrollTop;

      // Reset flag after a short delay
      setTimeout(() => {
        isScrolling.current = false;
      }, 50);
    };

    textarea.addEventListener('scroll', handleScroll);

    return () => {
      textarea.removeEventListener('scroll', handleScroll);
    };
  }, [syncScroll]);

  // Control preview scroll behavior based on syncScroll state
  // (Remove logic that disables scroll)
  // useEffect(() => {
  //   if (!previewScrollRef.current) return;
  //   const preview = previewScrollRef.current;
  //   if (syncScroll) {
  //     preview.style.overflowY = 'hidden';
  //     preview.style.pointerEvents = 'none';
  //   } else {
  //     preview.style.overflowY = 'auto';
  //     preview.style.pointerEvents = 'auto';
  //   }
  // }, [syncScroll]);
  // Always allow preview to scroll
  useEffect(() => {
    if (!previewScrollRef.current) return;
    previewScrollRef.current.style.overflowY = 'auto';
    previewScrollRef.current.style.pointerEvents = 'auto';
  }, []);

  // Update history on markdown change
  useEffect(() => {
    if (markdown !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(markdown);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markdown]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setMarkdown(history[historyIndex - 1]);
    }
  };
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setMarkdown(history[historyIndex + 1]);
    }
  };
  const handleClear = () => {
    setMarkdown("");
  };
  const handleExpand = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  };

  // Exit fullscreen with Escape key
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  // Escape key exits preview fullscreen
  useEffect(() => {
    if (!isPreviewFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPreviewFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPreviewFullscreen]);

  // Ensure only one panel can be fullscreen at a time
  useEffect(() => {
    if (isFullscreen && isPreviewFullscreen) setIsPreviewFullscreen(false);
  }, [isFullscreen, isPreviewFullscreen]);
  useEffect(() => {
    if (isPreviewFullscreen && isFullscreen) setIsFullscreen(false);
  }, [isPreviewFullscreen, isFullscreen]);

  // Convert markdown to HTML using backend API
  const convertMarkdown = useCallback(async (content: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, theme: "light" }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.error) {
        setHtml(data.html || `<p style='color:red'>Error: ${data.error}</p>`);
      } else {
        setHtml(data.html || "<p style='color:red'>Error rendering markdown</p>");
      }
    } catch (error) {
      console.error("Error converting markdown:", error);
      setHtml(`<p style='color:red'>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce markdown changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      convertMarkdown(markdown);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [markdown, convertMarkdown]);

  // Handle drag events for splitter
  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById("split-container");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      let percent = ((e.clientX - rect.left) / rect.width) * 100;
      percent = Math.max(20, Math.min(80, percent));
      dragPercent.current = percent;
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        if (editorRef.current && previewRefPanel.current) {
          editorRef.current.style.width = `calc(${percent}% - 8px)`;
          previewRefPanel.current.style.width = `calc(${100 - percent}% - 8px)`;
        }
      });
    };
    const handleMouseUp = () => {
      setDragging(false);
      setEditorWidth(dragPercent.current);
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [dragging]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Khi mở file .md
  const uploadMarkdown = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (15MB limit)
      if (file.size > 15 * 1024 * 1024) {
        alert(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 15MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setMarkdown(content);
      };
      reader.readAsText(file);
    }
  };

  // Copy HTML (từ backend)
  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch (error) {
      console.error('Failed to copy HTML:', error);
    }
  };




  // --- Footer logic ---
  // Cursor position (Ln, Col)
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const handler = () => {
      const pos = textarea.selectionStart;
      const lines = textarea.value.substr(0, pos).split('\n');
      setCursor({ line: lines.length, col: lines[lines.length - 1].length + 1 });
    };
    textarea.addEventListener('keyup', handler);
    textarea.addEventListener('click', handler);
    textarea.addEventListener('select', handler);
    return () => {
      textarea.removeEventListener('keyup', handler);
      textarea.removeEventListener('click', handler);
      textarea.removeEventListener('select', handler);
    };
  }, [markdown]);

  // HTML stats (dựa trên html trả về)
  const htmlContent = previewRef.current?.innerText || '';
  const htmlChars = htmlContent.length;
  const htmlWords = htmlContent.trim().split(/\s+/).filter(Boolean).length;
  const htmlParagraphs = htmlContent.split(/\n{2,}/).filter(Boolean).length;

  return (
    <div className={`min-h-screen w-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100`} style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200 w-full flex-shrink-0">
        <div className="flex justify-between items-center h-16 px-4 md:px-8 w-full">
          <div className="flex items-center space-x-3">
            <CodeIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Markdown Preview</h1>
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">Live</span>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Removed dark mode toggle and icons */}
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Copy markdown"
            >
              {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
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
              className="ml-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="View on GitHub"
            >
              <GithubIcon className="h-6 w-6 text-gray-700" />
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
      <main className="flex-1 w-full flex flex-col overflow-hidden min-h-0">
        {isFullscreen ? (
          <div
            ref={editorRef}
            className="flex flex-col bg-white min-h-[400px] p-0 min-h-0 w-full h-full border-none z-50 fixed inset-0 bg-white"
            style={{ width: '100%', height: '100%', zIndex: 51, position: 'fixed', inset: 0, background: 'white' }}
          >
            {/* Toolbar/Header (not scrollable, not sticky) */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2">
                <CodeIcon className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Editor</h2>
              </div>
              <div className="flex items-center space-x-2 md:space-x-3">
                <label className="flex items-center space-x-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={syncScroll}
                    onChange={() => setSyncScroll((v: boolean) => !v)}
                    className="accent-blue-600 w-4 h-4 rounded focus:ring-2 focus:ring-blue-500"
                    disabled={isFullscreen}
                  />
                  <span className="text-xs text-gray-700 font-medium">Sync Scroll</span>
                </label>
                <button onClick={handleUndo} title="Undo" className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-40" disabled={historyIndex === 0 || isFullscreen}>
                  <Undo2Icon className="h-4 w-4" />
                </button>
                <button onClick={handleRedo} title="Redo" className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-40" disabled={historyIndex === history.length - 1 || isFullscreen}>
                  <Redo2Icon className="h-4 w-4" />
                </button>
                <button onClick={handleClear} title="Clear" className="p-2 rounded hover:bg-gray-200 transition-colors" disabled={isFullscreen}>
                  <Trash2Icon className="h-4 w-4" />
                </button>
                <button onClick={copyToClipboard} title="Copy" className="p-2 rounded hover:bg-gray-200 transition-colors" disabled={isFullscreen}>
                  {copied ? <CheckIcon className="h-4 w-4 text-green-600" /> : <CopyIcon className="h-4 w-4" />}
                </button>
                <button onClick={handleExpand} title={isFullscreen ? 'Exit Fullscreen' : 'Expand/Fullscreen'} className={`p-2 rounded transition-colors ${isFullscreen ? 'bg-green-100 border border-green-400' : 'hover:bg-gray-200'}`}>
                  {isFullscreen ? <Minimize2Icon className="h-4 w-4" /> : <Maximize2Icon className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {/* Scrollable content */}
            <div className="flex-1 min-h-0 flex flex-col overflow-y-auto border border-gray-200 rounded-none p-0">
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Start writing your markdown here..."
                className="flex-1 min-h-0 w-full font-mono text-sm resize-none border-0 focus:ring-0 bg-transparent text-gray-900 p-2"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              />
            </div>
            {/* Editor Footer in fullscreen mode */}
            <footer className="w-full h-7 min-h-[28px] flex items-center px-2 text-xs font-mono font-semibold justify-between" style={{ background: '#0078d4', color: '#fff', position: 'sticky', bottom: 0, left: 0, zIndex: 60, border: 'none' }}>
              <div className="flex items-center gap-2">
                <span>Markdown</span>
                <span>{markdown.length} bytes</span>
                <span>{markdown.trim().split(/\s+/).filter(Boolean).length} words</span>
                <span>{markdown.split(/\n/).length} lines</span>
                <span>Ln {cursor.line}, Col {cursor.col}</span>
              </div>
            </footer>
          </div>
        ) : isPreviewFullscreen ? (
          <div
            ref={previewRefPanel}
            className="flex flex-col bg-white min-h-[400px] p-0 min-h-0 w-full h-full border-none z-50 fixed inset-0 bg-white"
            style={{ width: '100%', height: '100%', zIndex: 51, position: 'fixed', inset: 0, background: 'white' }}
          >
            {/* Toolbar/Header (not scrollable, not sticky) */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2">
                <EyeIcon className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyHtml}
                  className="hover:text-blue-600 transition-colors relative no-border"
                  title="Copy as HTML"
                  aria-label="Copy as HTML"
                  style={{ outline: 'none', background: 'none', border: 'none', boxShadow: 'none', padding: 0, margin: 0, appearance: 'none', WebkitAppearance: 'none' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code" viewBox="0 0 24 24">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  {copiedHtml && (
                    <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow z-10 whitespace-nowrap">Copied!</span>
                  )}
                </button>
                <button
                  onClick={() => setIsPreviewFullscreen(false)}
                  title="Exit Fullscreen"
                  className="p-2 rounded bg-green-100 border border-green-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l6-6m0 0l-6-6m6 6H3" /></svg>
                </button>
                {isLoading && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-500">Rendering...</span>
                  </div>
                )}
              </div>
            </div>
            {/* Scrollable content */}
            <div ref={previewScrollRef} className="flex-1 min-h-0 overflow-y-auto">
              <div className="p-4">
                <div ref={previewRef} className="markdown prose prose-slate max-w-none w-full" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            </div>
          </div>
        ) : (
          <div
            id="split-container"
            className={`flex flex-1 flex-col lg:flex-row w-full h-full min-h-0${isFullscreen ? ' z-50 fixed inset-0 bg-white' : ''}`}
            style={isFullscreen ? { position: 'fixed', inset: 0, zIndex: 50, background: 'white' } : {}}
          >
            {/* Editor Panel */}
            <div
              ref={editorRef}
              className={`flex flex-col bg-white border-r border-gray-200 min-h-[400px] p-0 min-h-0 ${dragging ? '' : 'transition-all duration-150'}${isFullscreen ? ' w-full h-full border-none' : ''}`}
              style={isFullscreen ? { width: '100%', height: '100%', zIndex: 51 } : { width: dragging ? undefined : `calc(${editorWidth}% - 8px)`, minWidth: 0, willChange: 'width' }}
            >
              {/* Toolbar/Header (not scrollable, not sticky) */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <CodeIcon className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Editor</h2>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <label className="flex items-center space-x-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncScroll}
                      onChange={() => setSyncScroll((v: boolean) => !v)}
                      className="accent-blue-600 w-4 h-4 rounded focus:ring-2 focus:ring-blue-500"
                      disabled={isFullscreen}
                    />
                    <span className="text-xs text-gray-700 font-medium">Sync Scroll</span>
                  </label>
                  <button onClick={handleUndo} title="Undo" className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-40" disabled={historyIndex === 0 || isFullscreen}>
                    <Undo2Icon className="h-4 w-4" />
                  </button>
                  <button onClick={handleRedo} title="Redo" className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-40" disabled={historyIndex === history.length - 1 || isFullscreen}>
                    <Redo2Icon className="h-4 w-4" />
                  </button>
                  <button onClick={handleClear} title="Clear" className="p-2 rounded hover:bg-gray-200 transition-colors" disabled={isFullscreen}>
                    <Trash2Icon className="h-4 w-4" />
                  </button>
                  <button onClick={copyToClipboard} title="Copy" className="p-2 rounded hover:bg-gray-200 transition-colors" disabled={isFullscreen}>
                    {copied ? <CheckIcon className="h-4 w-4 text-green-600" /> : <CopyIcon className="h-4 w-4" />}
                  </button>
                  <button onClick={handleExpand} title={isFullscreen ? 'Exit Fullscreen' : 'Expand/Fullscreen'} className={`p-2 rounded transition-colors ${isFullscreen ? 'bg-green-100 border border-green-400' : 'hover:bg-gray-200'}`}>
                    {isFullscreen ? <Minimize2Icon className="h-4 w-4" /> : <Maximize2Icon className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {/* Scrollable content */}
              <div className="flex-1 min-h-0 flex flex-col overflow-y-auto border border-gray-200 rounded-none p-0">
                <textarea
                  ref={textareaRef}
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  placeholder="Start writing your markdown here..."
                  className="flex-1 min-h-0 w-full font-mono text-sm resize-none border-0 focus:ring-0 bg-transparent text-gray-900 p-2"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                />
              </div>
              {/* Editor Footer in fullscreen mode */}
              {isFullscreen && (
                <footer className="w-full h-7 min-h-[28px] flex items-center px-2 text-xs font-mono font-semibold justify-between" style={{ background: '#0078d4', color: '#fff', position: 'sticky', bottom: 0, left: 0, zIndex: 60, border: 'none' }}>
                  <div className="flex items-center gap-2">
                    <span>Markdown</span>
                    <span>{markdown.length} bytes</span>
                    <span>{markdown.trim().split(/\s+/).filter(Boolean).length} words</span>
                    <span>{markdown.split(/\n/).length} lines</span>
                    <span>Ln {cursor.line}, Col {cursor.col}</span>
                  </div>
                </footer>
              )}
            </div>

            {/* Splitter and Preview Panel: hide in fullscreen */}
            {!isPreviewFullscreen && <>
              <div
                className="hidden lg:flex items-center justify-center cursor-col-resize select-none w-2 bg-transparent hover:bg-blue-100 transition-colors"
                style={{ zIndex: 50, position: 'relative', minWidth: '8px', maxWidth: '8px', padding: 0 }}
                onMouseDown={e => {
                  e.preventDefault();
                  setDragging(true);
                }}
                aria-label="Resize editor/preview"
                role="separator"
                tabIndex={-1}
              >
                <div className="w-1 h-12 bg-gray-200 group-hover:bg-blue-300 transition-colors mx-auto" />
              </div>
              {/* Preview Panel */}
              <div
                ref={previewRefPanel}
                className={`flex flex-col bg-white min-h-[400px] p-0 min-h-0 ${dragging ? '' : 'transition-all duration-150'}${isPreviewFullscreen ? ' w-full h-full border-none z-50 fixed inset-0 bg-white' : ''}`}
                style={isPreviewFullscreen ? { width: '100%', height: '100%', zIndex: 51, position: 'fixed', inset: 0, background: 'white' } : { width: dragging ? undefined : `calc(${100 - editorWidth}% - 8px)`, minWidth: 0, willChange: 'width' }}
              >
                {/* Toolbar/Header (not scrollable, not sticky) */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <EyeIcon className="h-5 w-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopyHtml}
                      className={`p-2 rounded-md border border-gray-200 bg-white hover:bg-blue-50 transition-colors flex items-center justify-center relative`}
                      title="Copy as HTML"
                      aria-label="Copy as HTML"
                      style={{ outline: 'none' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code" viewBox="0 0 24 24">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                      {copiedHtml && (
                        <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow z-10 whitespace-nowrap">Copied!</span>
                      )}
                    </button>
                    <button
                      onClick={() => setIsPreviewFullscreen(v => !v)}
                      title={isPreviewFullscreen ? 'Exit Fullscreen' : 'Expand/Fullscreen'}
                      className={`p-2 rounded transition-colors ${isPreviewFullscreen ? 'bg-green-100 border border-green-400' : 'hover:bg-gray-200'}`}
                    >
                      {isPreviewFullscreen
                        ? <Minimize2Icon className="h-4 w-4" />
                        : <Maximize2Icon className="h-4 w-4" />}
                    </button>
                    {isLoading && (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-500">Rendering...</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Scrollable content */}
                <div ref={previewScrollRef} className="flex-1 min-h-0 overflow-y-auto">
                  <div className="p-4">
                    <div ref={previewRef} className="markdown prose prose-slate max-w-none w-full" dangerouslySetInnerHTML={{ __html: html }} />
                  </div>
                </div>
              </div>
            </>}
          </div>
        )}
      </main>

      {/* Footer VSCode style (hide in fullscreen) */}
      {!isFullscreen && (
        <footer className="w-full h-7 min-h-[28px] flex items-center px-2 text-xs font-mono font-semibold justify-between" style={{ background: '#0078d4', color: '#fff', position: 'sticky', bottom: 0, left: 0, zIndex: 20, border: 'none' }}>
          <div className="flex items-center gap-2">
            <span>Markdown</span>
            <span>{markdown.length} bytes</span>
            <span>{markdown.trim().split(/\s+/).filter(Boolean).length} words</span>
            <span>{markdown.split(/\n/).length} lines</span>
            <span>Ln {cursor.line}, Col {cursor.col}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>HTML</span>
            <span>{htmlChars} characters</span>
            <span>{htmlWords} words</span>
            <span>{htmlParagraphs} paragraphs</span>
          </div>
        </footer>
      )}
      {/* Toast notification for HTML copied */}
      {copiedHtml && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center px-4 py-2 rounded-lg shadow-lg bg-neutral-900 text-white text-base font-medium animate-fade-in-out" style={{ minWidth: 240 }}>
          <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
          HTML copied to clipboard
        </div>
      )}
    </div>
  );
} 
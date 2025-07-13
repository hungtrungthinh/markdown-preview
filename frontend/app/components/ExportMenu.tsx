"use client"

import { useState } from "react";
import { Menu } from "@headlessui/react";
import { FileDownIcon } from "lucide-react";

interface ExportMenuProps {
    markdown: string;
    previewRef: React.RefObject<HTMLDivElement>;
}

export default function ExportMenu({ markdown, previewRef }: ExportMenuProps) {
    const [isExporting, setIsExporting] = useState(false);

    // Export PDF using html2pdf.js
    const exportPDF = async () => {
        if (!previewRef.current) return;
        setIsExporting(true);
        try {
            const html2pdf = (await import("html2pdf.js")).default;
            const opt = {
                margin: 0.5,
                filename: "markdown-preview.pdf",
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
            };
            await html2pdf().set(opt).from(previewRef.current).save();
        } catch (error) {
            console.error("Error exporting PDF:", error);
        } finally {
            setIsExporting(false);
        }
    };

    // Export Word using docx
    const exportWord = async () => {
        setIsExporting(true);
        try {
            const { Document, Packer, Paragraph } = await import("docx");
            // Convert markdown to plain text paragraphs (simple, for demo)
            const lines = markdown.split("\n");
            const doc = new Document({
                sections: [
                    {
                        properties: {},
                        children: lines.map(
                            (line: string) =>
                                new Paragraph({
                                    text: line,
                                })
                        ),
                    },
                ],
            });
            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "markdown-preview.docx";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting Word:", error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-blue-400 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <FileDownIcon className="h-4 w-4" />
                <span>{isExporting ? "Exporting..." : "Export"}</span>
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg focus:outline-none z-50">
                <div className="py-1">
                    <Menu.Item>
                        {({ active }) => (
                            <button
                                onClick={exportPDF}
                                disabled={isExporting}
                                className={`${active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                                    } group flex w-full items-center px-4 py-2 text-sm disabled:opacity-50`}
                            >
                                Export as PDF
                            </button>
                        )}
                    </Menu.Item>
                    <Menu.Item>
                        {({ active }) => (
                            <button
                                onClick={exportWord}
                                disabled={isExporting}
                                className={`${active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                                    } group flex w-full items-center px-4 py-2 text-sm disabled:opacity-50`}
                            >
                                Export as Word
                            </button>
                        )}
                    </Menu.Item>
                </div>
            </Menu.Items>
        </Menu>
    );
} 
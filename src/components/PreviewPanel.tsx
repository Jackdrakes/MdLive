"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { PreviewPanelProps } from "@/types";

export function PreviewPanel({ markdown }: PreviewPanelProps) {
  return (
    <div className="h-full w-full overflow-auto bg-background-secondary p-6">
      <div className="markdown-preview">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
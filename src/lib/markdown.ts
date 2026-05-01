export function countWords(text: string): number {
  if (!text || text.trim() === "") return 0;
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
}

export function countCharacters(text: string): number {
  return text.length;
}

export function generateHtmlFromMarkdown(markdown: string): string {
  let html = markdown
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/~~(.*?)~~/g, "<del>$1</del>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^\- (.*$)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/^\> (.*$)/gm, "<blockquote>$1</blockquote>")
    .replace(/\n/g, "<br>");

  return html;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAsHtml(markdown: string, filename: string): void {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename.replace('.md', '')}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    pre { background: #f4f4f4; padding: 1rem; overflow-x: auto; }
    code { background: #f4f4f4; padding: 0.2rem 0.4rem; }
    blockquote { border-left: 4px solid #ccc; padding-left: 1rem; color: #666; }
  </style>
</head>
<body>
${generateHtmlFromMarkdown(markdown)}
</body>
</html>`;

  downloadFile(htmlContent, filename.replace(".md", ".html"), "text/html");
}
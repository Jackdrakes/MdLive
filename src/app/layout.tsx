import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "MdLive",
  description: "A markdown editor with live preview and two-way file sync",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background-primary text-text-primary antialiased">
        {children}
        <Toaster position="top-right" theme="dark" />
      </body>
    </html>
  );
}
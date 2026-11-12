import type { Metadata, Viewport } from "next";

import { AppShell } from "@/components/app-shell";
import { APPEARANCE_SCRIPT } from "@/lib/appearance";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TechOpps", template: "%s · TechOpps" },
  description: "Collect, organize and track technology opportunities from sources you choose.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f4f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1113" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme is a server default; the inline script replaces it with the stored or system
    // appearance before the first paint, so React must accept the DOM's attributes.
    <html lang="en" data-theme="light" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orbit Dock",
  description: "Issue tracking application",
  openGraph: {
    title: "Orbit Dock",
    description: "Issue tracking application",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orbit Dock",
    description: "Issue tracking application",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}

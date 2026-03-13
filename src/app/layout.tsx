import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import AppLayout from "@/layouts/AppLayout";

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
        <div id="root">
          <Providers>
            <AppLayout>
              {children}
            </AppLayout>
          </Providers>
        </div>
      </body>
    </html>
  );
}

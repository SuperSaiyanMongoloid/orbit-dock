"use client";

import dynamic from "next/dynamic";

// Dynamically import the App with SSR disabled for client-only SPA behavior
const App = dynamic(() => import("@/App"), { ssr: false });

export function ClientApp() {
  return <App />;
}

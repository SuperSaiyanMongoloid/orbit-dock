import { ClientApp } from "./client";

// Generate static params for static export
export function generateStaticParams() {
  return [{ slug: [] }];
}

export default function Page() {
  return <ClientApp />;
}

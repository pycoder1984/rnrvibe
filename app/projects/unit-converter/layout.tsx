import { buildProjectMetadata, buildProjectJsonLd } from "@/lib/project-metadata";

export const metadata = buildProjectMetadata("unit-converter");

export default function Layout({ children }: { children: React.ReactNode }) {
  const { appSchema, breadcrumb } = buildProjectJsonLd("unit-converter");
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  );
}

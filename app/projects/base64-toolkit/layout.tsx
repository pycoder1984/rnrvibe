import { buildProjectMetadata, buildProjectJsonLd } from "@/lib/project-metadata";

export const metadata = buildProjectMetadata("base64-toolkit");

export default function Layout({ children }: { children: React.ReactNode }) {
  const { appSchema, breadcrumb } = buildProjectJsonLd("base64-toolkit");
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  );
}

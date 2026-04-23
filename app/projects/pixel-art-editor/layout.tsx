import { buildProjectMetadata, buildProjectJsonLd } from "@/lib/project-metadata";

export const metadata = buildProjectMetadata("pixel-art-editor");

export default function Layout({ children }: { children: React.ReactNode }) {
  const { appSchema, breadcrumb } = buildProjectJsonLd("pixel-art-editor");
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  );
}

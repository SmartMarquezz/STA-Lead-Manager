"use client";

import { PageHero } from "@/components/PageHero";
import { ImportWizard } from "@/components/ImportWizard";

export default function ImportPage() {
  return (
    <>
      <PageHero
        eyebrow="Data Import"
        title="Import"
        titleAccent="Leads"
        subtitle="Upload a CSV or Excel file to import leads into your pipeline."
        compact
      />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <ImportWizard />
      </div>
    </>
  );
}

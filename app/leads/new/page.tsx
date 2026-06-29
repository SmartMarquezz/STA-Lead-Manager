"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { LeadForm } from "@/components/LeadForm";
import { Card, CardContent } from "@/components/ui/card";

export default function NewLeadPage() {
  const router = useRouter();

  return (
    <>
      <PageHero
        eyebrow="Pipeline Management"
        title="Add New"
        titleAccent="Lead"
        subtitle={
          <>
            Or{" "}
            <Link href="/import" className="font-semibold text-sta-cyan underline hover:text-white">
              import from CSV or Excel
            </Link>
          </>
        }
        compact
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Card>
          <CardContent className="p-6">
            <LeadForm onSuccess={(id) => router.push(`/leads/${id}`)} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

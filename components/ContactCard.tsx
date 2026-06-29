"use client";

import { Contact } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Mail, Copy, User } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { useState } from "react";

interface ContactCardProps {
  title: string;
  contact?: Contact;
}

export function ContactCard({ title, contact }: ContactCardProps) {
  const [copied, setCopied] = useState(false);

  if (!contact?.name && !contact?.email) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 p-4">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-1 text-sm text-slate-400">No contact info</p>
      </div>
    );
  }

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-2 flex items-start gap-2">
        <User className="mt-0.5 h-4 w-4 text-slate-400" />
        <div className="flex-1">
          <p className="font-medium text-slate-900">{contact.name || "—"}</p>
          {contact.email && (
            <div className="mt-1 flex items-center gap-2">
              <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline">
                {contact.email}
              </a>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleCopy(contact.email)}>
                <Copy className="h-3.5 w-3.5" />
                {copied ? " Copied!" : ""}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                <a href={`mailto:${contact.email}`}>
                  <Mail className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

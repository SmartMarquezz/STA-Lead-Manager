"use client";

import { useEffect, useState } from "react";
import { Lead, Contact, FollowUpPriority } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { getFirebaseAuth } from "@/lib/firebase";
import { getValidHubSpotToken } from "@/lib/hubspot-client";
import { RefreshCw, Send, Mail, AlertCircle } from "lucide-react";

interface FollowUpEmailModalProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
}

export function FollowUpEmailModal({ lead, open, onClose }: FollowUpEmailModalProps) {
  const { user, isDemo } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [provider, setProvider] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!open || !lead || !user || isDemo) return;

    async function loadContacts() {
      setLoadingContacts(true);
      setError("");
      setSuccess("");
      setSubject("");
      setBody("");
      setSelectedEmail("");

      try {
        const auth = getFirebaseAuth();
        const idToken = await auth?.currentUser?.getIdToken();
        if (!idToken) throw new Error("Not signed in");

        const accessToken = user ? await getValidHubSpotToken(user.uid, idToken) : null;

        const res = await fetch("/api/hubspot/contacts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accessToken: accessToken || undefined, lead }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setContacts(data.contacts || []);
        if (data.contacts?.[0]?.email) {
          setSelectedEmail(data.contacts[0].email);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load contacts");
      } finally {
        setLoadingContacts(false);
      }
    }

    loadContacts();
  }, [open, lead, user, isDemo]);

  const selectedContact = contacts.find((c) => c.email === selectedEmail);

  const handleGenerate = async () => {
    if (!lead || !selectedContact) return;
    setGenerating(true);
    setError("");
    try {
      const auth = getFirebaseAuth();
      const idToken = await auth?.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in");

      const res = await fetch("/api/hubspot/generate-email", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactName: selectedContact.name,
          contactEmail: selectedContact.email,
          companyName: lead.companyName,
          followUpPriority: (lead.followUpPriority || "Not Started") as FollowUpPriority,
          owner: lead.owner,
          amount2026: lead.amount2026,
          internalNotes: lead.internalNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSubject(data.subject);
      setBody(data.body);
      setProvider(data.provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate email");
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!user || !selectedContact || !subject || !body) return;
    setSending(true);
    setError("");
    try {
      const auth = getFirebaseAuth();
      const idToken = await auth?.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in");

      const accessToken = await getValidHubSpotToken(user.uid, idToken);
      if (!accessToken) {
        throw new Error("Connect HubSpot first to send emails.");
      }

      const res = await fetch("/api/hubspot/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          contactEmail: selectedContact.email,
          subject,
          body,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(data.message || "Email sent!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sta-navy">
            <Mail className="h-5 w-5 text-sta-cyan" />
            Follow Up — {lead.companyName}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-sta-teal">
          Status: <strong className="text-sta-navy">{lead.followUpPriority || lead.status}</strong>
          {lead.owner && (
            <>
              {" "}
              · Owner: <strong>{lead.owner}</strong>
            </>
          )}
        </p>

        {loadingContacts ? (
          <div className="flex items-center gap-2 py-8 text-sta-teal">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading contacts from spreadsheet & HubSpot...
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex items-start gap-3 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">No contacts for this lead</p>
              <p className="mt-1">
                There are no contacts in HubSpot or the spreadsheet for {lead.companyName}. Add
                contacts in the Excel file or HubSpot, then re-sync.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-sta-navy">Send to</Label>
              <div className="mt-2 space-y-2">
                {contacts.map((c) => (
                  <label
                    key={c.email}
                    className={`flex cursor-pointer items-center gap-3 rounded border p-3 ${
                      selectedEmail === c.email
                        ? "border-sta-cyan bg-[#E8F4FA]"
                        : "border-[#D8E8F2] bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="contact"
                      checked={selectedEmail === c.email}
                      onChange={() => setSelectedEmail(c.email)}
                      className="accent-sta-cyan"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sta-navy">{c.name}</p>
                      <p className="truncate text-sm text-sta-teal">{c.email}</p>
                      {c.title && <p className="text-xs text-sta-teal">{c.title}</p>}
                    </div>
                    <span className="text-xs uppercase tracking-wider text-sta-teal">
                      {c.source === "hubspot" ? "HubSpot" : "Sheet"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleGenerate} disabled={!selectedContact || generating}>
                {generating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Email Preview"
                )}
              </Button>
              {provider && (
                <span className="self-center text-xs text-sta-teal">via {provider}</span>
              )}
            </div>

            {subject && (
              <div className="space-y-3 rounded border border-[#D8E8F2] bg-[#F4F8FB] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-sta-teal">
                  Email Preview
                </p>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="body">Message</Label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={10}
                    className="mt-1 font-mono text-sm"
                  />
                </div>
                <Button
                  className="sta-btn-primary w-full"
                  onClick={handleSend}
                  disabled={sending || isDemo}
                >
                  {sending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Follow Up via HubSpot
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm font-medium text-green-700">{success}</p>}

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  Building,
  Calendar,
  Send,
  Save,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RotateCw,
} from "lucide-react";
import {
  getAdminInquiry,
  updateInquiry,
  resendInquiryNotification,
} from "@/lib/admin/inquiries.functions";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type InquiryRow = Database["public"]["Tables"]["project_inquiries"]["Row"];

export const Route = createFileRoute("/admin/inquiries/$id")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Review Inquiry — Volka Admin" },
    ],
  }),
  component: AdminInquiryDetailPage,
});

function AdminInquiryDetailPage() {
  const { id } = Route.useParams();
  const [inquiry, setInquiry] = React.useState<InquiryRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState<string>("new");
  const [internalNotes, setInternalNotes] = React.useState<string>("");
  const [savingNotes, setSavingNotes] = React.useState(false);
  const [resendingMail, setResendingMail] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await getAdminInquiry({ data: { id } });
        if (mounted && data) {
          setInquiry(data);
          setStatus(data.status);
          setInternalNotes(data.internal_notes || "");

          // If inquiry was 'new', automatically mark as 'read'
          if (data.status === "new") {
            updateInquiry({ data: { id, status: "read" } })
              .then((updated) => {
                if (mounted) {
                  setInquiry(updated);
                  setStatus("read");
                }
              })
              .catch(() => {});
          }
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load inquiry");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      const updated = await updateInquiry({
        data: {
          id,
          status: newStatus as "new" | "read" | "replied" | "won" | "lost" | "spam",
        },
      });
      setInquiry(updated);
      setFeedback(`Status updated to "${newStatus}"`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const updated = await updateInquiry({
        data: {
          id,
          internal_notes: internalNotes,
        },
      });
      setInquiry(updated);
      setFeedback("Internal notes saved successfully.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleResendNotification = async () => {
    setResendingMail(true);
    setError(null);
    try {
      const res = await resendInquiryNotification({ data: { id } });
      if (res.notified) {
        setFeedback("Internal notification email resent successfully!");
      } else {
        setError(`Email notification failed: ${res.errors.join("; ")}`);
      }
      // Reload inquiry state
      const reloaded = await getAdminInquiry({ data: { id } });
      setInquiry(reloaded);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Resend failed");
    } finally {
      setResendingMail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-xs text-muted-foreground">
        Loading inquiry details...
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground">
        Inquiry not found.
      </div>
    );
  }

  const cleanPhone = inquiry.phone?.replace(/[^0-9+]/g, "") || "";
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.replace(/^\+/, "")}?text=${encodeURIComponent(
        `Bonjour ${inquiry.name}, nous avons bien reçu votre brief pour Volka Studio.`,
      )}`
    : null;

  const mailtoUrl = `mailto:${inquiry.email}?subject=${encodeURIComponent(
    `Volka Studio — Suite à votre brief (${inquiry.offer})`,
  )}`;

  return (
    <div className="p-6 md:p-10 lg:p-12">
      {/* Top Bar Navigation */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/inquiries"
            className="rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-medium sm:text-3xl">
                {inquiry.name}
              </h1>
              {inquiry.company && (
                <span className="text-sm text-muted-foreground">
                  ({inquiry.company})
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Submitted on{" "}
              {new Date(inquiry.created_at).toLocaleString("fr-FR", {
                dateStyle: "long",
                timeStyle: "short",
              })}{" "}
              · Locale: {inquiry.locale?.toUpperCase() || "FR"}
            </p>
          </div>
        </div>

        {/* Quick Contact Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={mailtoUrl}
            className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-2 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <Mail className="size-3.5 text-gold" />
            <span>Email Reply</span>
          </a>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3.5 py-2 text-xs font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:border-gold hover:text-gold"
            >
              <MessageSquare className="size-3.5 text-green-500" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      {feedback && (
        <div className="mt-6 flex items-center gap-3 rounded border border-green-500/30 bg-green-500/10 p-4 text-xs text-green-700 dark:text-green-400">
          <CheckCircle className="size-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: The Brief */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section: Ambition & Vision */}
          <div className="rounded-sm border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="font-display text-lg font-medium border-b border-border pb-3">
              01 Ambition & Vision
            </h2>
            <div className="space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gold">
                What they are building & 1-year goal
              </span>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {inquiry.vision}
              </p>
            </div>

            {inquiry.challenge && (
              <div className="space-y-1 pt-4 border-t border-border">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Current friction or bottleneck
                </span>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {inquiry.challenge}
                </p>
              </div>
            )}
          </div>

          {/* Section: Project Scope & Specs */}
          <div className="rounded-sm border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="font-display text-lg font-medium border-b border-border pb-3">
              02 Project Scope & Fit
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Offer / Engagement
                </span>
                <p className="mt-1 font-display text-base font-medium">{inquiry.offer}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Target Timeline
                </span>
                <p className="mt-1 font-display text-base font-medium">{inquiry.timeline}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Budget Envelope
                </span>
                <p className="mt-1 font-display text-base font-medium text-gold">
                  {inquiry.budget_range}
                </p>
              </div>
            </div>

            {inquiry.referral_source && (
              <div className="pt-3 border-t border-border">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Referral Source
                </span>
                <p className="mt-1 text-xs text-foreground/80">{inquiry.referral_source}</p>
              </div>
            )}
          </div>

          {/* Section: Internal Studio Notes */}
          <div className="rounded-sm border border-border bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-display text-lg font-medium">Internal Notes</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={savingNotes}
                onClick={handleSaveNotes}
                className="text-xs uppercase tracking-wider"
              >
                <Save className="size-3.5 mr-1" />
                {savingNotes ? "Saving..." : "Save Notes"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Private notes visible only to studio administrators. Keep track of calls, discovery notes, and pricing decisions.
            </p>
            <Textarea
              rows={5}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Record initial impression, qualification notes, or next follow-up date..."
              className="text-sm font-sans"
            />
          </div>
        </div>

        {/* Right 1 Col: Client Contact & Triage Status */}
        <div className="space-y-6">
          {/* Triage Status Card */}
          <div className="rounded-sm border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="font-display text-lg font-medium border-b border-border pb-3">
              Triage Status
            </h2>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Pipeline Stage
              </span>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full rounded-sm border border-border bg-card p-2.5 text-xs font-medium uppercase tracking-wider"
              >
                <option value="new">New / Unread</option>
                <option value="read">Read / In Review</option>
                <option value="replied">Replied</option>
                <option value="won">Won (Deal Closed)</option>
                <option value="lost">Lost / Declined</option>
                <option value="spam">Spam / Bot</option>
              </select>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Preferred Channel
              </span>
              <p className="text-xs font-medium capitalize text-foreground">
                {inquiry.preferred_channel}
              </p>
            </div>
          </div>

          {/* Client Details Card */}
          <div className="rounded-sm border border-border bg-card p-6 shadow-sm space-y-3">
            <h2 className="font-display text-lg font-medium border-b border-border pb-3">
              Contact Information
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-foreground">
                <Mail className="size-4 text-muted-foreground" />
                <a href={mailtoUrl} className="hover:text-gold hover:underline">
                  {inquiry.email}
                </a>
              </div>

              {inquiry.phone && (
                <div className="flex items-center gap-2 text-foreground">
                  <Phone className="size-4 text-muted-foreground" />
                  <a href={`tel:${inquiry.phone}`} className="hover:text-gold hover:underline">
                    {inquiry.phone}
                  </a>
                </div>
              )}

              {inquiry.company && (
                <div className="flex items-center gap-2 text-foreground">
                  <Building className="size-4 text-muted-foreground" />
                  <span>{inquiry.company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Email Notification Status */}
          <div className="rounded-sm border border-border bg-card p-6 shadow-sm space-y-3">
            <h2 className="font-display text-lg font-medium border-b border-border pb-3">
              Notification Status
            </h2>

            <div className="text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Studio Notified:</span>
                <span className="font-medium">
                  {inquiry.notified_at ? (
                    <span className="text-green-600 dark:text-green-400">Sent</span>
                  ) : (
                    <span className="text-destructive">Pending / Failed</span>
                  )}
                </span>
              </div>

              {inquiry.notified_at && (
                <div className="text-[10px] text-muted-foreground">
                  {new Date(inquiry.notified_at).toLocaleString("fr-FR")}
                </div>
              )}

              {inquiry.notify_error && (
                <div className="rounded bg-destructive/10 p-2 text-[11px] text-destructive">
                  Error: {inquiry.notify_error}
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={resendingMail}
                  onClick={handleResendNotification}
                  className="w-full text-xs"
                >
                  <RotateCw className={`size-3 mr-1.5 ${resendingMail ? "animate-spin" : ""}`} />
                  {resendingMail ? "Sending..." : "Resend Email Notification"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

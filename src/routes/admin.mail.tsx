import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Paperclip,
  RefreshCw,
  Reply,
  Search,
  Send,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import {
  getMailMessage,
  listMailInbox,
  replyToMail,
  setMailSeen,
  type LinkedBrief,
  type MailListEntry,
  type MailMessageResult,
} from "@/lib/admin/mail.functions";

type SearchParams = { uid?: number; q?: string };

export const Route = createFileRoute("/admin/mail")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const uid = Number(search["uid"]);
    const q = typeof search["q"] === "string" ? search["q"].trim().slice(0, 120) : "";
    return {
      ...(Number.isInteger(uid) && uid > 0 ? { uid } : {}),
      ...(q ? { q } : {}),
    };
  },
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Messagerie — Volka Admin" },
    ],
  }),
  component: AdminMailPage,
});

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  new: "Nouveau",
  read: "Lu",
  replied: "Répondu",
  won: "Gagné",
  lost: "Perdu",
  spam: "Spam",
};

const STATUS_STYLE: Record<string, string> = {
  new: "bg-gold/20 text-gold border-gold/40",
  replied: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  won: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  spam: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusStyle = (status: string) => STATUS_STYLE[status] ?? "bg-muted text-muted-foreground border-border";

function formatListDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString("fr-FR", sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "2-digit" });
}

const displayName = (a: { name: string; address: string }) => a.name || a.address || "Expéditeur inconnu";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

// ─── Page ───────────────────────────────────────────────────────────────────

function AdminMailPage() {
  const { uid, q } = Route.useSearch();

  const [items, setItems] = React.useState<MailListEntry[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [mailbox, setMailbox] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<{ text: string; configured: boolean } | null>(null);
  // `q` lets a brief open the mailbox already filtered on that person's address.
  const [searchTerm, setSearchTerm] = React.useState(q ?? "");
  const [search, setSearch] = React.useState(q ?? "");
  const [unreadOnly, setUnreadOnly] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchTerm.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadList = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await listMailInbox({ data: { page, search, unreadOnly } });
      if (res.ok) {
        setItems(res.items);
        setTotal(res.total);
        setPageSize(res.pageSize);
        setMailbox(res.mailbox);
        setError(null);
      } else {
        setError({ text: res.error, configured: res.configured });
      }
    } catch (err) {
      setError({ text: err instanceof Error ? err.message : "Chargement impossible.", configured: true });
    } finally {
      setLoading(false);
    }
  }, [page, search, unreadOnly]);

  React.useEffect(() => {
    void loadList();
  }, [loadList]);

  const markLocalSeen = React.useCallback((messageUid: number, seen: boolean) => {
    setItems((prev) => prev.map((i) => (i.uid === messageUid ? { ...i, seen } : i)));
    window.dispatchEvent(new Event("volka:mail-changed"));
  }, []);

  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-4 sm:p-6 md:p-10 lg:p-12">
      {/* On a phone, the list and the message take turns: one is shown, never both. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        <section className={uid ? "hidden lg:block" : "block"} aria-label="Boîte de réception">
          <div className="mb-4 flex items-end justify-between gap-3 border-b border-border pb-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">Messagerie</p>
              <h1 className="mt-1 font-display text-3xl font-light sm:text-4xl">Boîte de réception</h1>
              {mailbox && <p className="mt-1 truncate text-xs text-muted-foreground">{mailbox}</p>}
            </div>
            <button
              type="button"
              onClick={() => void loadList()}
              disabled={loading}
              aria-label="Actualiser"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {error ? (
            <MailProblem text={error.text} configured={error.configured} />
          ) : (
            <>
              <div className="mb-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un nom, une adresse, un sujet"
                    className="h-11 w-full rounded-sm border border-border bg-card pl-9 pr-3 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="flex gap-1.5">
                  {[
                    { label: "Tout", value: false },
                    { label: "Non lus", value: true },
                  ].map((f) => (
                    <button
                      key={f.label}
                      type="button"
                      onClick={() => {
                        setUnreadOnly(f.value);
                        setPage(1);
                      }}
                      className={`h-10 rounded-sm px-4 text-xs font-medium uppercase tracking-[0.14em] transition-colors ${
                        unreadOnly === f.value
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-sm border border-border bg-card">
                {loading && items.length === 0 ? (
                  <p className="flex items-center justify-center gap-2 p-10 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Chargement des messages…
                  </p>
                ) : items.length === 0 ? (
                  <p className="flex flex-col items-center gap-2 p-10 text-center text-xs text-muted-foreground">
                    <Inbox className="size-6" />
                    {search || unreadOnly ? "Aucun message ne correspond." : "La boîte de réception est vide."}
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {items.map((item) => (
                      <li key={item.uid}>
                        <MailRow item={item} active={item.uid === uid} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {total > pageSize && (
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => p - 1)}
                    className="inline-flex h-11 items-center gap-1 rounded-sm border border-border bg-card px-4 disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" /> Plus récents
                  </button>
                  <span>
                    {page} / {lastPage}
                  </span>
                  <button
                    type="button"
                    disabled={page >= lastPage || loading}
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex h-11 items-center gap-1 rounded-sm border border-border bg-card px-4 disabled:opacity-40"
                  >
                    Plus anciens <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <section className={uid ? "block" : "hidden lg:block"} aria-label="Message">
          {uid ? (
            <MessageView key={uid} uid={uid} onSeenChange={markLocalSeen} />
          ) : (
            <div className="hidden min-h-64 flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border p-10 text-center text-xs text-muted-foreground lg:flex">
              <MailOpen className="size-6" />
              Sélectionnez un message pour le lire, avec le brief de la personne à côté.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ─── List row ───────────────────────────────────────────────────────────────

function MailRow({ item, active }: { item: MailListEntry; active: boolean }) {
  return (
    <Link
      to="/admin/mail"
      search={{ uid: item.uid }}
      className={`block px-4 py-3.5 transition-colors hover:bg-muted/30 ${active ? "bg-muted/50" : ""}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          {!item.seen && <span aria-label="Non lu" className="size-2 shrink-0 rounded-full bg-gold" />}
          <span className={`truncate text-sm ${item.seen ? "text-foreground/80" : "font-semibold text-foreground"}`}>
            {displayName(item.contact)}
          </span>
        </span>
        <span className="shrink-0 text-[11px] text-muted-foreground">{formatListDate(item.date)}</span>
      </div>
      <p className={`mt-0.5 truncate text-xs ${item.seen ? "text-muted-foreground" : "font-medium text-foreground"}`}>
        {item.subject || "(sans objet)"}
      </p>
      {item.brief && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gold">
          <UserRound className="size-3 shrink-0" />
          <span className="truncate">
            Brief · {item.brief.offer} · {STATUS_LABEL[item.brief.status] ?? item.brief.status}
          </span>
        </p>
      )}
    </Link>
  );
}

// ─── Problem states ─────────────────────────────────────────────────────────

function MailProblem({ text, configured }: { text: string; configured: boolean }) {
  return (
    <div className="space-y-3 rounded-sm border border-border bg-card p-5 text-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <p className="text-foreground">{text}</p>
      </div>
      {!configured && (
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>Pour connecter la boîte hello@, ajoutez ces variables dans Vercel (Settings → Environment Variables) puis redéployez :</p>
          <pre className="overflow-x-auto rounded-sm bg-muted p-3 text-[11px] leading-relaxed text-foreground">
            {`IMAP_HOST=imap.hostinger.com
IMAP_PORT=993
IMAP_USER=hello@votre-domaine.com
IMAP_PASS=mot de passe de la boîte`}
          </pre>
          <p>Si SMTP_USER et SMTP_PASS sont déjà renseignés, ils sont utilisés par défaut : seul un redéploiement est alors nécessaire.</p>
        </div>
      )}
    </div>
  );
}

// ─── One message ────────────────────────────────────────────────────────────

function MessageView({
  uid,
  onSeenChange,
}: {
  uid: number;
  onSeenChange: (uid: number, seen: boolean) => void;
}) {
  const [result, setResult] = React.useState<MailMessageResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [allowImages, setAllowImages] = React.useState(false);
  const [replying, setReplying] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMailMessage({ data: { uid } })
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        if (res.ok) onSeenChange(uid, true);
      })
      .catch((err: unknown) => {
        if (!cancelled) setResult({ ok: false, error: err instanceof Error ? err.message : "Chargement impossible." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, onSeenChange]);

  const back = (
    <Link
      to="/admin/mail"
      search={{}}
      className="inline-flex h-11 items-center gap-2 rounded-sm border border-border bg-card px-4 text-xs font-medium uppercase tracking-[0.14em] text-foreground hover:border-gold hover:text-gold lg:hidden"
    >
      <ArrowLeft className="size-4" /> Boîte de réception
    </Link>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {back}
        <p className="flex items-center justify-center gap-2 rounded-sm border border-border bg-card p-12 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Ouverture du message…
        </p>
      </div>
    );
  }

  if (!result || !result.ok) {
    return (
      <div className="space-y-4">
        {back}
        <MailProblem text={result?.error ?? "Message introuvable."} configured />
      </div>
    );
  }

  const { message, briefs } = result;
  const hasRemoteImages =
    !!message.html && (/<img[^>]+src=["']?https?:/i.test(message.html) || /url\(\s*["']?https?:/i.test(message.html));

  return (
    <article className="space-y-4">
      {back}

      <header className="rounded-sm border border-border bg-card p-4 sm:p-6">
        <h2 className="break-words font-display text-xl font-medium sm:text-2xl">
          {message.subject || "(sans objet)"}
        </h2>
        <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
          <div className="flex gap-2">
            <dt className="w-8 shrink-0">De</dt>
            <dd className="min-w-0 break-all text-foreground">
              {message.from.name ? `${message.from.name} <${message.from.address}>` : message.from.address}
            </dd>
          </div>
          {message.contact.address !== message.from.address && (
            <div className="flex gap-2">
              <dt className="w-8 shrink-0">Pour</dt>
              <dd className="min-w-0 break-all text-foreground">Répondre à {message.contact.address}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="w-8 shrink-0">Le</dt>
            <dd>
              {message.date
                ? new Date(message.date).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })
                : "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setReplying(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-primary px-5 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground hover:opacity-90"
          >
            <Reply className="size-4 text-gold" /> Répondre
          </button>
          <button
            type="button"
            onClick={async () => {
              const res = await setMailSeen({ data: { uid, seen: false } });
              if (res.ok) onSeenChange(uid, false);
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-border bg-card px-5 text-xs font-medium uppercase tracking-[0.14em] text-foreground hover:border-gold hover:text-gold"
          >
            <Mail className="size-4" /> Marquer non lu
          </button>
        </div>
      </header>

      <BriefPanel briefs={briefs} contact={message.contact.address} />

      <div className="overflow-hidden rounded-sm border border-border bg-card">
        {hasRemoteImages && !allowImages && (
          <div className="flex flex-col gap-2 border-b border-border bg-muted/40 p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <ShieldAlert className="size-4 shrink-0" /> Les images distantes sont bloquées pour votre confidentialité.
            </span>
            <button
              type="button"
              onClick={() => setAllowImages(true)}
              className="h-10 shrink-0 rounded-sm border border-border bg-card px-4 font-medium uppercase tracking-[0.14em] text-foreground hover:border-gold hover:text-gold"
            >
              Afficher les images
            </button>
          </div>
        )}
        {message.html ? (
          <EmailFrame html={message.html} allowImages={allowImages} />
        ) : (
          <pre className="whitespace-pre-wrap break-words p-4 font-sans text-sm leading-relaxed text-foreground sm:p-6">
            {message.text || "(message vide)"}
          </pre>
        )}
        {message.attachments.length > 0 && (
          <ul className="space-y-1 border-t border-border p-4 text-xs text-muted-foreground">
            {message.attachments.map((a, i) => (
              <li key={`${a.filename}-${i}`} className="flex items-center gap-2">
                <Paperclip className="size-3.5 shrink-0" />
                <span className="min-w-0 truncate text-foreground">{a.filename}</span>
                <span className="shrink-0">{formatSize(a.size)}</span>
              </li>
            ))}
            <li className="pt-1">Les pièces jointes se téléchargent depuis la messagerie Hostinger.</li>
          </ul>
        )}
      </div>

      {replying && (
        <ReplyBox
          message={message}
          inquiryId={briefs[0]?.id ?? null}
          onClose={() => setReplying(false)}
        />
      )}
    </article>
  );
}

// ─── The brief beside the message ───────────────────────────────────────────

function BriefPanel({ briefs, contact }: { briefs: LinkedBrief[]; contact: string }) {
  if (briefs.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-border p-4 text-xs text-muted-foreground">
        Aucun brief associé à <span className="break-all text-foreground">{contact}</span>. Cette personne n'a pas rempli le formulaire avec cette adresse.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {briefs.map((brief) => (
        <section key={brief.id} className="rounded-sm border border-gold/40 bg-gold/5 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gold">Brief associé</p>
              <p className="mt-1 break-words text-base font-medium text-foreground">
                {brief.name}
                {brief.company ? <span className="font-normal text-muted-foreground"> · {brief.company}</span> : null}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyle(brief.status)}`}
            >
              {STATUS_LABEL[brief.status] ?? brief.status}
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Offre</dt>
              <dd className="mt-0.5 break-words font-medium text-foreground">{brief.offer}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Budget</dt>
              <dd className="mt-0.5 break-words font-medium text-foreground">{brief.budget_range}</dd>
            </div>
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Délai</dt>
              <dd className="mt-0.5 break-words font-medium text-foreground">{brief.timeline}</dd>
            </div>
          </dl>

          {brief.vision && (
            <p className="mt-3 line-clamp-4 whitespace-pre-wrap break-words border-t border-gold/20 pt-3 text-xs leading-relaxed text-foreground/85">
              {brief.vision}
            </p>
          )}

          <Link
            to="/admin/inquiries/$id"
            params={{ id: brief.id }}
            className="mt-3 inline-flex h-10 items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-gold hover:underline"
          >
            Ouvrir le brief complet <ArrowUpRight className="size-3.5" />
          </Link>
        </section>
      ))}
    </div>
  );
}

// ─── HTML email, sandboxed ──────────────────────────────────────────────────

function EmailFrame({ html, allowImages }: { html: string; allowImages: boolean }) {
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = React.useState(240);

  // No script can run (the sandbox forbids it and the CSP blocks everything except inline styles).
  // Remote images stay blocked until the viewer asks for them.
  const csp = `default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data: ${allowImages ? "https: http:" : ""}`;
  const srcDoc = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base target="_blank">
<style>html,body{margin:0;padding:0}body{padding:16px;font:14px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;color:#111;background:#fff;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%}pre{white-space:pre-wrap}</style>
</head><body>${html}</body></html>`;

  const measure = React.useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    const next = Math.ceil(Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0));
    if (next > 0) setHeight(Math.min(next + 2, 12000));
  }, []);

  const onLoad = () => {
    measure();
    const body = frameRef.current?.contentDocument?.body;
    if (body && typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(body);
      // The observer lives as long as this frame's document; it is released with it.
    }
  };

  return (
    <iframe
      ref={frameRef}
      title="Contenu du message"
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      srcDoc={srcDoc}
      onLoad={onLoad}
      style={{ height }}
      className="block w-full border-0 bg-white"
    />
  );
}

// ─── Reply ──────────────────────────────────────────────────────────────────

function ReplyBox({
  message,
  inquiryId,
  onClose,
}: {
  message: Extract<MailMessageResult, { ok: true }>["message"];
  inquiryId: string | null;
  onClose: () => void;
}) {
  const baseSubject = message.subject || "";
  const [subject, setSubject] = React.useState(/^re:/i.test(baseSubject) ? baseSubject : `Re: ${baseSubject}`.trim());
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);
    setError(null);

    const quoted = message.text
      ? `\n\n${message.date ? `Le ${new Date(message.date).toLocaleString("fr-FR")}, ` : ""}${displayName(message.from)} a écrit :\n${message.text
          .split("\n")
          .slice(0, 60)
          .map((line) => `> ${line}`)
          .join("\n")}`
      : "";

    try {
      const res = await replyToMail({
        data: {
          to: message.contact.address,
          subject,
          text: `${body.trim()}${quoted}`,
          inReplyTo: message.messageId,
          references: message.references,
          inquiryId,
        },
      });
      if (res.ok) {
        setDone(
          `Réponse envoyée à ${message.contact.address}.${inquiryId ? " Le brief est passé en « Répondu »." : ""}`,
        );
        window.dispatchEvent(new Event("volka:mail-changed"));
      } else {
        setError(res.error ?? "L'envoi a échoué.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'envoi a échoué.");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-sm border border-green-500/30 bg-green-500/10 p-4 text-xs text-green-700 dark:text-green-400">
        <Send className="mt-0.5 size-4 shrink-0" />
        <span>{done}</span>
      </div>
    );
  }

  return (
    <section className="space-y-3 rounded-sm border border-border bg-card p-4 sm:p-6">
      <h3 className="font-display text-lg font-medium">Répondre à {displayName(message.contact)}</h3>
      <p className="break-all text-xs text-muted-foreground">À : {message.contact.address}</p>

      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        aria-label="Objet"
        className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm focus:border-gold focus:outline-none"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={8}
        autoFocus
        aria-label="Votre réponse"
        placeholder="Votre réponse…"
        className="w-full rounded-sm border border-border bg-background p-3 text-base leading-relaxed focus:border-gold focus:outline-none sm:text-sm"
      />

      {error && (
        <p className="flex items-start gap-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={sending}
          className="h-11 rounded-sm border border-border bg-card px-5 text-xs font-medium uppercase tracking-[0.14em] text-foreground hover:border-gold disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={() => void send()}
          disabled={sending || !body.trim() || !subject.trim()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-primary px-5 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 text-gold" />}
          {sending ? "Envoi…" : "Envoyer"}
        </button>
      </div>
    </section>
  );
}

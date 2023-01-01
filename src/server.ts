import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { localeRedirectTarget } from "./lib/locale/url";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/m" || url.pathname === "/api/m/pixel.gif") {
        const { handleAnalyticsIngest } = await import("./lib/analytics/ingest.server");
        return await handleAnalyticsIngest(request);
      }

      // Dynamic sitemap: includes every published journal article and case study
      if (url.pathname === "/sitemap.xml" && (request.method === "GET" || request.method === "HEAD")) {
        const { handleSitemap } = await import("./lib/sitemap.server");
        return await handleSitemap();
      }

      // First visit on a French address from an English browser (or with an English choice saved):
      // send the visitor to the /en version. Search engines are never redirected.
      const redirectTo = localeRedirectTarget(request);
      if (redirectTo) {
        return new Response(null, {
          status: 302,
          headers: {
            location: redirectTo,
            vary: "Accept-Language, Cookie, User-Agent",
            "cache-control": "private, no-store",
          },
        });
      }

      // Instagram Webhook (Phase IG-1/IG-2)
      if (url.pathname === "/api/ig/webhook") {
        if (request.method === "GET") {
          const { handleWebhookChallenge } = await import("./lib/instagram/webhook.server");
          return handleWebhookChallenge(url);
        }
        if (request.method === "POST") {
          const { handleWebhookPost } = await import("./lib/instagram/webhook.server");
          return await handleWebhookPost(request);
        }
        return new Response("Method Not Allowed", { status: 405 });
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

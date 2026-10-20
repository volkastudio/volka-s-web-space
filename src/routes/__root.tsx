import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { PageTransition } from "@/components/page-transition";
import { I18nProvider } from "@/i18n/context";
import { useI18n } from "@/i18n/context";
import { ArrowUpRight } from "lucide-react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-foreground">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">404</p>
      <h1 className="mt-6 font-display text-7xl font-medium leading-none md:text-9xl">Page not found.</h1>
      <p className="mt-8 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 border border-primary bg-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go home <ArrowUpRight className="size-3" />
        </Link>
        <Link
          to="/cases"
          className="inline-flex items-center gap-2 border border-border px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary"
        >
          See our work
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    // Error boundary — add your own monitoring here (e.g. Sentry) in Phase 8
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-foreground">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">Something went wrong</p>
      <h1 className="mt-6 max-w-xl text-center font-display text-5xl font-medium leading-tight md:text-7xl">
        This page didn&rsquo;t load.
      </h1>
      <p className="mt-8 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
        Something went wrong on our end. You can try refreshing or head back home.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <button
          id="error-retry"
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="inline-flex items-center gap-2 border border-primary bg-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-flex items-center gap-2 border border-border px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

/** Keeps html[lang] in sync with the active locale. No layout shifts — SSR renders lang="fr" (default). */
function LangSync() {
  const { locale } = useI18n();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Volka" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Volka" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // Favicons & Touch icons
      { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
      { rel: "icon", href: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { rel: "icon", href: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      // hreflang alternates for FR (root) and EN (/en/* — future routing)
      { rel: "alternate", hrefLang: "fr", href: "/" },
      { rel: "alternate", hrefLang: "en", href: "/" },
      { rel: "alternate", hrefLang: "x-default", href: "/" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // SSR default: French is primary (D3). LangSync component updates this on the client.
  return (
    <html lang="fr">
      <head>
        <script
          dangerouslySetInnerHTML={{
            // 1. Add `.js` for SSR-safe motion reveals.
            // 2. Restore locale from cookie/localStorage before first paint (avoids flash).
            __html: `
              document.documentElement.classList.add('js');
              try {
                var loc = localStorage.getItem('volka_locale');
                if (loc === 'en' || loc === 'fr') {
                  document.documentElement.lang = loc;
                }
              } catch(e) {}
            `.trim(),
          }}
        />
        <noscript>
          <style
            dangerouslySetInnerHTML={{
              __html: ".motion-safe-hidden { opacity: 1 !important; transform: none !important; }",
            }}
          />
        </noscript>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider defaultLocale="fr">
        {/* Keeps html[lang] in sync with the active locale (client-side) */}
        <LangSync />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <PageTransition>
          <Outlet />
        </PageTransition>
      </I18nProvider>
    </QueryClientProvider>
  );
}

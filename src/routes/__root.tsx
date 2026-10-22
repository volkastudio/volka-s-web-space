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
import { useEffect, useRef, type ReactNode } from "react";

import { PageTransition } from "@/components/page-transition";
import { I18nProvider, useI18n } from "@/i18n/context";
import { ArrowUpRight, RotateCcw } from "lucide-react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-20 text-foreground">
      <div className="mx-auto max-w-md text-center">
        <img
          src="/vectors/404.svg"
          alt="404"
          width={612}
          height={408}
          className="mx-auto h-48 w-auto md:h-64 object-contain"
        />
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-gold">404</p>
        <h1 className="mt-3 font-display text-4xl font-medium leading-tight md:text-6xl">
          {t.errors.notFoundTitle}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {t.errors.notFoundMessage}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 border border-primary bg-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.errors.goHome} <ArrowUpRight className="size-3.5" />
          </Link>
          <Link
            to="/cases"
            className="inline-flex items-center gap-2 border border-border px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary"
          >
            {t.errors.seeOurWork}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    // Error boundary hook for error telemetry / reporting
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-20 text-foreground">
      <div className="mx-auto max-w-md text-center">
        <img
          src="/vectors/page_broken.svg"
          alt="Broken page"
          width={612}
          height={408}
          className="mx-auto h-48 w-auto md:h-64 object-contain"
        />
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          {t.errors.somethingWentWrong}
        </p>
        <h1 className="mt-3 font-display text-4xl font-medium leading-tight md:text-6xl">
          {t.errors.pageDidNotLoad}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {t.errors.pageDidNotLoadMessage}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            id="error-retry"
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center gap-2 border border-primary bg-primary px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RotateCcw className="size-3.5" /> {t.errors.tryAgain}
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 border border-border px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary"
          >
            {t.errors.goHome}
          </a>
        </div>
      </div>
    </div>
  );
}

/** Keeps html[lang] in sync with the active locale and invalidates router when user switches language. */
function LangSync() {
  const { locale } = useI18n();
  const router = useRouter();
  const prevLocaleRef = useRef(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    if (prevLocaleRef.current !== locale) {
      prevLocaleRef.current = locale;
      router.invalidate();
    }
  }, [locale, router]);

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
        {/* Keeps html[lang] in sync with the active locale and invalidates router loaders */}
        <LangSync />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <PageTransition>
          <Outlet />
        </PageTransition>
      </I18nProvider>
    </QueryClientProvider>
  );
}

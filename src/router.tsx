import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import type { Locale } from "./i18n/types";
import { isLocalizablePath, localizePath, splitLocalePath } from "./lib/locale/url";

export const getRouter = () => {
  const queryClient = new QueryClient();

  // The language of the URL being read. One router is created per request on the server and once
  // per tab in the browser, so this is never shared between visitors.
  const current: { locale: Locale } = { locale: "fr" };

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultViewTransition: true,
    // "/en/cases" is read as "/cases" (so every route is written once), and links are built with
    // the "/en" prefix whenever the page being shown is English.
    rewrite: {
      input: ({ url }) => {
        const { locale, path } = splitLocalePath(url.pathname);
        if (isLocalizablePath(path)) {
          current.locale = locale;
          url.pathname = path;
        }
        return url;
      },
      output: ({ url }) => {
        if (current.locale === "en" && isLocalizablePath(url.pathname)) {
          url.pathname = localizePath(url.pathname, "en");
        }
        return url;
      },
    },
  });

  return router;
};

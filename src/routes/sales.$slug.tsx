import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  src: z.string().optional(),
});

export const Route = createFileRoute("/sales/$slug")({
  validateSearch: searchSchema,
  loader: ({ params, location }) => {
    const rawSearch = location.search as Record<string, string | undefined>;
    throw redirect({
      to: "/tools/$slug" as any,
      params: { slug: params.slug } as any,
      search: rawSearch as any,
    });
  },
});

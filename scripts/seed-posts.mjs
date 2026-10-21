import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { initialPosts } from "../src/data/posts.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seedPosts() {
  console.log("Checking and seeding posts into Supabase...");

  for (const post of initialPosts) {
    const row = {
      slug: post.slug,
      status: post.status,
      published_at: post.published_at,
      cover_path: post.cover_path,
      tags: post.tags,
      reading_time_minutes: post.reading_time_minutes,
      social_links: post.social_links,
      translations: post.translations,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("posts")
      .upsert(row, { onConflict: "slug" })
      .select("id, slug");

    if (error) {
      console.warn(`[seedPosts] Note on "${post.slug}":`, error.message);
    } else {
      console.log(`[seedPosts] Successfully upserted "${post.slug}":`, data);
    }
  }

  console.log("Posts seeding routine finished.");
}

seedPosts().catch((err) => {
  console.error("Error in seedPosts:", err);
});

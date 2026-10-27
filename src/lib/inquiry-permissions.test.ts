import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Inquiry Database Security & Permissions (Finding F2)", () => {
  it("includes migration revoking direct INSERT on project_inquiries from anon and authenticated", () => {
    const migrationPath = path.resolve(
      __dirname,
      "../../supabase/migrations/20261026150000_phase5b_hardening.sql",
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const migrationSql = fs.readFileSync(migrationPath, "utf-8");

    // Must revoke insert permission from anon and authenticated roles
    expect(migrationSql).toMatch(
      /REVOKE\s+INSERT\s+ON\s+public\.project_inquiries\s+FROM\s+anon,\s*authenticated;/i,
    );

    // Must drop any legacy open RLS policy allowing public insert
    expect(migrationSql).toMatch(
      /DROP\s+POLICY\s+IF\s+EXISTS\s+"Anyone can submit a project inquiry"\s+ON\s+public\.project_inquiries;/i,
    );
  });

  it("ensures public inquiries are submitted exclusively via server-side service_role", async () => {
    const inquiriesFnPath = path.resolve(__dirname, "./inquiries.functions.ts");
    const code = fs.readFileSync(inquiriesFnPath, "utf-8");

    // The submitInquiry function must use supabaseAdmin (service_role), not anon client
    expect(code).toContain("supabaseAdmin");
    expect(code).not.toContain("supabaseAnon");
  });
});

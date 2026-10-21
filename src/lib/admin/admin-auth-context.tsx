import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AdminAuthContextValue {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminAuthContext = React.createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const checkAdmin = React.useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setUser(null);
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: dbError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (dbError) {
        // Check for schema/table not found errors (migration not run on remote project)
        const isSchemaError =
          dbError.message.includes("database error querying schema") ||
          dbError.message.includes("relation") ||
          dbError.message.includes("does not exist") ||
          dbError.code === "PGRST204" ||
          dbError.code === "42P01";

        const friendlyMsg = isSchemaError
          ? "Database schema not found. Please run the Supabase migrations on your remote project (supabase db push) and ensure the admin_users table exists."
          : `Admin check failed: ${dbError.message}`;

        console.warn("[AdminAuth] Check error:", dbError.message);
        setUser(currentUser);
        setIsAdmin(false);
        setError(friendlyMsg);
        setIsLoading(false);
        return;
      }

      if (data) {
        setUser(currentUser);
        setIsAdmin(true);
        setError(null);
      } else {
        setUser(currentUser);
        setIsAdmin(false);
        setError("Your account does not have administrator privileges.");
      }
    } catch (err) {
      console.error("[AdminAuth] Unexpected check error:", err);
      setUser(currentUser);
      setIsAdmin(false);
      setError("Failed to verify administrator status.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.auth.getSession();
    await checkAdmin(data.session?.user ?? null);
  }, [checkAdmin]);

  React.useEffect(() => {
    let mounted = true;

    // Initial check
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        checkAdmin(data.session?.user ?? null);
      }
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          checkAdmin(session?.user ?? null);
        }
      },
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [checkAdmin]);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      isAdmin,
      isLoading,
      error,
      signOut,
      refresh,
    }),
    [user, isAdmin, isLoading, error, signOut, refresh],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = React.useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}

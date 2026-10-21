import * as React from "react";
import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin/admin-auth-context";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { listAdminInquiries } from "@/lib/admin/inquiries.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Admin — Volka Studio" },
    ],
  }),
  component: AdminLayoutContainer,
});

function AdminLayoutContainer() {
  return (
    <AdminAuthProvider>
      <AdminLayoutInner />
    </AdminAuthProvider>
  );
}

function AdminLayoutInner() {
  const { user, isAdmin, isLoading, error } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = React.useState<number>(0);

  const isLoginPage = location.pathname === "/admin/login";

  // Fetch unread inquiries count periodically when authenticated
  React.useEffect(() => {
    if (!isAdmin || isLoginPage) return;

    let mounted = true;
    const fetchUnread = async () => {
      try {
        const res = await listAdminInquiries({ data: { limit: 1 } });
        if (mounted && res) {
          setUnreadCount(res.unreadCount);
        }
      } catch (err) {
        // Silently handle if network or function fails
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isAdmin, isLoginPage]);

  // Redirect to login when not authenticated/admin — must be in an effect, not render body
  React.useEffect(() => {
    if (!isLoading && !isLoginPage && (!user || !isAdmin)) {
      navigate({
        to: "/admin/login",
        search: { redirect: location.pathname },
        replace: true,
      });
    }
  }, [isLoading, isLoginPage, user, isAdmin, navigate, location.pathname]);

  // If on login page, render child directly
  if (isLoginPage) {
    return <Outlet />;
  }

  // Show loading screen while auth state is being verified
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary text-primary-foreground">
        <div className="text-center">
          <span className="font-display text-3xl font-light tracking-[0.14em]">VOLKA</span>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-gold">
            <span className="size-2 rounded-full bg-gold animate-ping" />
            <span>Verifying admin credentials...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not yet redirected (effect runs after render) — render nothing to avoid flash
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground lg:flex-row">
      <AdminSidebar unreadInquiriesCount={unreadCount} />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

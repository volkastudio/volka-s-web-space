import * as React from "react";
import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin/admin-auth-context";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopBar } from "@/components/admin/admin-topbar";
import { listAdminInquiries } from "@/lib/admin/inquiries.functions";
import { getMailUnreadCount } from "@/lib/admin/mail.functions";

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
  const { user, role, isAdmin, isLoading } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [unreadMail, setUnreadMail] = React.useState<number>(0);
  const [mobileNavOpen, setMobileNavOpen] = React.useState<boolean>(false);

  const isLoginPage = location.pathname === "/admin/login";

  // Automatically close mobile nav drawer upon route change
  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

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

  // Unread mail count: refreshed every 2 minutes, and right away when a message is read or answered.
  // Skipped for the editor role (no access) and when the mailbox is not connected.
  React.useEffect(() => {
    if (!isAdmin || isLoginPage || role === "editor") return;

    let mounted = true;
    let enabled = true;
    const fetchMail = async () => {
      if (!enabled || document.hidden) return;
      try {
        const res = await getMailUnreadCount();
        if (!mounted) return;
        if (!res.configured) enabled = false;
        setUnreadMail(res.unread);
      } catch {
        // Not critical: the badge simply stays as it was.
      }
    };

    void fetchMail();
    const interval = setInterval(fetchMail, 120_000);
    const onChange = () => void fetchMail();
    window.addEventListener("volka:mail-changed", onChange);
    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener("volka:mail-changed", onChange);
    };
  }, [isAdmin, isLoginPage, role]);

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
            <span>Vérification des accès administrateur...</span>
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
    <div className="admin-root flex min-h-dvh flex-col bg-background text-foreground lg:flex-row">
      <AdminSidebar
        unreadInquiriesCount={unreadCount}
        unreadMailCount={unreadMail}
        mobileOpen={mobileNavOpen}
        onMobileOpenChange={setMobileNavOpen}
      />
      {/* No overflow here: an overflow container would stop the sticky top bar from sticking to the
          screen on phones, and min-w-0 keeps wide content from pushing the page sideways. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar
          unreadInquiriesCount={unreadCount}
          unreadMailCount={unreadMail}
          isMobileNavOpen={mobileNavOpen}
          onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
        />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

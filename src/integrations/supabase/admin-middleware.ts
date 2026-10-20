import { createMiddleware } from '@tanstack/react-start';
import { requireSupabaseAuth } from './auth-middleware';

export const requireAdminAuth = createMiddleware({ type: 'function' })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { supabaseAdmin } = await import('./client.server');

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .eq('user_id', context.userId)
      .maybeSingle();

    if (error || !data) {
      console.warn(`[AdminAuth] Access denied for user ${context.userId}: not in admin_users`);
      throw new Error('Forbidden: User is not an administrator');
    }

    return next({
      context: {
        ...context,
        isAdmin: true as const,
      },
    });
  });

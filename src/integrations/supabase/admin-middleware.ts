import { createMiddleware } from '@tanstack/react-start';
import { requireSupabaseAuth } from './auth-middleware';
import type { Json } from './types';

export type AdminRole = 'owner' | 'sales' | 'editor';

export const requireAdminAuth = createMiddleware({ type: 'function' })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { supabaseAdmin } = await import('./client.server');

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('user_id, role')
      .eq('user_id', context.userId)
      .maybeSingle();

    if (error || !data) {
      console.warn(`[AdminAuth] Access denied for user ${context.userId}: not in admin_users`);
      try {
        const { logSecurityEvent } = await import('@/lib/admin/security.server');
        await logSecurityEvent({
          type: 'admin_forbidden',
          severity: 'warning',
          actorId: context.userId,
          details: { error: error?.message, action: 'requireAdminAuth' },
        });
      } catch (logErr) {
        console.error('[AdminAuth] Failed to log admin_forbidden security event:', logErr);
      }
      throw new Error('Forbidden: User is not an administrator');
    }

    return next({
      context: {
        ...context,
        isAdmin: true as const,
        adminRole: (data.role ?? 'owner') as AdminRole,
      },
    });
  });

/**
 * Middleware requiring specifically the 'owner' role (D19, Phase 5c).
 * Rejects and logs 'role_denied' for sales or editor roles.
 */
export const requireOwnerAuth = createMiddleware({ type: 'function' })
  .middleware([requireAdminAuth])
  .server(async ({ next, context }) => {
    if (context.adminRole !== 'owner') {
      console.warn(`[OwnerAuth] Access denied for user ${context.userId}: role '${context.adminRole}' is not owner`);
      try {
        const { logSecurityEvent } = await import('@/lib/admin/security.server');
        await logSecurityEvent({
          type: 'role_denied',
          severity: 'warning',
          actorId: context.userId,
          details: { requiredRole: 'owner', userRole: context.adminRole },
        });
      } catch (logErr) {
        console.error('[OwnerAuth] Failed to log role_denied security event:', logErr);
      }
      throw new Error('Forbidden: Exclusivement réservé au rôle Propriétaire (owner)');
    }

    return next({ context });
  });

/**
 * Audit log recording utility (F7)
 */
export async function logAdminAction(params: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  diff?: Record<string, unknown> | null;
}) {
  try {
    const { supabaseAdmin } = await import('./client.server');
    const { error } = await supabaseAdmin.from('admin_audit_log').insert({
      actor_id: params.actorId ?? null,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      diff: (params.diff as unknown as Json) ?? null,
    });
    if (error) {
      console.warn('[AdminAuditLog] Failed to record audit log:', error.message);
    }
  } catch (err) {
    console.warn('[AdminAuditLog] Unexpected error logging action:', err);
  }
}


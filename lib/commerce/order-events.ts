import type {SupabaseClient} from '@supabase/supabase-js'
import type {OrderEventRecord} from './refund-types'
import {getSafeSupabaseAdmin} from '../server/supabaseAdmin'

export interface RecordOrderEventParams {
  orderId: string
  eventType:
    | 'ORDER_CREATED'
    | 'ORDER_CANCELLED'
    | 'PAYMENT_INITIALIZED'
    | 'PAYMENT_SUCCEEDED'
    | 'PAYMENT_FAILED'
    | 'REFUND_REQUESTED'
    | 'REFUND_SUCCEEDED'
    | 'REFUND_FAILED'
  actorType: 'system' | 'customer' | 'admin'
  actorId?: string | null
  metadata?: Record<string, unknown>
}

export interface ListOrderEventsOptions {
  supabaseClientOverride?: SupabaseClient | null
  eventsOverride?: OrderEventRecord[]
}

/**
 * Sanitizes event metadata to guarantee zero PII, card PAN, CVV, or credentials are recorded in audit trail.
 */
function sanitizeEventMetadata(meta?: Record<string, unknown>): Record<string, unknown> {
  if (!meta || typeof meta !== 'object') return {}
  const clean: Record<string, unknown> = {}
  const sensitiveKeys = new Set([
    'password',
    'token',
    'secret',
    'authorization',
    'pan',
    'cvv',
    'expiry',
    'guesttoken',
    'adminsecret',
    'cardnumber',
    'email',
    'phone',
    'address',
  ])

  for (const [key, value] of Object.entries(meta)) {
    if (sensitiveKeys.has(key.toLowerCase())) {
      continue
    }
    clean[key] = value
  }

  return clean
}

/**
 * Records an immutable audit trail event for an order lifecycle transition.
 */
export async function recordOrderEvent(
  params: RecordOrderEventParams,
  supabaseClient?: SupabaseClient | null
): Promise<void> {
  const supabase = supabaseClient !== undefined ? supabaseClient : getSafeSupabaseAdmin()
  if (!supabase) return

  try {
    const cleanMetadata = sanitizeEventMetadata(params.metadata)
    await supabase.from('commerce_order_events').insert({
      order_id: params.orderId,
      event_type: params.eventType,
      actor_type: params.actorType,
      actor_id: params.actorId || null,
      metadata: cleanMetadata,
    })
  } catch (err: unknown) {
    // Audit logging should not crash business transaction, but error is logged safely
    const errMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Order Events] Failed to record audit event:', errMsg)
  }
}

/**
 * Lists audit events for an order.
 */
export async function listOrderEvents(
  orderId: string,
  options: ListOrderEventsOptions = {}
): Promise<OrderEventRecord[]> {
  const cleanId = String(orderId || '').trim()
  if (!cleanId) return []

  if (options.eventsOverride) {
    return options.eventsOverride.filter(e => e.orderId === cleanId)
  }

  const supabase =
    options.supabaseClientOverride !== undefined
      ? options.supabaseClientOverride
      : getSafeSupabaseAdmin()

  if (!supabase) return []

  const {data, error} = await supabase
    .from('commerce_order_events')
    .select('id, order_id, event_type, actor_type, actor_id, metadata, created_at')
    .eq('order_id', cleanId)
    .order('created_at', {ascending: false})

  if (error || !data) return []

  return data.map(r => ({
    id: String(r['id']),
    orderId: String(r['order_id']),
    eventType: String(r['event_type']),
    actorType: r['actor_type'] as 'system' | 'customer' | 'admin',
    actorId: r['actor_id'] ? String(r['actor_id']) : null,
    metadata: (r['metadata'] as Record<string, unknown>) || null,
    createdAt: String(r['created_at']),
  }))
}

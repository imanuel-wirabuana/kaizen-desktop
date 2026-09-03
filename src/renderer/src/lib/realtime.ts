import { supabase } from '@/lib/supabase'

const GLOBAL_SYNC_CHANNEL_NAME = 'kaizen-global-sync'

export type SyncEventType = 'boards' | 'lanes' | 'items' | 'members'

type SyncCallback = (event: SyncEventType, payload?: any) => void

let channel: ReturnType<typeof supabase.channel> | null = null
const listeners = new Set<SyncCallback>()

/**
 * Initializes global Supabase broadcast channel for peer-to-peer real-time sync across windows and tabs.
 */
export function initGlobalRealtimeSync() {
  if (channel) return channel

  channel = supabase.channel(GLOBAL_SYNC_CHANNEL_NAME, {
    config: {
      broadcast: { self: false } // Don't trigger broadcast on sending client (sending client already applied optimistic update)
    }
  })

  channel
    .on('broadcast', { event: '*' }, (response) => {
      const eventName = response.event as SyncEventType
      const payload = response.payload
      listeners.forEach((cb) => {
        try {
          cb(eventName, payload)
        } catch (err) {
          console.error('[RealtimeSync] Callback error:', err)
        }
      })
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[RealtimeSync] Subscribed to global broadcast channel')
      }
    })

  return channel
}

/**
 * Broadcasts a real-time sync event to all other connected clients (<50ms delivery).
 */
export function broadcastSyncEvent(event: SyncEventType, payload?: any) {
  if (!channel) {
    initGlobalRealtimeSync()
  }
  channel?.send({
    type: 'broadcast',
    event,
    payload: payload || {}
  })
}

/**
 * Subscribes a listener to real-time broadcast sync events.
 */
export function onSyncEvent(callback: SyncCallback): () => void {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

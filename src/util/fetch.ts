/**
 * Lightweight fetch utilities with timeout support.
 *
 * For use by REST API clients, registry providers, and other HTTP callers.
 * For full-featured HTTP with auth/headers/signal merging, use client/http-client.ts.
 */

import { DEFAULT_REQUEST_TIMEOUT_MS } from '../constants'

export interface FetchOptions extends RequestInit {
  /** Timeout in milliseconds (default: DEFAULT_REQUEST_TIMEOUT_MS) */
  timeoutMs?: number
}

/**
 * Fetch with AbortController-based timeout.
 */
export async function fetchWithTimeout(url: string, init?: FetchOptions): Promise<Response> {
  const { timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS, ...fetchInit } = init ?? {}
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  // Merge caller's signal with timeout signal to respect both
  const signal =
    fetchInit.signal && typeof AbortSignal.any === 'function'
      ? AbortSignal.any([fetchInit.signal, controller.signal])
      : controller.signal

  try {
    return await fetch(url, { ...fetchInit, signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Fetch and parse JSON response. Throws on non-ok status.
 */
export async function fetchJson<T>(url: string, init?: FetchOptions): Promise<T> {
  const res = await fetchWithTimeout(url, init)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }
  return (await res.json()) as T
}

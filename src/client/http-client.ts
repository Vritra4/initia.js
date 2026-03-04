/**
 * Shared HTTP request utility for fetch-based clients.
 *
 * Provides unified auth/header merge, timeout, and signal handling
 * for EVM JSON-RPC, CometBFT RPC, and (future) REST clients.
 */

import { DEFAULT_REQUEST_TIMEOUT_MS } from '../constants'
import { toFetchHeaders } from './headers'
import type { AuthConfig, HttpRequestOptions } from './types'

/**
 * Configuration for an HTTP-based client.
 */
export interface HttpClientConfig {
  endpoint: string
  auth?: AuthConfig
  headers?: Record<string, string>
  timeoutMs?: number
}

/**
 * Perform an HTTP request with auth/header merge, timeout, and signal support.
 *
 * Header priority: config.headers (base) → config.auth → requestOptions.headers (highest)
 * Timeout: requestOptions.timeoutMs → config.timeoutMs → DEFAULT_REQUEST_TIMEOUT_MS
 * Signal: merged via AbortSignal.any() when user signal is provided
 */
export async function httpRequest(
  config: HttpClientConfig,
  path: string,
  init: RequestInit,
  requestOptions?: HttpRequestOptions
): Promise<Response> {
  const headers = toFetchHeaders(config.auth, config.headers, requestOptions)
  const timeoutMs = requestOptions?.timeoutMs ?? config.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS

  const controller = new AbortController()
  const signal = requestOptions?.signal
    ? AbortSignal.any([requestOptions.signal, controller.signal])
    : controller.signal
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(`${config.endpoint.replace(/\/+$/, '')}${path}`, {
      ...init,
      headers: { ...headers, ...(init.headers as Record<string, string>) },
      signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

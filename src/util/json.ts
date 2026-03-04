/**
 * JSON ↔ Uint8Array encoding utilities.
 *
 * Used by CosmWasm contracts and message builders for JSON-based messages.
 */

/**
 * Encode a JSON-serializable object to Uint8Array.
 */
export function encodeMsg(msg: object): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(msg))
}

/**
 * Decode Uint8Array to a parsed JSON value.
 * Falls back to raw string if JSON parsing fails.
 */
export function decodeResponse(data: Uint8Array): unknown {
  const text = new TextDecoder().decode(data)
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

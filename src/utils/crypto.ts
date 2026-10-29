/**
 * Cryptographic SHA-256 hashing utility for tamper-evident document logs
 * and audit integrity.
 */

export async function computeSHA256(data: string | object): Promise<string> {
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(text);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('WebCrypto not available, using fallback hash', e);
  }

  // Pure JS fallback hash if crypto.subtle is restricted
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'fallback-' + Math.abs(hash).toString(16).padStart(16, '0');
}

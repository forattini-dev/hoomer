// ── Shareable Link Manager ──────────────────────
// Encodes project state into URL hash with optional AES-GCM encryption.
// Hash format: #P<base64url> (plain) or #E<base64url> (encrypted)

const PBKDF2_ITERATIONS = 100_000;

// ── Base64url (no padding) ──────────────────────
function toBase64Url(uint8) {
  let bin = '';
  for (let i = 0; i < uint8.length; i++) bin += String.fromCharCode(uint8[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (b64.length % 4)) % 4;
  const bin = atob(b64 + '='.repeat(pad));
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

// ── Compression (native gzip) ───────────────────
async function compressData(str) {
  const blob = new Blob([str]);
  const stream = blob.stream().pipeThrough(new CompressionStream('gzip'));
  const response = new Response(stream);
  return new Uint8Array(await response.arrayBuffer());
}

async function decompressData(bytes) {
  const blob = new Blob([bytes]);
  const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
  const response = new Response(stream);
  return await response.text();
}

// ── Crypto helpers ──────────────────────────────
async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(bytes, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes)
  );
  // salt (16) + iv (12) + ciphertext
  const result = new Uint8Array(salt.length + iv.length + ciphertext.length);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(ciphertext, salt.length + iv.length);
  return result;
}

async function decryptData(bytes, password) {
  const salt = bytes.slice(0, 16);
  const iv = bytes.slice(16, 28);
  const ciphertext = bytes.slice(28);
  const key = await deriveKey(password, salt);
  return new Uint8Array(
    await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  );
}

// ── Public API ──────────────────────────────────
export class ShareManager {
  /**
   * Detect hash type from URL hash string.
   * @param {string} hash — location.hash (with #)
   * @returns {{ present: boolean, encrypted: boolean }}
   */
  static parseHashType(hash) {
    if (!hash || hash.length < 3) return { present: false, encrypted: false };
    const prefix = hash.charAt(1);
    if (prefix === 'P' || prefix === 'E') {
      return { present: true, encrypted: prefix === 'E' };
    }
    return { present: false, encrypted: false };
  }

  /**
   * Create a share hash from state data.
   * @param {object} stateData — serialized project state
   * @param {string|null} password — optional password for encryption
   * @returns {Promise<{ hash: string, byteSize: number }>}
   */
  static async createShareHash(stateData, password) {
    const json = JSON.stringify(stateData);
    let compressed = await compressData(json);

    let prefix, payload;
    if (password) {
      payload = await encryptData(compressed, password);
      prefix = 'E';
    } else {
      payload = compressed;
      prefix = 'P';
    }

    const hash = '#' + prefix + toBase64Url(payload);
    return { hash, byteSize: payload.length };
  }

  /**
   * Load project data from a URL hash.
   * @param {string} hash — location.hash (with #)
   * @param {string|null} password — password if encrypted
   * @returns {Promise<{ data: object, encrypted: boolean }>}
   */
  static async loadFromHash(hash, password) {
    const { present, encrypted } = ShareManager.parseHashType(hash);
    if (!present) throw new Error('No shared data in URL');

    const b64 = hash.slice(2); // skip #P or #E
    const bytes = fromBase64Url(b64);

    let decompressInput;
    if (encrypted) {
      if (!password) throw new Error('Password required');
      decompressInput = await decryptData(bytes, password);
    } else {
      decompressInput = bytes;
    }

    const json = await decompressData(decompressInput);
    const data = JSON.parse(json);
    return { data, encrypted };
  }
}

import { ec as EC } from 'elliptic'
import { sha3_256 } from 'js-sha3'
import BN from 'bn.js'

// Initialise secp256k1 curve once.  This curve is well supported in
// elliptic and offers 128‑bit security which is more than adequate for
// educational purposes.  All keys generated below are hex strings.
const ec = new EC('secp256k1')

/**
 * Derive a deterministic private key from a user supplied password.  A
 * cryptographic hash (SHA3‑256) is used to turn the password into a
 * number and that number is reduced modulo the curve order to ensure
 * it lies within the valid private key domain.  The resulting value is
 * returned as a zero padded 64‑character hex string.
 *
 * Note: In production systems you should never derive EC keys directly
 * from a password.  Instead use a slow key derivation function (e.g.
 * Argon2) and a random salt.  Here we follow the specification for
 * simplicity and to emphasise the underlying cryptography.
 */
export function derivePrivateKeyFromPassword (password: string): string {
  const hashHex = sha3_256(password)
  const bn = new BN(hashHex, 16).umod(ec.curve.n)
  // Left pad to 64 hex characters
  return bn.toString('hex').padStart(64, '0')
}

/**
 * Generate an ECC key pair deterministically from a password.  The
 * private key is derived as above; the public key is computed using
 * elliptic.  The public key is encoded in uncompressed hex format.
 */
export function generateKeyPairFromPassword (password: string) {
  const priv = derivePrivateKeyFromPassword(password)
  const key = ec.keyFromPrivate(priv)
  const pub = key.getPublic().encode('hex')
  return { privateKey: priv, publicKey: pub }
}

/**
 * Compute the SHA3‑256 hash of an arbitrary string.  Returns a 64
 * character hex string.
 */
export function hashMessage (message: string): string {
  return sha3_256(message)
}

/**
 * Sign a pre‑computed message hash using ECDSA and a private key.
 * Returns the signature components r and s as hex strings.  The
 * caller is responsible for hashing the message beforehand using
 * {@link hashMessage} and for serialising the signature appropriately.
 */
export function signMessage (privateKey: string, messageHash: string) {
  const key = ec.keyFromPrivate(privateKey, 'hex')
  const signature = key.sign(messageHash)
  return {
    r: signature.r.toString('hex'),
    s: signature.s.toString('hex'),
  }
}

/**
 * Verify an ECDSA signature against a given message hash and public
 * key.  The public key must be supplied in uncompressed hex format.
 */
export function verifySignature (
  publicKey: string,
  messageHash: string,
  signature: { r: string, s: string },
): boolean {
  const key = ec.keyFromPublic(publicKey, 'hex')
  return key.verify(messageHash, signature)
}

/**
 * Derive a shared secret from a local private key and a peer's public
 * key using ECDH.  The returned value is a byte array derived by
 * hashing the shared secret with SHA3‑256.  This secret is used as
 * input for a simple XOR based symmetric cipher implemented below.
 */
function deriveSharedSecret (privateKey: string, peerPublicKey: string): Uint8Array {
  const privKey = ec.keyFromPrivate(privateKey, 'hex')
  const pubKey = ec.keyFromPublic(peerPublicKey, 'hex')
  const shared = privKey.derive(pubKey.getPublic()) // BN instance
  const hashHex = sha3_256(shared.toString('hex'))
  const bytes: number[] = []
  for (let i = 0; i < hashHex.length; i += 2) {
    bytes.push(parseInt(hashHex.slice(i, i + 2), 16))
  }
  return new Uint8Array(bytes)
}

/**
 * Encrypt a message for a peer using a simple XOR cipher.  A shared
 * secret is derived using ECDH and then hashed to produce a byte
 * sequence.  The message string is encoded as UTF‑8 and XOR'd with
 * the secret bytes (repeating as necessary).  The resulting
 * ciphertext is returned as a hex string.
 *
 * **Important:** This is not a secure encryption scheme and is
 * provided solely to demonstrate how a shared secret can be used.
 * Real end‑to‑end encryption should use a proper authenticated
 * encryption algorithm such as AES‑GCM.  However, implementing AES
 * directly in the browser without an additional dependency is beyond
 * the scope of this assignment.
 */
export function encryptMessage (
  privateKey: string,
  peerPublicKey: string,
  message: string,
): string {
  const secret = deriveSharedSecret(privateKey, peerPublicKey)
  const encoder = new TextEncoder()
  const msgBytes = encoder.encode(message)
  const cipher = new Uint8Array(msgBytes.length)
  for (let i = 0; i < msgBytes.length; i++) {
    cipher[i] = msgBytes[i] ^ secret[i % secret.length]
  }
  return Array.from(cipher)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Decrypt a message previously encrypted with {@link encryptMessage}.
 * Accepts the local private key, the peer's public key and the
 * ciphertext as a hex string.  Returns the original plaintext.
 */
export function decryptMessage (
  privateKey: string,
  peerPublicKey: string,
  cipherHex: string,
): string {
  const secret = deriveSharedSecret(privateKey, peerPublicKey)
  const bytes: number[] = []
  for (let i = 0; i < cipherHex.length; i += 2) {
    bytes.push(parseInt(cipherHex.slice(i, i + 2), 16))
  }
  const plain = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    plain[i] = bytes[i] ^ secret[i % secret.length]
  }
  const decoder = new TextDecoder()
  return decoder.decode(plain)
}
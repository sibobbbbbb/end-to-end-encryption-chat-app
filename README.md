# SecureChat: End-to-End Encrypted Chat App
Tugas Besar I IF4020 Kriptografi - Sem. I 2025/2026

Web-based chat application with security guarantees of **Confidentiality** (ECC+AES), **Integrity** (SHA-3), and **Authenticity** (ECDSA).

## 🚀 Key Features
- **Zero-Knowledge Auth:** Login using Digital Signature (Challenge-Response), the server does not store passwords.
- **E2E Encryption:** Messages are encrypted on the client (Hybrid ECC + AES-GCM). The server only sees random text.
- **Digital Signature:** Each message is signed by the sender to prevent forgery/spoofing.
- **Anti-Replay:** Uses one-time nonces and timestamps.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, TypeScript, Tailwind (Encryption by `elliptic` & `WebCrypto API`).
- **Backend:** Hono (Bun), PostgreSQL, Drizzle ORM.

## 📦 How to Run (Dev Mode)

1. **Preparation:**
   Ensure `bun` and `docker` are installed.

2. **Run All (Backend + Frontend + DB):**
   Simply click the `dev.bat` file or run the script manually.

## 👥 Group Members

| Name   | NIM        | Role                            |
| :----- | :--------- | :------------------------------ |
| Farhan | 13522142   | Backend & Server-side Crypto    |
| Zaidan | 13522146   | Frontend & Client-side Crypto   |
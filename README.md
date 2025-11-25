# SecureChat: End-to-End Encrypted Chat App
Tugas Besar I IF4020 Kriptografi - Sem. I 2025/2026

Web-based chat application with security guarantees of **Confidentiality** (ECC+AES), **Integrity** (SHA-3), and **Authenticity** (ECDSA).

## 🚀 Key Features
- **Zero-Knowledge Auth:** Login using Digital Signature (Challenge-Response), the server does not store passwords.
- **E2E Encryption:** Messages are encrypted on the client (Hybrid ECC + AES-GCM). The server only sees random text.
- **Digital Signature:** Each message is signed by the sender to prevent forgery/spoofing.
- **Anti-Replay:** Uses one-time nonces and timestamps.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, TypeScript, Tailwind.
- **Backend:** Hono (Bun), PostgreSQL, Drizzle ORM.

## 📚 Key Dependencies
Libraries utama yang digunakan untuk implementasi kriptografi:
- `elliptic` (v6.6.1): Untuk operasi kurva eliptik (secp256k1) dan ECDSA.
- `js-sha3` (v0.9.3): Untuk hashing SHA3-256.
- `bn.js`: Untuk operasi BigNumber dalam matematika ECC.
- `Web Crypto API`: Standar browser untuk enkripsi AES-GCM.

## 📦 How to Run (Dev Mode)

### Prerequisites
Ensure `bun` and `docker` are installed on your machine.

### Option 1: Automatic (Windows)
Simply double-click the `dev.bat` file. This script will install dependencies, start the database container, run migrations, and launch both frontend and backend.

### Option 2: Manual (Mac/Linux/Debug)
1. **Install Dependencies:**
   ```bash
   cd backend && bun install
   cd ../frontend && bun install

2.  **Start Database:**
    ```bash
    cd backend
    docker compose up -d
    bun db:migrate
    ```
3.  **Run Services:**
      - Backend: `cd backend && bun run dev`
      - Frontend: `cd frontend && bun run dev`

## 👥 Group Members

| Name   | NIM        | Role                            |
| :----- | :--------- | :------------------------------ |
| Farhan | 13522142   | Backend & Server-side Crypto    |
| Zaidan | 13522146   | Frontend & Client-side Crypto   |
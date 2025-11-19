// backend/test-login-flow.ts
import { ec as EC } from 'elliptic';
import { sha3_256 } from 'js-sha3';

// Konfigurasi
const API_URL = 'http://localhost:3000/api'; // Pastikan port sesuai .env kamu
const TEST_USERNAME = 'farhan_tester_' + Date.now(); // Username unik tiap run

// Inisialisasi Elliptic Curve (secp256k1)
const ec = new EC('secp256k1');

async function main() {
  console.log('🚀 --- MULAI TESTING ALUR KRIPTOGRAFI ---');

  // ---------------------------------------------------------
  // STEP 1: CLIENT-SIDE KEY GENERATION
  // (Ini tugas Zaidan nanti di browser, kita simulasi di sini)
  // ---------------------------------------------------------
  console.log('\n[1] Generating Key Pair di Client...');
  const keyPair = ec.genKeyPair();
  const privateKey = keyPair.getPrivate('hex');
  const publicKey = keyPair.getPublic('hex');
  
  console.log('    -> Private Key (Rahasia):', privateKey.substring(0, 20) + '...');
  console.log('    -> Public Key (Dikirim): ', publicKey.substring(0, 20) + '...');

  // ---------------------------------------------------------
  // STEP 2: REGISTER (Kirim Username & Public Key)
  // ---------------------------------------------------------
  console.log('\n[2] Mendaftarkan User ke Backend...');
  const regRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: TEST_USERNAME,
      publicKey: publicKey
    })
  });
  const regData = await regRes.json();
  console.log('    -> Status:', regRes.status);
  console.log('    -> Response:', regData);

  if (regRes.status !== 201) {
    console.error('❌ Register Gagal! Stop.');
    return;
  }

  // ---------------------------------------------------------
  // STEP 3: REQUEST CHALLENGE (Login Tahap 1)
  // ---------------------------------------------------------
  console.log('\n[3] Meminta Challenge (Nonce) dari Server...');
  const chalRes = await fetch(`${API_URL}/auth/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: TEST_USERNAME
    })
  });
  const chalData = await chalRes.json();
  
  if (chalRes.status !== 200) {
    console.error('❌ Gagal dapat nonce:', chalData);
    return;
  }
  
  const nonce = chalData.data.nonce;
  console.log('    -> Nonce diterima:', nonce);

  // ---------------------------------------------------------
  // STEP 4: SIGNING CHALLENGE (Client-side Logic)
  // ---------------------------------------------------------
  console.log('\n[4] Menandatangani (Signing) Nonce...');
  
  // A. Hash dulu nonce-nya (karena ECDSA sign hash, bukan string mentah)
  // PENTING: Logic ini harus sama persis dengan di backend (auth.service.ts)
  const nonceHash = sha3_256(nonce); 
  
  // B. Sign hash tersebut pakai Private Key
  const signature = keyPair.sign(nonceHash);
  
  // C. Format ke Hex string untuk dikirim JSON
  const signaturePayload = {
    r: signature.r.toString('hex'),
    s: signature.s.toString('hex')
  };
  
  console.log('    -> Signature R:', signaturePayload.r.substring(0, 20) + '...');
  console.log('    -> Signature S:', signaturePayload.s.substring(0, 20) + '...');

  // ---------------------------------------------------------
  // STEP 5: VERIFY LOGIN (Login Tahap 2)
  // ---------------------------------------------------------
  console.log('\n[5] Mengirim Signature untuk Verifikasi Login...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: TEST_USERNAME,
      signature: signaturePayload
    })
  });
  
  const loginData = await loginRes.json();
  console.log('    -> Status:', loginRes.status);
  
  if (loginRes.status === 200) {
    console.log('✅ LOGIN BERHASIL!');
    console.log('    -> JWT Token:', loginData.data.accessToken);
  } else {
    console.error('❌ LOGIN GAGAL:', loginData);
  }
}

main();
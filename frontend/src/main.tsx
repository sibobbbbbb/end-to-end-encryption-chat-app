// Tambahkan 2 baris ini DI PALING ATAS sebelum import lainnya
import { Buffer } from 'buffer';
window.Buffer = Buffer;

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
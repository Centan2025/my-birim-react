import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- SUPABASE LIVE CANLI TESTI ---');
console.log('URL:', url);
console.log('Anon Key mevcut:', !!anonKey);
console.log('Service Key mevcut:', !!serviceKey);

async function run() {
  // 1. Anon Client Test
  const client = createClient(url, anonKey);
  const { data: sessionData, error: sessionErr } = await client.auth.getSession();
  console.log('1. Anon Client Baglantisi:', sessionErr ? `HATA: ${sessionErr.message}` : 'BASARILI (Aktif)');

  // 2. Admin Client Test
  const admin = createClient(url, serviceKey);
  const { data: usersData, error: usersErr } = await admin.auth.admin.listUsers();
  console.log('2. Admin Client Baglantisi:', usersErr ? `HATA: ${usersErr.message}` : `BASARILI (Kullanici Sayisi: ${usersData.users.length})`);

  // 3. Tablo Kontrolu
  const { data: tableData, error: tableErr } = await admin.from('profiles').select('*').limit(1);
  if (tableErr) {
    console.log('3. "profiles" Tablosu:', 'Henuz olusturulmamis (' + tableErr.message + ')');
  } else {
    console.log('3. "profiles" Tablosu: MEVCUT VE AKTIF!');
  }
}

run();

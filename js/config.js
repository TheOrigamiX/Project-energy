/* ตั้งค่า Supabase (anon key ออกแบบให้เปิดเผยได้ ความปลอดภัยอยู่ที่ RLS ใน supabase.sql) */
const SUPABASE_CONFIG = {
  url: 'https://paiendfzrcwkxmypkugu.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhaWVuZGZ6cmN3a3hteXBrdWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDIzMjUsImV4cCI6MjEwODI3ODMyNX0.Wke0XL0dCm8T01hOMXModzeFV2LTccdzaKLWP-JxucE'
};

/* Cloudflare Turnstile Site Key (เปิดเผยได้) ปล่อยว่าง = ปิด CAPTCHA ในเกม (ต้องปิดใน Supabase ด้วย) */
const TURNSTILE_SITE_KEY = '0x4AAAAAAFilumFIyO91Pvdv';

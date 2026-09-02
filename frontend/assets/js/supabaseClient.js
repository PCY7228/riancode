// กรุณาเปลี่ยน URL และ KEY ด้านล่างนี้ให้เป็นของโปรเจกต์คุณจากหน้า Settings > API ของ Supabase
const SUPABASE_URL = 'https://wsebjpmolmrfuhqjwcqy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZWJqcG1vbG1yZnVocWp3Y3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMDkwMzUsImV4cCI6MjEwMzU4NTAzNX0.Vx0QHT07v237bCE5FEva2MPlxiSCMu6aoY8XrVh4SJ8';

// ตรวจสอบว่ามี Library supabase โหลดมาแล้วหรือไม่
if (typeof supabase === 'undefined') {
    console.error('Supabase library is not loaded. Make sure to include the CDN script.');
}

// สร้าง Supabase Client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

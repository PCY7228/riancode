-- สร้างตาราง profiles สำหรับเก็บข้อมูลผู้ใช้งาน
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  full_name text,
  avatar_url text,
  bio text,
  github_url text,
  linkedin_url text,
  role text DEFAULT 'user'::text,
  updated_at timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- เปิดการใช้งาน Row Level Security (RLS) สำหรับตาราง profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: ทุกคนสามารถดูโปรไฟล์ของคนอื่นได้ (หรือจะจำกัดเฉพาะคนที่ล็อกอินก็ได้)
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

-- Policy: ผู้ใช้สามารถแก้ไขโปรไฟล์ของตัวเองได้เท่านั้น
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- ฟังก์ชันสำหรับสร้าง profile อัตโนมัติเมื่อมีการ Sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$;

-- Trigger ที่จะเรียกใช้ฟังก์ชันด้านบนเมื่อมี User ใหม่ถูกเพิ่มเข้ามาในระบบ
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- สร้าง Storage Bucket ชื่อ 'avatars' สำหรับเก็บรูปภาพ
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Policy สำหรับ Storage
-- Policy: ทุกคนสามารถดูรูปใน avatars bucket ได้
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- Policy: ผู้ใช้ที่ล็อกอินเท่านั้นที่สามารถอัปโหลดไฟล์ลงใน avatars bucket ได้
CREATE POLICY "Anyone can upload an avatar."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Policy: ผู้ใช้สามารถลบ/อัปเดตไฟล์ภาพโปรไฟล์ของตัวเองได้เท่านั้น (ถ้าโครงสร้าง path ของไฟล์คือ 'user_id/filename.jpg')
CREATE POLICY "Users can update their own avatars."
  ON storage.objects FOR UPDATE
  USING ( auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can delete their own avatars."
  ON storage.objects FOR DELETE
  USING ( auth.uid()::text = (storage.foldername(name))[1] );

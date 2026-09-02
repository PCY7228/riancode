-- Migration: Add bio, github, and linkedin fields to profiles table

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS github_url text,
ADD COLUMN IF NOT EXISTS linkedin_url text;

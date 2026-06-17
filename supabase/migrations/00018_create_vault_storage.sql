-- Migration 00018: Create vault storage bucket + knowledge_base RLS
-- Vault uploads use the 'onboarding' storage bucket for file storage

-- 1. Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'onboarding',
  'onboarding',
  false,                     -- private bucket
  10485760,                  -- 10 MB file size limit
  ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/png','image/jpeg','image/jpg','text/plain','text/csv','text/markdown']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS: Authenticated users can read/upload only their own files
CREATE POLICY "Users can upload their own vault files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'onboarding'
  AND (storage.foldername(name))[1] = 'vault'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can read their own vault files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'onboarding'
  AND (storage.foldername(name))[1] = 'vault'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete their own vault files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'onboarding'
  AND (storage.foldername(name))[1] = 'vault'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 3. RLS on knowledge_base table for vault access
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own vault entries"
ON public.knowledge_base
FOR SELECT
TO authenticated
USING (org_id = auth.uid());

CREATE POLICY "Users can create their own vault entries"
ON public.knowledge_base
FOR INSERT
TO authenticated
WITH CHECK (org_id = auth.uid());

CREATE POLICY "Users can delete their own vault entries"
ON public.knowledge_base
FOR DELETE
TO authenticated
USING (org_id = auth.uid());

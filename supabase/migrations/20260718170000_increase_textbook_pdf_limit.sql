-- Supabase Pro supports larger files. Keep the application-specific textbook
-- ceiling at 500 MB while continuing to accept PDF objects only.
UPDATE storage.buckets
SET
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['application/pdf']
WHERE id = 'textbook-pdfs';

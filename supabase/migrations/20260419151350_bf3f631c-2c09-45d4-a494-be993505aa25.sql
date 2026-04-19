
-- Create public bucket for orcafacil assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcafacil', 'orcafacil', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read
CREATE POLICY "Public read orcafacil"
ON storage.objects FOR SELECT
USING (bucket_id = 'orcafacil');

-- Anyone can upload (no auth in this app)
CREATE POLICY "Anyone can upload orcafacil"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'orcafacil');

-- Anyone can update
CREATE POLICY "Anyone can update orcafacil"
ON storage.objects FOR UPDATE
USING (bucket_id = 'orcafacil');

-- Anyone can delete
CREATE POLICY "Anyone can delete orcafacil"
ON storage.objects FOR DELETE
USING (bucket_id = 'orcafacil');

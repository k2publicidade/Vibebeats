-- ============================================================
-- VibeBeats - Fix Storage COMPLETO
-- Execute este SQL no Supabase SQL Editor
-- Created: 2026-01-16
-- ============================================================

-- =====================
-- STEP 1: Criar buckets (se não existem)
-- =====================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio',
    'audio',
    TRUE,
    52428800, -- 50MB
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac']
)
ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 52428800;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'covers',
    'covers',
    TRUE,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 10485760;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    TRUE,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 5242880;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-downloads',
    'audio-downloads',
    FALSE,
    104857600, -- 100MB
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 104857600;

-- =====================
-- STEP 2: Remover TODAS as policies antigas de storage
-- =====================

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- =====================
-- STEP 3: Criar policies SELECT (público)
-- =====================

CREATE POLICY "Public read audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

CREATE POLICY "Public read covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- =====================
-- STEP 4: Criar policies INSERT (authenticated na própria pasta)
-- =====================

CREATE POLICY "Auth upload audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'audio'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Auth upload covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Auth upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Auth upload downloads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'audio-downloads'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================
-- STEP 5: Criar policies UPDATE/DELETE (apenas dono)
-- =====================

CREATE POLICY "Owner update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);

-- =====================
-- STEP 6: Verificar buckets
-- =====================

SELECT id, name, public, file_size_limit FROM storage.buckets;

-- =====================
-- STEP 7: Verificar policies criadas
-- =====================

SELECT policyname, cmd FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

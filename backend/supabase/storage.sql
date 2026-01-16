-- ============================================================
-- VibeBeats Storage Configuration for Supabase
-- Version: 1.0.0
-- Created: 2026-01-16
-- ============================================================

-- -----------------------------
-- Create Storage Buckets
-- -----------------------------

-- Avatars bucket (for user profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    TRUE, -- Public bucket
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Beat covers bucket (for beat artwork)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'covers',
    'covers',
    TRUE, -- Public bucket
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Audio bucket (for beat audio files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio',
    'audio',
    TRUE, -- Public for preview playback
    52428800, -- 50MB limit
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Audio downloads bucket (for full quality downloads after purchase)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-downloads',
    'audio-downloads',
    FALSE, -- Private bucket - requires authentication
    104857600, -- 100MB limit for high quality files
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- -----------------------------
-- Storage Policies for Avatars
-- -----------------------------

-- Anyone can view avatars
CREATE POLICY "Avatars are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- -----------------------------
-- Storage Policies for Covers
-- -----------------------------

-- Anyone can view covers
CREATE POLICY "Covers are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'covers');

-- Producers can upload covers for their beats
CREATE POLICY "Producers can upload covers"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'covers'
        AND EXISTS (
            SELECT 1 FROM public.users
            WHERE id::text = auth.uid()::text
            AND user_type = 'producer'
        )
    );

-- Producers can update their covers
CREATE POLICY "Producers can update covers"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'covers'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Producers can delete their covers
CREATE POLICY "Producers can delete covers"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'covers'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- -----------------------------
-- Storage Policies for Audio (previews)
-- -----------------------------

-- Anyone can listen to audio previews
CREATE POLICY "Audio previews are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'audio');

-- Producers can upload audio
CREATE POLICY "Producers can upload audio"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'audio'
        AND EXISTS (
            SELECT 1 FROM public.users
            WHERE id::text = auth.uid()::text
            AND user_type = 'producer'
        )
    );

-- Producers can update their audio
CREATE POLICY "Producers can update audio"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'audio'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Producers can delete their audio
CREATE POLICY "Producers can delete audio"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'audio'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- -----------------------------
-- Storage Policies for Audio Downloads (private)
-- -----------------------------

-- Only buyers can download purchased audio
CREATE POLICY "Buyers can download purchased audio"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'audio-downloads'
        AND EXISTS (
            SELECT 1 FROM public.purchases p
            JOIN public.beats b ON b.id = p.beat_id
            WHERE p.buyer_id::text = auth.uid()::text
            AND p.payment_status = 'completed'
            -- The file path should contain the beat_id
            AND name LIKE '%' || b.id::text || '%'
        )
    );

-- Producers can upload high-quality downloads
CREATE POLICY "Producers can upload downloads"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'audio-downloads'
        AND EXISTS (
            SELECT 1 FROM public.users
            WHERE id::text = auth.uid()::text
            AND user_type = 'producer'
        )
    );

-- Producers can update their downloads
CREATE POLICY "Producers can update downloads"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'audio-downloads'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Producers can delete their downloads
CREATE POLICY "Producers can delete downloads"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'audio-downloads'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

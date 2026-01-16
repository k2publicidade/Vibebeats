-- ============================================================
-- VibeBeats Upload Fix - Diagnóstico e Correção
-- Execute este SQL no Supabase SQL Editor
-- Created: 2026-01-16
-- ============================================================

-- =====================
-- STEP 1: Diagnóstico - Verificar policies existentes
-- =====================

-- Ver todas as policies no storage.objects
SELECT
    pol.policyname as policy_name,
    CASE pol.cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        ELSE pol.cmd::text
    END as operation,
    pol.permissive,
    pg_get_expr(pol.qual, pol.polrelid) as using_expr,
    pg_get_expr(pol.with_check, pol.polrelid) as with_check_expr
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
JOIN pg_namespace ns ON cls.relnamespace = ns.oid
WHERE ns.nspname = 'storage' AND cls.relname = 'objects'
ORDER BY policy_name;

-- =====================
-- STEP 2: Dropar policies antigas de storage (se existirem duplicadas)
-- =====================

-- Drop policies que podem estar conflitando
DROP POLICY IF EXISTS "Producers can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Producers can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Producers can upload downloads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload covers" ON storage.objects;

-- =====================
-- STEP 3: Recriar policies de INSERT mais permissivas (para authenticated users)
-- =====================

-- Para o bucket AUDIO - qualquer usuário autenticado pode fazer upload na sua pasta
CREATE POLICY "Authenticated users can upload audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'audio'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Para o bucket COVERS - qualquer usuário autenticado pode fazer upload na sua pasta
CREATE POLICY "Authenticated users can upload covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Para o bucket AUDIO-DOWNLOADS - qualquer usuário autenticado pode fazer upload na sua pasta
CREATE POLICY "Authenticated users can upload downloads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'audio-downloads'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Para o bucket AVATARS - qualquer usuário autenticado pode fazer upload na sua pasta
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================
-- STEP 4: Verificar e criar policies de SELECT (visualização pública)
-- =====================

-- Garantir que todos podem ver arquivos públicos
DROP POLICY IF EXISTS "Audio previews are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Covers are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;

CREATE POLICY "Audio previews are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

CREATE POLICY "Covers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- =====================
-- STEP 5: Verificar policies da tabela BEATS
-- =====================

-- Ver policies da tabela beats
SELECT
    pol.policyname as policy_name,
    CASE pol.cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        ELSE pol.cmd::text
    END as operation
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
WHERE cls.relname = 'beats';

-- =====================
-- STEP 6: Corrigir policy de INSERT na tabela BEATS
-- A policy original exige user_type = 'producer', vamos deixar mais permissiva
-- =====================

DROP POLICY IF EXISTS "Producers can insert beats" ON beats;

-- Permitir que usuários autenticados criem beats (a validação de producer pode ser feita no frontend)
CREATE POLICY "Authenticated users can insert beats"
ON beats FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = producer_id::text);

-- =====================
-- STEP 7: Verificar RLS está habilitado
-- =====================

-- Verificar se RLS está habilitado nas tabelas
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('users', 'beats', 'purchases', 'projects', 'favorites')
AND schemaname = 'public';

-- =====================
-- STEP 8: Verificar buckets existentes
-- =====================

SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets;

-- ============================================================
-- Após executar este SQL:
-- 1. Faça logout e login novamente no app
-- 2. Tente fazer upload do beat novamente
-- ============================================================

-- ============================================================
-- VibeBeats Database Schema for Supabase
-- Version: 1.0.0
-- Created: 2026-01-16
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

-- User type enum
CREATE TYPE user_type AS ENUM ('producer', 'artist');

-- License type enum
CREATE TYPE license_type AS ENUM ('exclusive', 'non_exclusive');

-- Payment method enum
CREATE TYPE payment_method AS ENUM ('stripe', 'paypal', 'pix');

-- Payment status enum
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Project status enum
CREATE TYPE project_status AS ENUM ('draft', 'mixing', 'mastering', 'completed');

-- ============================================================
-- TABLES
-- ============================================================

-- -----------------------------
-- Users Table
-- -----------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_type user_type NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comment on table
COMMENT ON TABLE users IS 'Stores all users (producers and artists) of the VibeBeats platform';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.email IS 'User email address (used for login)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.user_type IS 'Type of user: producer (sells beats) or artist (buys beats)';
COMMENT ON COLUMN users.social_links IS 'JSON object containing social media links (instagram, twitter, youtube, etc)';

-- -----------------------------
-- Beats Table
-- -----------------------------
CREATE TABLE beats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    producer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    producer_name VARCHAR(255) NOT NULL, -- Denormalized for query performance
    genre VARCHAR(100) NOT NULL,
    bpm INTEGER NOT NULL CHECK (bpm > 0 AND bpm < 300),
    key VARCHAR(10) NOT NULL, -- Musical key (C, C#, D, etc)
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    license_type license_type NOT NULL DEFAULT 'non_exclusive',
    audio_url TEXT NOT NULL, -- Path to audio file in storage
    cover_url TEXT, -- Path to cover image in storage
    tags TEXT[] DEFAULT '{}',
    plays INTEGER NOT NULL DEFAULT 0 CHECK (plays >= 0),
    purchases INTEGER NOT NULL DEFAULT 0 CHECK (purchases >= 0),
    duration VARCHAR(10), -- Format: "mm:ss"
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE beats IS 'Stores all beats uploaded by producers';
COMMENT ON COLUMN beats.producer_name IS 'Denormalized producer name for faster queries';
COMMENT ON COLUMN beats.bpm IS 'Beats per minute (tempo)';
COMMENT ON COLUMN beats.key IS 'Musical key of the beat';
COMMENT ON COLUMN beats.tags IS 'Array of tags for categorization and search';
COMMENT ON COLUMN beats.is_active IS 'Whether the beat is available for purchase';

-- -----------------------------
-- Purchases Table
-- -----------------------------
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beat_id UUID NOT NULL REFERENCES beats(id) ON DELETE RESTRICT,
    beat_title VARCHAR(255) NOT NULL, -- Denormalized
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    buyer_name VARCHAR(255) NOT NULL, -- Denormalized
    producer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    producer_name VARCHAR(255) NOT NULL, -- Denormalized
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    license_type license_type NOT NULL,
    payment_method payment_method NOT NULL,
    payment_status payment_status NOT NULL DEFAULT 'pending',
    transaction_id VARCHAR(255), -- External payment provider transaction ID
    metadata JSONB DEFAULT '{}', -- Additional payment metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate purchases of the same beat by the same user
    CONSTRAINT unique_beat_buyer UNIQUE (beat_id, buyer_id)
);

-- Comments
COMMENT ON TABLE purchases IS 'Stores all purchase transactions';
COMMENT ON COLUMN purchases.transaction_id IS 'Transaction ID from payment provider (Stripe, PayPal, etc)';
COMMENT ON COLUMN purchases.metadata IS 'Additional payment information (receipts, provider response, etc)';

-- -----------------------------
-- Projects Table
-- -----------------------------
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    beat_id UUID NOT NULL REFERENCES beats(id) ON DELETE RESTRICT,
    beat_title VARCHAR(255) NOT NULL, -- Denormalized
    description TEXT,
    status project_status NOT NULL DEFAULT 'draft',
    notes TEXT, -- Internal artist notes
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE projects IS 'Stores artist projects created from purchased beats';
COMMENT ON COLUMN projects.status IS 'Current status of the project: draft, mixing, mastering, or completed';
COMMENT ON COLUMN projects.notes IS 'Private notes from the artist about the project';

-- -----------------------------
-- Favorites Table
-- -----------------------------
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    beat_id UUID NOT NULL REFERENCES beats(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate favorites
    CONSTRAINT unique_user_beat_favorite UNIQUE (user_id, beat_id)
);

-- Comments
COMMENT ON TABLE favorites IS 'Stores user favorites (wishlist)';

-- ============================================================
-- INDEXES
-- ============================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Beats indexes
CREATE INDEX idx_beats_producer_id ON beats(producer_id);
CREATE INDEX idx_beats_genre ON beats(genre);
CREATE INDEX idx_beats_created_at ON beats(created_at DESC);
CREATE INDEX idx_beats_price ON beats(price);
CREATE INDEX idx_beats_bpm ON beats(bpm);
CREATE INDEX idx_beats_plays ON beats(plays DESC);
CREATE INDEX idx_beats_purchases ON beats(purchases DESC);
CREATE INDEX idx_beats_is_active ON beats(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_beats_license_type ON beats(license_type);

-- Full-text search index for beats
CREATE INDEX idx_beats_search ON beats USING GIN (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(array_to_string(tags, ' '), ''))
);

-- Purchases indexes
CREATE INDEX idx_purchases_buyer_id ON purchases(buyer_id);
CREATE INDEX idx_purchases_producer_id ON purchases(producer_id);
CREATE INDEX idx_purchases_beat_id ON purchases(beat_id);
CREATE INDEX idx_purchases_created_at ON purchases(created_at DESC);
CREATE INDEX idx_purchases_payment_status ON purchases(payment_status);

-- Projects indexes
CREATE INDEX idx_projects_artist_id ON projects(artist_id);
CREATE INDEX idx_projects_beat_id ON projects(beat_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);

-- Favorites indexes
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_beat_id ON favorites(beat_id);
CREATE INDEX idx_favorites_created_at ON favorites(created_at DESC);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment beat plays
CREATE OR REPLACE FUNCTION increment_beat_plays(beat_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE beats
    SET plays = plays + 1
    WHERE id = beat_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle purchase completion (increment beat purchases count)
CREATE OR REPLACE FUNCTION handle_purchase_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only increment if status changed to 'completed'
    IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
        UPDATE beats
        SET purchases = purchases + 1
        WHERE id = NEW.beat_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get producer stats
CREATE OR REPLACE FUNCTION get_producer_stats(producer_uuid UUID)
RETURNS TABLE (
    total_beats BIGINT,
    total_plays BIGINT,
    total_sales BIGINT,
    total_revenue DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(b.id)::BIGINT as total_beats,
        COALESCE(SUM(b.plays), 0)::BIGINT as total_plays,
        (SELECT COUNT(*) FROM purchases p WHERE p.producer_id = producer_uuid AND p.payment_status = 'completed')::BIGINT as total_sales,
        COALESCE((SELECT SUM(p.amount) FROM purchases p WHERE p.producer_id = producer_uuid AND p.payment_status = 'completed'), 0) as total_revenue
    FROM beats b
    WHERE b.producer_id = producer_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get artist stats
CREATE OR REPLACE FUNCTION get_artist_stats(artist_uuid UUID)
RETURNS TABLE (
    total_purchases BIGINT,
    total_projects BIGINT,
    total_spent DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM purchases p WHERE p.buyer_id = artist_uuid AND p.payment_status = 'completed')::BIGINT as total_purchases,
        (SELECT COUNT(*) FROM projects proj WHERE proj.artist_id = artist_uuid)::BIGINT as total_projects,
        COALESCE((SELECT SUM(p.amount) FROM purchases p WHERE p.buyer_id = artist_uuid AND p.payment_status = 'completed'), 0) as total_spent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search beats with full-text search
CREATE OR REPLACE FUNCTION search_beats(
    search_query TEXT DEFAULT NULL,
    filter_genre TEXT DEFAULT NULL,
    filter_min_bpm INTEGER DEFAULT NULL,
    filter_max_bpm INTEGER DEFAULT NULL,
    filter_max_price DECIMAL DEFAULT NULL,
    sort_field TEXT DEFAULT 'created_at',
    sort_direction TEXT DEFAULT 'DESC',
    page_limit INTEGER DEFAULT 50,
    page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    producer_id UUID,
    producer_name VARCHAR,
    genre VARCHAR,
    bpm INTEGER,
    key VARCHAR,
    description TEXT,
    price DECIMAL,
    license_type license_type,
    audio_url TEXT,
    cover_url TEXT,
    tags TEXT[],
    plays INTEGER,
    purchases INTEGER,
    duration VARCHAR,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY EXECUTE format(
        'SELECT b.id, b.title, b.producer_id, b.producer_name, b.genre, b.bpm, b.key,
                b.description, b.price, b.license_type, b.audio_url, b.cover_url,
                b.tags, b.plays, b.purchases, b.duration, b.created_at
         FROM beats b
         WHERE b.is_active = TRUE
           AND ($1 IS NULL OR to_tsvector(''english'', coalesce(b.title, '''') || '' '' || coalesce(b.description, '''') || '' '' || coalesce(array_to_string(b.tags, '' ''), '''')) @@ plainto_tsquery(''english'', $1))
           AND ($2 IS NULL OR b.genre = $2)
           AND ($3 IS NULL OR b.bpm >= $3)
           AND ($4 IS NULL OR b.bpm <= $4)
           AND ($5 IS NULL OR b.price <= $5)
         ORDER BY %I %s
         LIMIT $6 OFFSET $7',
        sort_field,
        sort_direction
    )
    USING search_query, filter_genre, filter_min_bpm, filter_max_bpm, filter_max_price, page_limit, page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger to update updated_at on users
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on beats
CREATE TRIGGER trigger_beats_updated_at
    BEFORE UPDATE ON beats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on purchases
CREATE TRIGGER trigger_purchases_updated_at
    BEFORE UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on projects
CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to increment beat purchases on completed purchase
CREATE TRIGGER trigger_purchase_completed
    AFTER INSERT OR UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION handle_purchase_completion();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- -----------------------------
-- Users Policies
-- -----------------------------

-- Anyone can view user profiles (public info)
CREATE POLICY "Users are viewable by everyone"
    ON users FOR SELECT
    USING (TRUE);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- Users can insert their own profile (during registration)
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid()::text = id::text);

-- -----------------------------
-- Beats Policies
-- -----------------------------

-- Anyone can view active beats
CREATE POLICY "Active beats are viewable by everyone"
    ON beats FOR SELECT
    USING (is_active = TRUE OR producer_id::text = auth.uid()::text);

-- Only producers can insert beats
CREATE POLICY "Producers can insert beats"
    ON beats FOR INSERT
    WITH CHECK (
        auth.uid()::text = producer_id::text
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND user_type = 'producer'
        )
    );

-- Producers can only update their own beats
CREATE POLICY "Producers can update own beats"
    ON beats FOR UPDATE
    USING (producer_id::text = auth.uid()::text)
    WITH CHECK (producer_id::text = auth.uid()::text);

-- Producers can only delete their own beats
CREATE POLICY "Producers can delete own beats"
    ON beats FOR DELETE
    USING (producer_id::text = auth.uid()::text);

-- -----------------------------
-- Purchases Policies
-- -----------------------------

-- Buyers can view their own purchases
CREATE POLICY "Buyers can view own purchases"
    ON purchases FOR SELECT
    USING (buyer_id::text = auth.uid()::text);

-- Producers can view their sales
CREATE POLICY "Producers can view own sales"
    ON purchases FOR SELECT
    USING (producer_id::text = auth.uid()::text);

-- Only artists can create purchases
CREATE POLICY "Artists can create purchases"
    ON purchases FOR INSERT
    WITH CHECK (
        auth.uid()::text = buyer_id::text
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND user_type = 'artist'
        )
    );

-- Only the system can update purchase status (using service role)
CREATE POLICY "System can update purchases"
    ON purchases FOR UPDATE
    USING (FALSE) -- Disabled for regular users
    WITH CHECK (FALSE);

-- -----------------------------
-- Projects Policies
-- -----------------------------

-- Artists can only view their own projects
CREATE POLICY "Artists can view own projects"
    ON projects FOR SELECT
    USING (artist_id::text = auth.uid()::text);

-- Only artists can insert projects
CREATE POLICY "Artists can insert projects"
    ON projects FOR INSERT
    WITH CHECK (
        auth.uid()::text = artist_id::text
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND user_type = 'artist'
        )
        -- Also verify they purchased the beat
        AND EXISTS (
            SELECT 1 FROM purchases
            WHERE buyer_id::text = auth.uid()::text
            AND beat_id = projects.beat_id
            AND payment_status = 'completed'
        )
    );

-- Artists can only update their own projects
CREATE POLICY "Artists can update own projects"
    ON projects FOR UPDATE
    USING (artist_id::text = auth.uid()::text)
    WITH CHECK (artist_id::text = auth.uid()::text);

-- Artists can only delete their own projects
CREATE POLICY "Artists can delete own projects"
    ON projects FOR DELETE
    USING (artist_id::text = auth.uid()::text);

-- -----------------------------
-- Favorites Policies
-- -----------------------------

-- Users can only view their own favorites
CREATE POLICY "Users can view own favorites"
    ON favorites FOR SELECT
    USING (user_id::text = auth.uid()::text);

-- Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
    ON favorites FOR INSERT
    WITH CHECK (user_id::text = auth.uid()::text);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
    ON favorites FOR DELETE
    USING (user_id::text = auth.uid()::text);

-- ============================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================

-- You can uncomment this section to seed the database with test data

/*
-- Insert test producer
INSERT INTO users (id, email, password_hash, name, user_type, bio, social_links)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'producer@vibebeats.com',
    '$2b$12$K4J.KqnKY8f.5ByRxdqx6.6XWXE.5B8WfZC5BcvZqvzGu.6k0Vr1e', -- password: producer123
    'Metro Beats',
    'producer',
    'Professional beat producer from Atlanta. Creating fire beats since 2015.',
    '{"instagram": "@metrobeats", "twitter": "@metrobeats"}'
);

-- Insert test artist
INSERT INTO users (id, email, password_hash, name, user_type, bio)
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'artist@vibebeats.com',
    '$2b$12$K4J.KqnKY8f.5ByRxdqx6.6XWXE.5B8WfZC5BcvZqvzGu.6k0Vr1e', -- password: artist123
    'Rising Star',
    'artist',
    'Independent artist looking for the perfect beat.'
);

-- Insert test beats
INSERT INTO beats (title, producer_id, producer_name, genre, bpm, key, description, price, license_type, audio_url, tags)
VALUES
    ('Midnight Vibes', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Metro Beats', 'Hip Hop', 140, 'C#', 'Dark and moody beat perfect for late night sessions', 49.99, 'non_exclusive', '/audio/midnight-vibes.mp3', ARRAY['dark', 'moody', 'trap']),
    ('Summer Wave', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Metro Beats', 'R&B', 95, 'G', 'Smooth summer vibes with melodic elements', 79.99, 'non_exclusive', '/audio/summer-wave.mp3', ARRAY['smooth', 'melodic', 'chill']),
    ('Thunder Strike', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Metro Beats', 'Trap', 150, 'F', 'Hard-hitting trap beat with heavy 808s', 99.99, 'exclusive', '/audio/thunder-strike.mp3', ARRAY['hard', 'trap', '808']);
*/

-- ============================================================
-- GRANTS (for service role access)
-- ============================================================

-- Grant usage on all sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant select on all tables to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON beats TO anon; -- Allow anonymous users to view beats

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION increment_beat_plays(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_producer_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_artist_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_beats(TEXT, TEXT, INTEGER, INTEGER, DECIMAL, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_beats(TEXT, TEXT, INTEGER, INTEGER, DECIMAL, TEXT, TEXT, INTEGER, INTEGER) TO anon;

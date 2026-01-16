import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://sjwyyxwccooyoxbzrthq.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_DcWTysoG_zzS3ucHOivslA_ouwqhKJh';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for common operations

// Auth helpers
export const signUp = async (email, password, userData) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  });
  return { data, error };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// User profile helpers
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

// Beats helpers
export const getBeats = async (filters = {}) => {
  let query = supabase
    .from('beats')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (filters.genre) {
    query = query.eq('genre', filters.genre);
  }
  if (filters.minBpm) {
    query = query.gte('bpm', filters.minBpm);
  }
  if (filters.maxBpm) {
    query = query.lte('bpm', filters.maxBpm);
  }
  if (filters.maxPrice) {
    query = query.lte('price', filters.maxPrice);
  }
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,producer_name.ilike.%${filters.search}%`);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  return { data, error };
};

export const getBeat = async (beatId) => {
  const { data, error } = await supabase
    .from('beats')
    .select('*')
    .eq('id', beatId)
    .single();
  return { data, error };
};

export const getProducerBeats = async (producerId) => {
  const { data, error } = await supabase
    .from('beats')
    .select('*')
    .eq('producer_id', producerId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createBeat = async (beatData) => {
  const { data, error } = await supabase
    .from('beats')
    .insert(beatData)
    .select()
    .single();
  return { data, error };
};

export const updateBeat = async (beatId, updates) => {
  const { data, error } = await supabase
    .from('beats')
    .update(updates)
    .eq('id', beatId)
    .select()
    .single();
  return { data, error };
};

export const deleteBeat = async (beatId) => {
  const { error } = await supabase
    .from('beats')
    .delete()
    .eq('id', beatId);
  return { error };
};

export const incrementBeatPlays = async (beatId) => {
  const { error } = await supabase.rpc('increment_beat_plays', { beat_uuid: beatId });
  return { error };
};

// Purchases helpers
export const createPurchase = async (purchaseData) => {
  const { data, error } = await supabase
    .from('purchases')
    .insert(purchaseData)
    .select()
    .single();
  return { data, error };
};

export const getUserPurchases = async (userId) => {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const getProducerSales = async (producerId) => {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('producer_id', producerId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const checkBeatPurchased = async (beatId, userId) => {
  const { data, error } = await supabase
    .from('purchases')
    .select('id')
    .eq('beat_id', beatId)
    .eq('buyer_id', userId)
    .eq('payment_status', 'completed')
    .single();
  return { purchased: !!data && !error };
};

// Projects helpers
export const createProject = async (projectData) => {
  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();
  return { data, error };
};

export const getUserProjects = async (userId) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('artist_id', userId)
    .order('updated_at', { ascending: false });
  return { data, error };
};

export const updateProject = async (projectId, updates) => {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();
  return { data, error };
};

export const deleteProject = async (projectId) => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);
  return { error };
};

// Favorites helpers
export const addFavorite = async (userId, beatId) => {
  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, beat_id: beatId })
    .select()
    .single();
  return { data, error };
};

export const removeFavorite = async (userId, beatId) => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('beat_id', beatId);
  return { error };
};

export const getUserFavorites = async (userId) => {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, beats(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const checkIsFavorite = async (userId, beatId) => {
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('beat_id', beatId)
    .single();
  return { isFavorite: !!data && !error };
};

// Producers helpers
export const getProducers = async (options = {}) => {
  let query = supabase
    .from('users')
    .select('*')
    .eq('user_type', 'producer')
    .order('created_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  return { data, error };
};

// Stats helpers
export const getProducerStats = async (producerId) => {
  const { data, error } = await supabase.rpc('get_producer_stats', { producer_uuid: producerId });
  return { data: data?.[0], error };
};

export const getArtistStats = async (artistId) => {
  const { data, error } = await supabase.rpc('get_artist_stats', { artist_uuid: artistId });
  return { data: data?.[0], error };
};

// Storage helpers
export const uploadFile = async (bucket, path, file) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });
  return { data, error };
};

export const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const deleteFile = async (bucket, path) => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return { error };
};

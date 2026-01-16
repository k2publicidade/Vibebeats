import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import Home from '@/pages/Home';
import Auth from '@/pages/Auth';
import Profile from '@/pages/Profile';
import BeatDetail from '@/pages/BeatDetail';
import UploadBeat from '@/pages/UploadBeat';
import MyPurchases from '@/pages/MyPurchases';
import MyProjects from '@/pages/MyProjects';
import Workspace from '@/pages/Workspace';
import ProducerProfile from '@/pages/ProducerProfile';
import Artists from '@/pages/Artists';
import Charts from '@/pages/Charts';
import About from '@/pages/About';
import Checkout from '@/pages/Checkout';
import Favorites from '@/pages/Favorites';
import { Toaster } from '@/components/ui/sonner';
import { PlayerProvider, GlobalPlayer } from '@/components/GlobalPlayer';
import { CartProvider } from '@/contexts/CartContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import Cart from '@/components/Cart';
import { supabase, getUserProfile, signOut as supabaseSignOut } from '@/lib/supabase';

// Supabase storage URL helper
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://sjwyyxwccooyoxbzrthq.supabase.co';

export const getFileUrl = (bucket, path) => {
  if (!path) return null;
  // If it's already a full URL, return as is
  if (path.startsWith('http')) return path;
  // Otherwise, build Supabase storage URL
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
};

// Helper for avatar URLs
export const getAvatarUrl = (path) => getFileUrl('avatars', path);

// Helper for beat cover URLs
export const getCoverUrl = (path) => getFileUrl('covers', path);

// Helper for audio URLs
export const getAudioUrl = (path) => getFileUrl('audio', path);

export const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          // Fetch user profile from database
          const { data: profileData } = await getUserProfile(session.user.id);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          const { data: profileData } = await getUserProfile(session.user.id);
          setProfile(profileData);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = (userData, profileData) => {
    setUser(userData);
    setProfile(profileData);
  };

  const logout = async () => {
    await supabaseSignOut();
    setUser(null);
    setProfile(null);
  };

  // Combined user object for backwards compatibility
  const combinedUser = profile ? {
    ...profile,
    email: user?.email,
    auth_id: user?.id
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#ff0400]/30 border-t-[#ff0400] rounded-full animate-spin" />
          <span className="text-gray-400">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user: combinedUser, login, logout, supabaseUser: user }}>
      <CartProvider>
        <FavoritesProvider>
          <PlayerProvider>
            <div className="App">
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={!combinedUser ? <Auth /> : <Navigate to="/" />} />
                  <Route path="/profile" element={combinedUser ? <Profile /> : <Navigate to="/auth" />} />
                  <Route path="/beat/:id" element={<BeatDetail />} />
                  <Route path="/upload" element={combinedUser?.user_type === 'producer' ? <UploadBeat /> : <Navigate to="/" />} />
                  <Route path="/my-purchases" element={combinedUser?.user_type === 'artist' ? <MyPurchases /> : <Navigate to="/" />} />
                  <Route path="/my-projects" element={combinedUser?.user_type === 'artist' ? <MyProjects /> : <Navigate to="/" />} />
                  <Route path="/workspace/:id" element={combinedUser?.user_type === 'artist' ? <Workspace /> : <Navigate to="/" />} />
                  <Route path="/producer/:id" element={<ProducerProfile />} />
                  <Route path="/artists" element={<Artists />} />
                  <Route path="/charts" element={<Charts />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/checkout" element={combinedUser?.user_type === 'artist' ? <Checkout /> : <Navigate to="/auth" />} />
                  <Route path="/favorites" element={<Favorites />} />
                </Routes>
                <GlobalPlayer />
                <Cart />
              </BrowserRouter>
              <Toaster position="top-center" richColors />
            </div>
          </PlayerProvider>
        </FavoritesProvider>
      </CartProvider>
    </AuthContext.Provider>
  );
}

export default App;

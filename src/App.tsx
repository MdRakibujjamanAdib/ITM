/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link } from 'react-router';
import { HomePage } from './pages/HomePage';
import { CapturePage } from './pages/CapturePage';
import { NotePage } from './pages/NotePage';
import { NetworkPage } from './pages/NetworkPage';
import { ProfilePage } from './pages/ProfilePage';
import { useEffect, useState } from 'react';
import { auth, loginWithGoogle, logout } from './firebase/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#FDFCFB] text-[#121212] flex flex-col font-serif selection:bg-[#121212] selection:text-white">
        <header className="flex justify-between items-baseline px-6 sm:px-8 py-6 border-b border-[#121212]/10 bg-[#FDFCFB] sticky top-0 z-10 w-full">
          <div className="flex items-center gap-4 sm:gap-8 max-w-5xl mx-auto w-full justify-between">
            <Link to="/" className="flex items-center gap-4">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter leading-none mt-1">KNOWLEDGE<br className="hidden sm:block"/>TREE</h1>
              <div className="hidden md:block text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-[#121212]/40">
                AI-Powered Note Digitization<br/>& Collaborative Archive
              </div>
            </Link>
            
            <nav className="hidden sm:flex gap-6 font-sans text-xs font-bold uppercase tracking-widest items-center">
              <Link to="/capture" className="hover:opacity-50 transition-opacity">Scan Now</Link>
              <Link to="/network" className="hover:opacity-50 transition-opacity">Network</Link>
              {user ? (
                <>
                  <Link to="/profile" className="px-4 py-2 bg-[#121212] text-white hover:opacity-80 transition-opacity">Profile</Link>
                  <button onClick={logout} className="hover:opacity-50 transition-opacity cursor-pointer">
                    Logout
                  </button>
                </>
              ) : (
                <button onClick={loginWithGoogle} className="px-4 py-2 bg-[#121212] text-white hover:opacity-80 transition-opacity cursor-pointer">
                  Login
                </button>
              )}
            </nav>
          </div>
        </header>
        
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage user={user} />} />
            <Route path="/capture" element={<CapturePage user={user} />} />
            <Route path="/notes/:id" element={<NotePage user={user} />} />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/profile" element={<ProfilePage user={user} />} />
          </Routes>
        </main>
        
        <footer className="h-16 mt-auto border-t border-[#121212]/10 bg-[#121212] text-white flex items-center px-4 sm:px-8 justify-between font-sans text-[9px] uppercase tracking-[0.2em] font-bold">
          <span>Knowledge Tree Protocol v1.2</span>
          <span className="hidden sm:block animate-pulse text-amber-400">System Status: Optimal</span>
          <span>&copy; {new Date().getFullYear()} AI Collaborative Archive</span>
        </footer>
      </div>
    </BrowserRouter>
  );
}


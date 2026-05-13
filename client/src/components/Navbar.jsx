import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-[1000] bg-white shadow-[0_2px_16px_rgba(240,90,0,0.1)] flex items-center justify-between px-5 py-3.5">
      <div className="font-heading text-3xl tracking-wide leading-none select-none cursor-pointer" onClick={() => navigate('/')}>
        <span className="text-orange">Easy</span>
        <span className="text-black">Find</span>
        <span className="text-orange">Ride</span>
      </div>
      <button 
        onClick={() => navigate('/support')}
        className="flex items-center gap-2 bg-orange-pale rounded-full px-4 py-2 text-orange font-extrabold text-sm hover:bg-[#ffe0cc] transition-all active:scale-95"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
          <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
        </svg>
        Support
      </button>
    </nav>
  );
};

export default Navbar;

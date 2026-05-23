import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  return (
    <nav className="sticky top-0 z-[1000] bg-white shadow-[0_2px_16px_rgba(240,90,0,0.1)] flex items-center justify-between px-5 py-3.5">
      <div className="font-heading text-3xl tracking-wide leading-none select-none cursor-pointer" onClick={() => navigate('/')}>
        <span className="text-orange">Easy</span>
        <span className="text-black">Find</span>
        <span className="text-orange">Ride</span>
      </div>
      {userRole === 'customer' && (
        <button 
          onClick={() => navigate('/restrictions')}
          className="flex items-center gap-2 bg-red-500/10 rounded-full px-4 py-2 text-red-600 font-extrabold text-sm hover:bg-red-500/20 transition-all active:scale-95 border border-red-500/10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Account Limits
        </button>
      )}
      {userRole === 'driver' && (
        <button 
          onClick={() => navigate('/wallet')}
          className="flex items-center gap-2 bg-orange-pale rounded-full px-4 py-2 text-orange font-extrabold text-sm hover:bg-[#ffe0cc] transition-all active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
            <line x1="12" y1="4" x2="12" y2="20"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
          </svg>
          Earnings
        </button>
      )}
    </nav>
  );
};

export default Navbar;

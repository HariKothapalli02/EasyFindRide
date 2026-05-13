import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Shield, User } from 'lucide-react';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'navHome', icon: Home, label: 'Home', path: '/' },
    { id: 'navBookings', icon: ClipboardList, label: 'My Bookings', path: '/bookings' },
    { id: 'navSupport', icon: Shield, label: 'Support', path: '/support' },
    { id: 'navProfile', icon: User, label: 'Profile', path: '/profile' },
  ];

  const activeIdx = navItems.findIndex(item => item.path === location.pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 m-auto w-full max-w-[420px] h-[75px] z-[99999] flex bg-white/80 backdrop-blur-[20px] border-t border-black/5 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)]">
      {activeIdx !== -1 && (
        <div 
          className="absolute top-0 h-[3.5px] w-12 bg-orange rounded-b-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-[0_4px_12px_rgba(255,95,0,0.3)]"
          style={{ left: `calc(${25 * activeIdx + 12.5}% - 24px)` }}
        />
      )}
      {navItems.map((item, idx) => (
        <button
          key={item.id}
          onClick={() => navigate(item.path)}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${location.pathname === item.path ? 'text-orange translate-y-[-2px]' : 'text-[#aaa]'}`}
        >
          <div className={`p-2 rounded-2xl transition-all ${location.pathname === item.path ? 'bg-orange/10 scale-110' : 'bg-transparent'}`}>
            <item.icon size={22} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-wider transition-all ${location.pathname === item.path ? 'opacity-100 scale-100' : 'opacity-60 scale-90'}`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;

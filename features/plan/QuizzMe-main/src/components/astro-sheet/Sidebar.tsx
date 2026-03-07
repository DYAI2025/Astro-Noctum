'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { User, HelpCircle, Bot, Sparkles, Settings, AlertCircle, LayoutDashboard, Compass, PieChart, FileText } from 'lucide-react';
import { UserProfile } from './types';

interface SidebarProps { user: UserProfile; }

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/astrosheet' },
    { icon: User, label: 'Profil', href: '/character' },
    { icon: PieChart, label: 'Quizzes', href: '/verticals/quiz' },
    { icon: Bot, label: 'Agenten', href: '/agents' },
    { icon: Sparkles, label: 'Premium', href: '/premium', premium: true },
    { icon: Settings, label: 'Einstellungen', href: '/settings' },
  ];

  const handleNavClick = (href: string) => {
    if (href !== '#') {
      router.push(href);
    }
  };

  return (
    <aside className="w-[260px] h-screen fixed left-0 top-0 border-r border-[#E6E0D8] bg-white flex flex-col p-10 z-50">
      <div className="mb-20">
        <h1 className="serif text-3xl text-[#0E1B33] font-light tracking-tighter flex items-center gap-2">
          ASTRO<span className="w-2 h-2 rounded-full bg-[#C9A46A]"></span>CHARACTER
        </h1>
        <div className="text-[9px] mono uppercase tracking-[0.5em] text-[#A1A1AA] mt-3 font-bold">REFL_PROTOCOL_v1</div>
      </div>

      <div className="bg-[#F6F3EE] rounded-3xl p-6 mb-16 flex items-center gap-4 border border-[#E6E0D8] group cursor-pointer hover:border-[#C9A46A] transition-all shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-[#0E1B33] flex items-center justify-center text-white text-xl serif shadow-lg transform transition-transform group-hover:scale-105">
          {user.name[0]}
        </div>
        <div>
          <div className="text-sm font-bold text-[#0E1B33] tracking-tight">{user.name}</div>
          <div className="text-[9px] text-[#5A6477] uppercase tracking-[0.2em] font-bold mt-1">Level {user.level}</div>
        </div>
      </div>

      <nav className="flex-1 space-y-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '#' && pathname?.startsWith(item.href));
          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.href)}
              className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                isActive
                  ? 'bg-[#0E1B33] text-white shadow-xl shadow-[#0E1B33]/20'
                  : 'text-[#5A6477] hover:text-[#0E1B33] hover:bg-[#F6F3EE]'
              }`}
            >
              <item.icon size={18} className={`relative z-10 transition-colors ${isActive ? 'text-[#7AA7A1]' : ''} ${item.premium ? 'text-[#C9A46A]' : ''}`} />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-10">
        <div className="bg-[#0E1B33] rounded-[2rem] p-8 text-[11px] leading-relaxed text-white/50 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#C9A46A]/10 blur-3xl rounded-full" />
          <div className="flex items-center gap-3 mb-4 font-bold text-white uppercase tracking-[0.3em]">
            <AlertCircle size={14} className="text-[#C9A46A]" />
            Transparenz
          </div>
          <p className="font-bold text-white mb-2 uppercase tracking-wide">Berechnet ≠ Deutung</p>
          <p className="opacity-60 text-[10px] italic leading-snug">
            Dieses Dashboard dient ausschließlich der Reflexion und Unterhaltung.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', sub: [] },
  { to: '/signatur', label: 'Signatur', sub: ['Quiz-Cluster', 'Ringe anzeigen'] },
  { to: '/wu-xing', label: 'Wu-Xing', sub: ['5 Elemente', 'Westliche Häuser'] },
  { to: '/wissen', label: 'Wissen', sub: ['Alle Artikel', 'Glossar'] },
] as const;

export function NavVariantB() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-[#00050A]/95 backdrop-blur-sm border-b border-[#D4AF37]/10 flex items-center px-8 gap-8 z-50">
      <span className="font-serif text-lg text-[#D4AF37] mr-6">Bazodiac</span>
      {NAV_ITEMS.map(({ to, label, sub }) => (
        <div
          key={to}
          className="relative"
          onMouseEnter={() => sub.length > 0 && setOpen(to)}
          onMouseLeave={() => setOpen(null)}
        >
          <NavLink
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `text-sm font-medium tracking-widest uppercase transition-colors ${
                isActive ? 'text-[#D4AF37]' : 'text-white/50 hover:text-white/80'
              }`
            }
          >
            {label}
          </NavLink>
          {sub.length > 0 && open === to && (
            <div className="absolute top-full left-0 mt-2 w-44 bg-[#0A0D10] border border-[#D4AF37]/15 rounded-lg py-1 shadow-xl">
              {sub.map(s => (
                <div key={s} className="px-4 py-2 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors">
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

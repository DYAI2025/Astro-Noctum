import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Orbit, Flame, BookOpen } from 'lucide-react';

const NAV_ITEMS = [
  {
    to: '/', icon: LayoutDashboard, label: 'Dashboard',
    panel: { title: 'Dashboard', items: ['Dein Chart', 'Planetarium', 'Elemente'] },
  },
  {
    to: '/signatur', icon: Orbit, label: 'Signatur',
    panel: { title: 'Signatur', items: ['Frequenz-Ring', 'Quiz-Cluster', 'Dissonanz'] },
  },
  {
    to: '/wu-xing', icon: Flame, label: 'Wu-Xing',
    panel: { title: 'Wu-Xing', items: ['5 Elemente', 'Zyklen', 'Häuser'] },
  },
  {
    to: '/wissen', icon: BookOpen, label: 'Wissen',
    panel: { title: 'Wissen', items: ['Artikel', 'Horoskop-Guide', 'Glossar'] },
  },
] as const;

export function NavVariantC() {
  return (
    <nav className="fixed left-0 top-0 h-screen w-16 bg-[#00050A] border-r border-[#D4AF37]/10 flex flex-col items-center gap-2 pt-6 z-50">
      <div className="mb-6">
        <span className="font-serif text-[#D4AF37] text-lg">B</span>
      </div>
      {NAV_ITEMS.map(({ to, icon: Icon, label, panel }) => (
        <div key={to} className="group relative">
          <NavLink
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                isActive
                  ? 'bg-[#D4AF37]/15 text-[#D4AF37]'
                  : 'text-white/35 hover:text-white/70 hover:bg-white/5'
              }`
            }
            title={label}
          >
            <Icon className="w-5 h-5" />
          </NavLink>
          <div className="hidden group-hover:flex flex-col absolute left-full top-0 ml-3 w-44 bg-[#0A0D10] border border-[#D4AF37]/15 rounded-xl p-3 shadow-2xl z-50">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]/60 mb-2">{panel.title}</p>
            {panel.items.map(item => (
              <div key={item} className="text-left text-sm text-white/55 hover:text-white/90 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                {item}
              </div>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

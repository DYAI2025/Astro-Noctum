import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Orbit, Flame, BookOpen } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export function NavVariantA() {
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { to: '/', icon: LayoutDashboard, label: t('nav.sidebar.home'), sub: [] as string[] },
    { to: '/signatur', icon: Orbit, label: t('nav.sidebar.signatur'), sub: [t('nav.sidebar.subQuizCluster'), t('nav.sidebar.subRings')] },
    { to: '/wu-xing', icon: Flame, label: t('nav.sidebar.wuXing'), sub: [t('nav.sidebar.sub5Elements'), t('nav.sidebar.subHouses')] },
    { to: '/wissen', icon: BookOpen, label: t('nav.sidebar.wissen'), sub: [t('nav.sidebar.subArticles'), t('nav.sidebar.subGlossary')] },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-56 bg-[#00050A] border-r border-[#D4AF37]/10 flex flex-col gap-1 pt-8 px-3 z-50">
      <div className="mb-8 px-3">
        <span className="font-serif text-xl text-[#D4AF37]">Bazodiac</span>
      </div>
      {NAV_ITEMS.map(({ to, icon: Icon, label, sub }) => (
        <div key={to} className="group relative">
          <NavLink
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="font-medium tracking-wide">{label}</span>
          </NavLink>
          {sub.length > 0 && (
            <div className="hidden group-hover:flex flex-col absolute left-full top-0 ml-2 w-40 bg-[#0A0D10] border border-[#D4AF37]/15 rounded-lg py-1 shadow-xl z-50">
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

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Orbit, Flame, BookOpen } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export function NavVariantC() {
  const { t } = useLanguage();

  const NAV_ITEMS = [
    {
      to: '/', icon: LayoutDashboard, label: t('nav.sidebar.home'),
      panel: { title: t('nav.sidebar.home'), items: [t('dashboard.bazi.sectionTitle'), t('nav.sidebar.subPlanetarium'), t('nav.sidebar.sub5Elements')] },
    },
    {
      to: '/signatur', icon: Orbit, label: t('nav.sidebar.signatur'),
      panel: { title: t('nav.sidebar.signatur'), items: [t('nav.sidebar.subFusionRing'), t('nav.sidebar.subQuizCluster'), t('nav.sidebar.subCluster')] },
    },
    {
      to: '/wu-xing', icon: Flame, label: t('nav.sidebar.wuXing'),
      panel: { title: t('nav.sidebar.wuXing'), items: [t('nav.sidebar.sub5Elements'), t('nav.sidebar.subHouses')] },
    },
    {
      to: '/wissen', icon: BookOpen, label: t('nav.sidebar.wissen'),
      panel: { title: t('nav.sidebar.wissen'), items: [t('nav.sidebar.subArticles'), t('nav.sidebar.subHoroscopeGuide'), t('nav.sidebar.subGlossary')] },
    },
  ];

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
            aria-label={label}
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

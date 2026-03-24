import { useState, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  IconHouse,
  IconOrbit,
  IconMountain,
  IconTelescope,
} from "../animated-icons";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SubItem {
  label: string;
  href: string;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  Icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement> & React.RefAttributes<SVGSVGElement>>;
  subItems?: SubItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav config
// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Dein Bazodiac",
    href: "/",
    Icon: IconHouse,
    subItems: [
      { label: "Planetarium", href: "/" },
      { label: "Kosmischer Blueprint", href: "/" },
      { label: "Wu Xing", href: "/wu-xing" },
    ],
  },
  {
    id: "signatur",
    label: "Signatur",
    href: "/signatur",
    Icon: IconOrbit,
    subItems: [
      { label: "Fusion Ring", href: "/signatur" },
      { label: "Quizze", href: "/signatur" },
      { label: "Cluster", href: "/signatur" },
    ],
  },
  {
    id: "wu-xing",
    label: "Wu Xing",
    href: "/wu-xing",
    Icon: IconMountain,
  },
  {
    id: "wissen",
    label: "Wissen",
    href: "/wissen",
    Icon: IconTelescope,
    subItems: [
      { label: "Artikel", href: "/wissen" },
      { label: "Horoskop", href: "/wissen" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function NavSidebarA() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const submenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  const handleMouseEnterSidebar = useCallback(() => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
      submenuTimeoutRef.current = null;
    }
    setExpanded(true);
  }, []);

  const handleMouseLeaveSidebar = useCallback(() => {
    submenuTimeoutRef.current = setTimeout(() => {
      setExpanded(false);
      setActiveSubmenu(null);
    }, 150);
  }, []);

  const handleItemMouseEnter = useCallback((itemId: string, hasSubmenu: boolean) => {
    if (hasSubmenu) {
      setActiveSubmenu(itemId);
    } else {
      setActiveSubmenu(null);
    }
  }, []);

  const handleSubmenuMouseEnter = useCallback(() => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
      submenuTimeoutRef.current = null;
    }
  }, []);

  const handleSubmenuMouseLeave = useCallback(() => {
    submenuTimeoutRef.current = setTimeout(() => {
      setExpanded(false);
      setActiveSubmenu(null);
    }, 150);
  }, []);

  return (
    <>
      {/* Sidebar */}
      <nav
        ref={sidebarRef}
        onMouseEnter={handleMouseEnterSidebar}
        onMouseLeave={handleMouseLeaveSidebar}
        className="fixed left-0 top-0 z-50 flex h-full flex-col"
        aria-label="Hauptnavigation"
      >
        <div
          className={[
            "relative flex h-full flex-col border-r border-[#D4AF37]/10",
            "bg-[#00050A]/90 backdrop-blur",
            "transition-[width] duration-300 ease-in-out",
            expanded ? "w-60" : "w-16",
          ].join(" ")}
        >
          {/* Logo / brand mark */}
          <div className="flex h-16 shrink-0 items-center justify-center overflow-hidden border-b border-[#D4AF37]/10 px-3">
            <span className="text-[#D4AF37] font-serif text-xl leading-none select-none">B</span>
            {expanded && (
              <span
                className="ml-2 whitespace-nowrap font-serif text-sm text-[#D4AF37]/80 transition-opacity duration-200"
              >
                Bazodiac
              </span>
            )}
          </div>

          {/* Nav items */}
          <ul className="mt-4 flex flex-col gap-1 px-2" role="list">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              const hasSubmenu = Boolean(item.subItems?.length);
              const submenuOpen = activeSubmenu === item.id;

              return (
                <li key={item.id} className="relative">
                  <Link
                    to={item.href}
                    onMouseEnter={() => handleItemMouseEnter(item.id, hasSubmenu)}
                    className={[
                      "al-icon-wrapper group flex items-center gap-3 rounded-lg px-3 py-2.5",
                      "transition-colors duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50",
                      active
                        ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                        : "text-white/50 hover:bg-white/5 hover:text-white/80",
                    ].join(" ")}
                    aria-current={active ? "page" : undefined}
                  >
                    {/* Icon */}
                    <span className="shrink-0">
                      <item.Icon
                        width={20}
                        height={20}
                        stroke={active ? "#D4AF37" : "currentColor"}
                        className="transition-colors duration-200"
                        aria-hidden="true"
                      />
                    </span>

                    {/* Label — only visible when expanded */}
                    {expanded && (
                      <span className="whitespace-nowrap text-sm font-medium transition-opacity duration-200">
                        {item.label}
                      </span>
                    )}

                    {/* Submenu indicator */}
                    {expanded && hasSubmenu && (
                      <svg
                        className={[
                          "ml-auto h-3 w-3 shrink-0 transition-transform duration-200",
                          submenuOpen ? "rotate-90" : "",
                        ].join(" ")}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    )}
                  </Link>

                  {/* Inline submenu (collapsed sidebar — tooltip-style flyout) */}
                  {!expanded && hasSubmenu && submenuOpen && item.subItems && (
                    <div
                      onMouseEnter={handleSubmenuMouseEnter}
                      onMouseLeave={handleSubmenuMouseLeave}
                      className={[
                        "absolute left-full top-0 z-50 ml-2",
                        "min-w-[180px] rounded-xl",
                        "border border-[#D4AF37]/15 bg-[#00050A]/95 backdrop-blur",
                        "py-1 shadow-xl shadow-black/50",
                        "animate-in fade-in slide-in-from-left-2 duration-150",
                      ].join(" ")}
                      role="menu"
                    >
                      <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-[#D4AF37]/40">
                        {item.label}
                      </p>
                      {item.subItems.map((sub) => (
                        <Link
                          key={sub.label}
                          to={sub.href}
                          role="menuitem"
                          className="block px-3 py-2 text-sm text-white/60 transition-colors hover:bg-[#D4AF37]/8 hover:text-white"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Active route gold indicator line */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[2px]">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              if (!active) return null;
              return (
                <div
                  key={item.id}
                  className="h-full w-full bg-[#D4AF37]/60"
                  style={{ borderRadius: "0 2px 2px 0" }}
                />
              );
            })}
          </div>
        </div>

        {/* Expanded submenu — appears to the right of expanded sidebar */}
        {expanded && activeSubmenu && (() => {
          const item = NAV_ITEMS.find((n) => n.id === activeSubmenu);
          if (!item?.subItems?.length) return null;
          return (
            <div
              onMouseEnter={handleSubmenuMouseEnter}
              onMouseLeave={handleSubmenuMouseLeave}
              className={[
                "absolute left-60 top-0 z-40 flex h-full flex-col",
                "min-w-[200px] border-r border-[#D4AF37]/10",
                "bg-[#00050A]/85 backdrop-blur",
                "transition-[opacity,transform] duration-200",
                "animate-in fade-in slide-in-from-left-2",
              ].join(" ")}
              role="menu"
              aria-label={`${item.label} Untermenü`}
            >
              {/* Section header */}
              <div className="flex h-16 shrink-0 items-end border-b border-[#D4AF37]/10 px-4 pb-3">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]/50">
                  {item.label}
                </p>
              </div>

              <ul className="mt-4 flex flex-col gap-0.5 px-2" role="list">
                {item.subItems.map((sub) => (
                  <li key={sub.label}>
                    <Link
                      to={sub.href}
                      role="menuitem"
                      className={[
                        "block rounded-lg px-3 py-2.5 text-sm",
                        "text-white/50 transition-colors duration-200",
                        "hover:bg-white/5 hover:text-white/80",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50",
                      ].join(" ")}
                    >
                      {sub.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}
      </nav>
    </>
  );
}

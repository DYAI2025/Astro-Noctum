'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  LogOut,
  ArrowLeft,
  ChevronRight,
  Moon,
  Sun,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import Sidebar from '@/components/astro-sheet/Sidebar';
import { useAstroProfile } from '@/hooks/useAstroProfile';
import { mapProfileToViewModel } from '@/components/astro-sheet/mapper';
import { createClient } from '@/lib/supabase/client';

interface SettingSection {
  id: string;
  title: string;
  icon: React.ElementType;
  settings: SettingItem[];
}

interface SettingItem {
  id: string;
  label: string;
  description: string;
  type: 'toggle' | 'select' | 'link';
  value?: boolean | string;
  options?: string[];
}

const SECTIONS: SettingSection[] = [
  {
    id: 'account',
    title: 'Konto',
    icon: User,
    settings: [
      {
        id: 'email',
        label: 'E-Mail ändern',
        description: 'Aktualisiere deine E-Mail-Adresse',
        type: 'link',
      },
      {
        id: 'password',
        label: 'Passwort ändern',
        description: 'Setze ein neues Passwort',
        type: 'link',
      },
      {
        id: 'birthdata',
        label: 'Geburtsdaten',
        description: 'Datum, Zeit und Ort bearbeiten',
        type: 'link',
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Benachrichtigungen',
    icon: Bell,
    settings: [
      {
        id: 'daily_horoscope',
        label: 'Tägliches Horoskop',
        description: 'Erhalte jeden Morgen dein Horoskop',
        type: 'toggle',
        value: true,
      },
      {
        id: 'transit_alerts',
        label: 'Transit-Benachrichtigungen',
        description: 'Bei wichtigen astrologischen Ereignissen',
        type: 'toggle',
        value: false,
      },
      {
        id: 'quiz_reminders',
        label: 'Quiz-Erinnerungen',
        description: 'Wöchentliche Erinnerung an neue Quizzes',
        type: 'toggle',
        value: true,
      },
    ],
  },
  {
    id: 'appearance',
    title: 'Darstellung',
    icon: Palette,
    settings: [
      {
        id: 'theme',
        label: 'Design',
        description: 'Wähle zwischen Hell und Dunkel',
        type: 'select',
        value: 'light',
        options: ['light', 'dark', 'system'],
      },
      {
        id: 'language',
        label: 'Sprache',
        description: 'Anzeigesprache der App',
        type: 'select',
        value: 'de',
        options: ['de', 'en'],
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Datenschutz',
    icon: Shield,
    settings: [
      {
        id: 'analytics',
        label: 'Nutzungsanalyse',
        description: 'Hilf uns die App zu verbessern',
        type: 'toggle',
        value: true,
      },
      {
        id: 'data_export',
        label: 'Daten exportieren',
        description: 'Lade alle deine Daten herunter',
        type: 'link',
      },
      {
        id: 'delete_account',
        label: 'Konto löschen',
        description: 'Lösche dein Konto und alle Daten',
        type: 'link',
      },
    ],
  },
];

const ToggleSetting: React.FC<{
  setting: SettingItem;
  value: boolean;
  onChange: (value: boolean) => void;
}> = ({ setting, value, onChange }) => (
  <div className="flex items-center justify-between py-4 border-b border-[#E6E0D8] last:border-0">
    <div>
      <h4 className="font-bold text-[#0E1B33] text-[14px]">{setting.label}</h4>
      <p className="text-[11px] text-[#5A6477] mt-0.5">{setting.description}</p>
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        value ? 'bg-[#7AA7A1]' : 'bg-[#E6E0D8]'
      }`}
      data-testid={`toggle-${setting.id}`}
    >
      <div
        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const SelectSetting: React.FC<{
  setting: SettingItem;
  value: string;
  onChange: (value: string) => void;
}> = ({ setting, value, onChange }) => {
  const labels: Record<string, string> = {
    light: 'Hell',
    dark: 'Dunkel',
    system: 'System',
    de: 'Deutsch',
    en: 'English',
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-[#E6E0D8] last:border-0">
      <div>
        <h4 className="font-bold text-[#0E1B33] text-[14px]">{setting.label}</h4>
        <p className="text-[11px] text-[#5A6477] mt-0.5">{setting.description}</p>
      </div>
      <div className="flex gap-2">
        {setting.options?.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
              value === option
                ? 'bg-[#0E1B33] text-white'
                : 'bg-[#F6F3EE] text-[#5A6477] hover:bg-[#E6E0D8]'
            }`}
            data-testid={`select-${setting.id}-${option}`}
          >
            {labels[option] || option}
          </button>
        ))}
      </div>
    </div>
  );
};

const LinkSetting: React.FC<{ setting: SettingItem; onClick: () => void }> = ({
  setting,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between py-4 border-b border-[#E6E0D8] last:border-0 hover:bg-[#F6F3EE] -mx-4 px-4 transition-colors"
    data-testid={`link-${setting.id}`}
  >
    <div className="text-left">
      <h4 className="font-bold text-[#0E1B33] text-[14px]">{setting.label}</h4>
      <p className="text-[11px] text-[#5A6477] mt-0.5">{setting.description}</p>
    </div>
    <ChevronRight size={18} className="text-[#A1A1AA]" />
  </button>
);

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { profile, loading } = useAstroProfile();
  const [settings, setSettings] = useState<Record<string, boolean | string>>({
    daily_horoscope: true,
    transit_alerts: false,
    quiz_reminders: true,
    analytics: true,
    theme: 'light',
    language: 'de',
  });

  const viewModel = mapProfileToViewModel(profile);
  const user = {
    name: viewModel.identity.displayName || 'TRAVELER',
    level: viewModel.identity.level || 1,
    status: viewModel.identity.status || 'UNPLUGGED',
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSettingChange = (id: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [id]: value }));
  };

  const handleLinkClick = (id: string) => {
    switch (id) {
      case 'birthdata':
        router.push('/onboarding/astro');
        break;
      case 'email':
      case 'password':
      case 'data_export':
        // TODO: Implement these flows
        alert('Diese Funktion wird bald verfügbar sein.');
        break;
      case 'delete_account':
        if (confirm('Bist du sicher, dass du dein Konto löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.')) {
          // TODO: Implement account deletion
          alert('Konto-Löschung wird bald verfügbar sein.');
        }
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F3EE]">
        <Loader2 className="animate-spin text-[#C9A46A]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F3EE]" data-testid="settings-page">
      <Sidebar user={user} />

      <main className="pl-[260px] min-h-screen">
        {/* Header */}
        <header className="h-28 px-16 flex items-center justify-between border-b border-[#E6E0D8] bg-white/60 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/astrosheet')}
              className="p-2 rounded-lg hover:bg-[#F6F3EE] transition-colors"
            >
              <ArrowLeft size={20} className="text-[#5A6477]" />
            </button>
            <div>
              <h1 className="serif text-4xl font-light text-[#0E1B33] tracking-tight">Einstellungen</h1>
              <p className="mono text-[10px] text-[#5A6477] uppercase tracking-widest mt-1">
                Konto & Präferenzen verwalten
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-16 py-12">
          <div className="space-y-8">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  className="bg-white rounded-2xl border border-[#E6E0D8] overflow-hidden"
                  data-testid={`section-${section.id}`}
                >
                  <div className="p-6 border-b border-[#E6E0D8] flex items-center gap-3">
                    <div className="p-2 bg-[#F6F3EE] rounded-xl">
                      <Icon size={18} className="text-[#7AA7A1]" />
                    </div>
                    <h3 className="font-bold text-[#0E1B33]">{section.title}</h3>
                  </div>

                  <div className="px-6">
                    {section.settings.map((setting) => {
                      if (setting.type === 'toggle') {
                        return (
                          <ToggleSetting
                            key={setting.id}
                            setting={setting}
                            value={settings[setting.id] as boolean}
                            onChange={(v) => handleSettingChange(setting.id, v)}
                          />
                        );
                      }
                      if (setting.type === 'select') {
                        return (
                          <SelectSetting
                            key={setting.id}
                            setting={setting}
                            value={settings[setting.id] as string}
                            onChange={(v) => handleSettingChange(setting.id, v)}
                          />
                        );
                      }
                      return (
                        <LinkSetting
                          key={setting.id}
                          setting={setting}
                          onClick={() => handleLinkClick(setting.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full p-6 bg-white rounded-2xl border border-[#E6E0D8] flex items-center gap-4 hover:border-red-300 hover:bg-red-50 transition-all group"
              data-testid="logout-button"
            >
              <div className="p-2 bg-[#F6F3EE] rounded-xl group-hover:bg-red-100 transition-colors">
                <LogOut size={18} className="text-[#5A6477] group-hover:text-red-500 transition-colors" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-[#0E1B33] group-hover:text-red-600 transition-colors">Abmelden</h4>
                <p className="text-[11px] text-[#5A6477]">Von diesem Gerät abmelden</p>
              </div>
            </button>

            {/* Version Info */}
            <div className="text-center py-8">
              <p className="mono text-[10px] text-[#A1A1AA] uppercase tracking-widest">
                AstroCharacter v1.0.0 • Build 2024.01
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

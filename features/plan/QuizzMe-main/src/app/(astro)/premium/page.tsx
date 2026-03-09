'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Crown,
  Star,
  Zap,
  Calendar,
  Bot,
  TrendingUp,
  Shield,
  Check,
  ArrowLeft,
  Sparkles,
  Loader2,
} from 'lucide-react';
import Sidebar from '@/components/astro-sheet/Sidebar';
import { useAstroProfile } from '@/hooks/useAstroProfile';
import { mapProfileToViewModel } from '@/components/astro-sheet/mapper';

const FEATURES = [
  {
    icon: Calendar,
    title: 'Tägliches Horoskop',
    description: 'Personalisierte Energie-Peaks und Transits für jeden Tag.',
    included: true,
  },
  {
    icon: Bot,
    title: 'Premium-Agenten',
    description: 'Zugang zu allen KI-Beratern inkl. Orakel und Tiefenanalyse.',
    included: true,
  },
  {
    icon: TrendingUp,
    title: 'Transit-Tracking',
    description: 'Echtzeit-Updates bei wichtigen astrologischen Ereignissen.',
    included: true,
  },
  {
    icon: Star,
    title: 'Jahresprognose',
    description: 'Detaillierte Vorschau auf die nächsten 12 Monate.',
    included: true,
  },
  {
    icon: Shield,
    title: 'Werbefrei',
    description: 'Ungestörtes Erlebnis ohne Unterbrechungen.',
    included: true,
  },
  {
    icon: Zap,
    title: 'Priority-Updates',
    description: 'Neue Features und Berechnungen zuerst erhalten.',
    included: true,
  },
];

const PLANS = [
  {
    id: 'monthly',
    name: 'Monatlich',
    price: '9.99',
    period: '/Monat',
    popular: false,
    savings: null,
  },
  {
    id: 'yearly',
    name: 'Jährlich',
    price: '79.99',
    period: '/Jahr',
    popular: true,
    savings: '33% sparen',
  },
];

export default function PremiumPage() {
  const router = useRouter();
  const { profile, loading } = useAstroProfile();
  const [selectedPlan, setSelectedPlan] = React.useState('yearly');

  const viewModel = mapProfileToViewModel(profile);
  const user = {
    name: viewModel.identity.displayName || 'TRAVELER',
    level: viewModel.identity.level || 1,
    status: viewModel.identity.status || 'UNPLUGGED',
  };

  const isPremium = profile?.account_tier === 'premium';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F3EE]">
        <Loader2 className="animate-spin text-[#C9A46A]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F3EE]" data-testid="premium-page">
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
              <h1 className="serif text-4xl font-light text-[#0E1B33] tracking-tight">Premium</h1>
              <p className="mono text-[10px] text-[#5A6477] uppercase tracking-widest mt-1">
                Erweiterte Features für tiefere Einblicke
              </p>
            </div>
          </div>

          {isPremium && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C9A46A] to-[#8F7AD1] text-white rounded-full">
              <Crown size={16} />
              <span className="mono text-[10px] font-bold uppercase tracking-wider">Premium Aktiv</span>
            </div>
          )}
        </header>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-16 py-12">
          {isPremium ? (
            /* Premium Active View */
            <div className="text-center py-12">
              <div className="inline-flex p-6 bg-gradient-to-br from-[#C9A46A] to-[#8F7AD1] rounded-full mb-6 shadow-xl">
                <Crown size={48} className="text-white" />
              </div>
              <h2 className="serif text-4xl text-[#0E1B33] mb-4">Premium ist aktiv!</h2>
              <p className="text-[#5A6477] mb-8 max-w-md mx-auto">
                Du hast Zugang zu allen Premium-Features. Vielen Dank für deine Unterstützung!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="p-6 bg-white rounded-2xl border border-[#E6E0D8] text-left"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-[#F6F3EE] rounded-xl">
                          <Icon size={18} className="text-[#7AA7A1]" />
                        </div>
                        <Check size={18} className="text-green-500" />
                      </div>
                      <h3 className="font-bold text-[#0E1B33] mb-1">{feature.title}</h3>
                      <p className="text-[12px] text-[#5A6477]">{feature.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Upgrade View */
            <>
              {/* Hero */}
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A46A]/10 border border-[#C9A46A]/30 rounded-full text-[#C9A46A] mb-6">
                  <Sparkles size={16} />
                  <span className="mono text-[10px] font-bold uppercase tracking-wider">
                    Erweitere dein Erlebnis
                  </span>
                </div>
                <h2 className="serif text-5xl text-[#0E1B33] mb-4">Werde Premium</h2>
                <p className="text-[#5A6477] max-w-lg mx-auto">
                  Erhalte Zugang zu täglichen Horoskopen, Premium-Agenten, Transit-Tracking und mehr.
                </p>
              </div>

              {/* Plans */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative p-8 rounded-2xl border-2 transition-all text-left ${
                      selectedPlan === plan.id
                        ? 'border-[#C9A46A] bg-white shadow-xl'
                        : 'border-[#E6E0D8] bg-white hover:border-[#C9A46A]/50'
                    }`}
                    data-testid={`plan-${plan.id}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-6 px-3 py-1 bg-[#C9A46A] text-white text-[9px] mono font-bold uppercase tracking-wider rounded-full">
                        Beliebt
                      </div>
                    )}
                    {plan.savings && (
                      <div className="absolute -top-3 right-6 px-3 py-1 bg-green-500 text-white text-[9px] mono font-bold uppercase tracking-wider rounded-full">
                        {plan.savings}
                      </div>
                    )}

                    <h3 className="mono text-[11px] text-[#5A6477] uppercase tracking-widest mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-[#0E1B33]">€{plan.price}</span>
                      <span className="text-[#5A6477]">{plan.period}</span>
                    </div>

                    <div
                      className={`mt-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPlan === plan.id
                          ? 'border-[#C9A46A] bg-[#C9A46A]'
                          : 'border-[#E6E0D8]'
                      }`}
                    >
                      {selectedPlan === plan.id && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                ))}
              </div>

              {/* Features */}
              <div className="bg-white rounded-[2rem] border border-[#E6E0D8] p-8 mb-8">
                <h3 className="mono text-[11px] text-[#5A6477] uppercase tracking-widest mb-6">
                  Was ist enthalten
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FEATURES.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div key={feature.title} className="flex items-start gap-4 p-4">
                        <div className="p-2 bg-[#F6F3EE] rounded-xl">
                          <Icon size={18} className="text-[#7AA7A1]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-[#0E1B33] mb-1">{feature.title}</h4>
                          <p className="text-[12px] text-[#5A6477]">{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <button
                  className="px-12 py-5 bg-gradient-to-r from-[#C9A46A] to-[#8F7AD1] text-white text-[12px] font-bold uppercase tracking-[0.3em] rounded-full hover:shadow-xl transition-all"
                  data-testid="upgrade-button"
                >
                  Jetzt upgraden
                </button>
                <p className="mt-4 text-[11px] text-[#A1A1AA]">
                  Jederzeit kündbar • 14 Tage Geld-zurück-Garantie
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

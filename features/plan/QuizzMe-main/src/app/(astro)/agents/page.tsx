'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Sparkles,
  MessageCircle,
  Zap,
  Lock,
  Crown,
  ArrowLeft,
  Send,
  Loader2,
  Star,
  Brain,
  Target,
  Heart,
} from 'lucide-react';
import Sidebar from '@/components/astro-sheet/Sidebar';
import { useAstroProfile } from '@/hooks/useAstroProfile';
import { mapProfileToViewModel } from '@/components/astro-sheet/mapper';

interface Agent {
  id: string;
  name: string;
  description: string;
  specialty: string;
  icon: React.ElementType;
  color: string;
  status: 'online' | 'offline' | 'premium_only';
  capabilities: string[];
}

const AGENTS: Agent[] = [
  {
    id: 'strategy',
    name: 'Strategie-Berater',
    description: 'Hilft dir bei Karriere- und Lebensentscheidungen basierend auf deinem Profil.',
    specialty: 'Strategische Planung',
    icon: Target,
    color: '#C9A46A',
    status: 'online',
    capabilities: ['Karriereberatung', 'Entscheidungshilfe', 'Ressourcen-Optimierung'],
  },
  {
    id: 'relationship',
    name: 'Beziehungs-Guide',
    description: 'Analysiert Kompatibilität und gibt Tipps für harmonische Beziehungen.',
    specialty: 'Beziehungsdynamik',
    icon: Heart,
    color: '#EF4444',
    status: 'online',
    capabilities: ['Kompatibilitäts-Check', 'Kommunikationstipps', 'Konfliktlösung'],
  },
  {
    id: 'mindfulness',
    name: 'Achtsamkeits-Coach',
    description: 'Unterstützt dich bei Meditation und innerer Balance.',
    specialty: 'Innere Harmonie',
    icon: Brain,
    color: '#8F7AD1',
    status: 'online',
    capabilities: ['Meditation', 'Stressabbau', 'Energie-Balance'],
  },
  {
    id: 'premium-oracle',
    name: 'Premium Orakel',
    description: 'Tiefgehende Analysen mit erweiterten Transits und Prognosen.',
    specialty: 'Tiefenanalyse',
    icon: Star,
    color: '#7AA7A1',
    status: 'premium_only',
    capabilities: ['Transit-Analyse', 'Jahresprognose', 'Timing-Beratung'],
  },
];

const AgentCard: React.FC<{
  agent: Agent;
  onSelect: (agent: Agent) => void;
  selected: boolean;
}> = ({ agent, onSelect, selected }) => {
  const Icon = agent.icon;
  const isPremium = agent.status === 'premium_only';

  return (
    <button
      onClick={() => !isPremium && onSelect(agent)}
      disabled={isPremium}
      className={`w-full p-6 rounded-2xl border transition-all text-left relative overflow-hidden group ${
        selected
          ? 'bg-[#0E1B33] border-[#0E1B33] text-white shadow-xl'
          : isPremium
            ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-70'
            : 'bg-white border-[#E6E0D8] hover:border-[#C9A46A] hover:shadow-lg'
      }`}
      data-testid={`agent-card-${agent.id}`}
    >
      {isPremium && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-[#C9A46A] text-white text-[8px] mono font-bold uppercase tracking-wider rounded-full">
          <Crown size={10} />
          Premium
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-xl ${selected ? 'bg-white/10' : 'bg-[#F6F3EE]'}`}
          style={{ borderColor: agent.color }}
        >
          <Icon size={24} style={{ color: selected ? 'white' : agent.color }} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-bold ${selected ? 'text-white' : 'text-[#0E1B33]'}`}>
              {agent.name}
            </h3>
            {!isPremium && (
              <div className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
            )}
          </div>
          <p className={`text-[11px] mb-3 ${selected ? 'text-white/70' : 'text-[#5A6477]'}`}>
            {agent.description}
          </p>
          <div className="flex flex-wrap gap-1">
            {agent.capabilities.slice(0, 2).map((cap) => (
              <span
                key={cap}
                className={`px-2 py-0.5 rounded-full text-[9px] mono font-bold uppercase tracking-wider ${
                  selected ? 'bg-white/10 text-white/80' : 'bg-[#F6F3EE] text-[#5A6477]'
                }`}
              >
                {cap}
              </span>
            ))}
          </div>
        </div>
      </div>

      {isPremium && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="flex items-center gap-2 text-[#5A6477]">
            <Lock size={16} />
            <span className="mono text-[10px] font-bold uppercase tracking-wider">Premium erforderlich</span>
          </div>
        </div>
      )}
    </button>
  );
};

const ChatInterface: React.FC<{ agent: Agent }> = ({ agent }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent'; text: string }>>([
    {
      role: 'agent',
      text: `Hallo! Ich bin der ${agent.name}. Wie kann ich dir heute helfen? Ich kann dir bei ${agent.capabilities.join(', ')} unterstützen.`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          text: `Das ist eine interessante Frage! Basierend auf deinem Profil und meiner Expertise in ${agent.specialty} würde ich dir empfehlen, zunächst deine Stärken in diesem Bereich zu reflektieren. Möchtest du, dass ich tiefer auf einen bestimmten Aspekt eingehe?`,
        },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  const Icon = agent.icon;

  return (
    <div className="flex flex-col h-full" data-testid="chat-interface">
      {/* Chat Header */}
      <div className="p-4 border-b border-[#E6E0D8] flex items-center gap-3">
        <div className="p-2 rounded-xl" style={{ backgroundColor: `${agent.color}20` }}>
          <Icon size={20} style={{ color: agent.color }} />
        </div>
        <div>
          <h3 className="font-bold text-[#0E1B33]">{agent.name}</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="mono text-[9px] text-[#5A6477] uppercase tracking-wider">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-[#0E1B33] text-white rounded-br-md'
                  : 'bg-[#F6F3EE] text-[#0E1B33] rounded-bl-md'
              }`}
            >
              <p className="text-[13px] leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#F6F3EE] p-4 rounded-2xl rounded-bl-md">
              <Loader2 size={16} className="animate-spin text-[#5A6477]" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#E6E0D8]">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Schreibe eine Nachricht..."
            className="flex-1 px-4 py-3 bg-[#F6F3EE] rounded-xl border border-[#E6E0D8] focus:outline-none focus:border-[#C9A46A] text-[13px]"
            data-testid="chat-input"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            className="p-3 bg-[#0E1B33] text-white rounded-xl hover:bg-[#1a2c4e] disabled:opacity-50 transition-all"
            data-testid="chat-send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AgentsPage() {
  const router = useRouter();
  const { profile, loading } = useAstroProfile();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const viewModel = mapProfileToViewModel(profile);
  const user = {
    name: viewModel.identity.displayName || 'TRAVELER',
    level: viewModel.identity.level || 1,
    status: viewModel.identity.status || 'UNPLUGGED',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F3EE]">
        <Loader2 className="animate-spin text-[#C9A46A]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F3EE]" data-testid="agents-page">
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
              <h1 className="serif text-4xl font-light text-[#0E1B33] tracking-tight">KI-Agenten</h1>
              <p className="mono text-[10px] text-[#5A6477] uppercase tracking-widest mt-1">
                Strategische Beratung basierend auf deinem Profil
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 bg-[#F6F3EE] rounded-full border border-[#E6E0D8]">
            <Bot size={16} className="text-[#7AA7A1]" />
            <span className="mono text-[10px] text-[#5A6477] uppercase tracking-wider">
              {AGENTS.filter((a) => a.status === 'online').length} Agenten verfügbar
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-16 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Agent Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles size={18} className="text-[#C9A46A]" />
                <h2 className="mono text-[11px] font-bold text-[#5A6477] uppercase tracking-widest">
                  Wähle einen Agenten
                </h2>
              </div>

              <div className="space-y-3">
                {AGENTS.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    selected={selectedAgent?.id === agent.id}
                    onSelect={setSelectedAgent}
                  />
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="bg-white rounded-[2rem] border border-[#E6E0D8] overflow-hidden shadow-xl h-[600px]">
              {selectedAgent ? (
                <ChatInterface agent={selectedAgent} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="p-6 bg-[#F6F3EE] rounded-full mb-6">
                    <MessageCircle size={40} className="text-[#C9A46A]" />
                  </div>
                  <h3 className="serif text-2xl text-[#0E1B33] mb-2">Starte eine Konversation</h3>
                  <p className="text-[13px] text-[#5A6477] max-w-sm">
                    Wähle einen Agenten aus der Liste, um eine personalisierte Beratung zu erhalten.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


import React from 'react';
import { Agent } from './types';
import { Sparkles, MessageSquare, Bot } from 'lucide-react';

interface AgentsSectionProps {
  agents: Agent[];
}

const AgentsSection: React.FC<AgentsSectionProps> = ({ agents }) => {
  return (
    <div className="premium-card p-10 flex flex-col h-full">
      <div className="flex items-center gap-4 mb-10 border-b border-[#E6E0D8] pb-8">
        <div className="p-3 bg-[#F6F3EE] rounded-xl">
           <Bot size={20} className="text-[#0E1B33]" />
        </div>
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.4em] font-extrabold text-[#5A6477]">KI Agenten</h3>
          <div className="text-[9px] mono text-[#A1A1AA] mt-1">Status: Active_Listen</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
        {agents.map((agent) => (
          <div key={agent.id} className="p-8 rounded-3xl bg-[#F6F3EE]/50 border border-[#E6E0D8] flex flex-col justify-between hover:border-[#8F7AD1] transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#0E1B33] tracking-tight">{agent.name}</span>
                  <span className="text-[9px] px-2.5 py-1 rounded-full border border-[#E6E0D8] bg-white text-[#5A6477] font-extrabold uppercase tracking-[0.2em]">
                    {agent.type}
                  </span>
                </div>
                <p className="text-[13px] text-[#5A6477] mt-3 font-light leading-relaxed">{agent.description}</p>
              </div>
              {agent.premium && <Sparkles size={20} className="text-[#C9A46A] group-hover:scale-110 transition-transform" />}
            </div>
            
            <button className={`w-full py-4 rounded-2xl text-[10px] font-extrabold uppercase tracking-[0.3em] transition-all ${
              agent.premium 
                ? 'bg-[#0E1B33] text-white hover:bg-[#8F7AD1] shadow-xl shadow-[#0E1B33]/10' 
                : 'bg-white border border-[#E6E0D8] text-[#0E1B33] hover:border-[#8F7AD1]'
            }`}>
              {agent.premium ? 'Live (Premium)' : 'Vorstellen'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-8 border-t border-[#E6E0D8] text-center">
         <span className="mono text-[8px] text-[#A1A1AA] uppercase tracking-[0.3em]">Quantum_Core: Ready</span>
      </div>
    </div>
  );
};

export default AgentsSection;

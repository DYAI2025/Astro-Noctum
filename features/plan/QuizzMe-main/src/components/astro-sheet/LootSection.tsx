
import React from 'react';
import { Lock, Package, Star } from 'lucide-react';

const LootSection: React.FC = () => {
  const perks = [
    { title: 'Naturkind', subtitle: 'Seelenstein: Amethyst', active: true, rarity: 'Common' },
    { title: 'Mentalist', subtitle: 'Love Language: Qualität', active: true, rarity: 'Rare' },
    { title: 'Neue Kachel', subtitle: 'Sperre aufheben', active: false, rarity: 'Unknown' },
  ];

  return (
    <div className="premium-card p-10 h-full flex flex-col">
       <div className="flex items-center gap-4 mb-10 border-b border-[#E6E0D8] pb-8">
        <div className="p-3 bg-[#F6F3EE] rounded-xl">
           <Package size={20} className="text-[#0E1B33]" />
        </div>
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.4em] font-extrabold text-[#5A6477]">Kacheln & Perks</h3>
          <div className="text-[9px] mono text-[#A1A1AA] mt-1">Storage: 2/24 Slots</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-grow">
        {perks.map((perk, idx) => (
          <div
            key={idx}
            className={`p-8 rounded-[2rem] border transition-all flex flex-col items-center text-center justify-between group ${
              perk.active 
                ? 'bg-white border-[#E6E0D8] shadow-sm hover:border-[#8F7AD1] hover:shadow-xl hover:-translate-y-1' 
                : 'bg-transparent border-dashed border-[#E6E0D8] hover:bg-white/40'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-[#F6F3EE] flex items-center justify-center mb-6 shadow-inner transition-transform group-hover:scale-110">
               {perk.active ? (
                 <Star size={24} className={perk.rarity === 'Rare' ? 'text-[#C9A46A]' : 'text-[#7AA7A1]'} />
               ) : (
                 <Lock size={20} className="text-[#A1A1AA]" />
               )}
            </div>

            <div className="space-y-2">
              <span className={`text-[11px] font-extrabold uppercase tracking-[0.2em] block ${perk.active ? 'text-[#0E1B33]' : 'text-[#A1A1AA]'}`}>
                {perk.title}
              </span>
              <span className="text-[10px] text-[#5A6477] font-medium block leading-relaxed">{perk.subtitle}</span>
            </div>

            <div className="mt-8 pt-4 border-t border-[#E6E0D8] w-full">
               <span className={`mono text-[8px] uppercase tracking-[0.4em] font-bold ${perk.active ? 'text-[#C9A46A]' : 'text-[#A1A1AA]'}`}>
                  {perk.rarity}
               </span>
            </div>

            {!perk.active && (
              <button className="mt-6 px-6 py-2 bg-[#0E1B33] text-white rounded-full text-[9px] font-extrabold uppercase tracking-widest transition-all">
                Freischalten
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LootSection;

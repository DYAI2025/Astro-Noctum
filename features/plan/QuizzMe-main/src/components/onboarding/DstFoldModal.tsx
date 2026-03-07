'use client';

import React from 'react';
import { Clock, Sun, Moon, AlertTriangle, X } from 'lucide-react';

interface DstFoldModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (fold: 0 | 1) => void;
    time: string;
    date: string;
}

export default function DstFoldModal({ isOpen, onClose, onSelect, time, date }: DstFoldModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E6E0D8] overflow-hidden">
                {/* Header */}
                <div className="bg-[#0E1B33] p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Schließen"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle className="text-[#C9A46A]" size={24} />
                        <h2 className="serif text-2xl font-light">Zeitzone-Ambiguität</h2>
                    </div>
                    <p className="text-white/70 text-sm">
                        Die eingegebene Zeit ({time} am {date}) fällt in einen DST-Grenzfall.
                    </p>
                </div>

                {/* Explanation */}
                <div className="p-6 bg-[#F6F3EE] border-b border-[#E6E0D8]">
                    <p className="text-[#5A6477] text-sm leading-relaxed">
                        Bei der Zeitumstellung werden Uhren zurückgestellt. Die Uhrzeit <strong>{time}</strong> existierte
                        daher zweimal an diesem Tag – einmal während der <strong>Sommerzeit</strong> und einmal
                        während der <strong>Standardzeit</strong>.
                    </p>
                </div>

                {/* Options */}
                <div className="p-6 space-y-4">
                    <p className="mono text-[10px] uppercase tracking-widest font-bold text-[#5A6477] mb-4">
                        Wähle die korrekte Zeit:
                    </p>

                    {/* Option 1: Summer Time (fold=0) */}
                    <button
                        onClick={() => onSelect(0)}
                        className="w-full p-5 bg-white border-2 border-[#E6E0D8] rounded-2xl hover:border-[#C9A46A] hover:bg-[#FFFDF8] transition-all text-left group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Sun className="text-amber-600" size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-[#0E1B33] group-hover:text-[#C9A46A] transition-colors">
                                    Sommerzeit (MESZ)
                                </div>
                                <div className="text-sm text-[#5A6477] mt-1">
                                    Vor der Zeitumstellung – die erste Instanz von {time}
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Option 2: Standard Time (fold=1) */}
                    <button
                        onClick={() => onSelect(1)}
                        className="w-full p-5 bg-white border-2 border-[#E6E0D8] rounded-2xl hover:border-[#7AA7A1] hover:bg-[#F8FFFD] transition-all text-left group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Moon className="text-blue-600" size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-[#0E1B33] group-hover:text-[#7AA7A1] transition-colors">
                                    Standardzeit (MEZ)
                                </div>
                                <div className="text-sm text-[#5A6477] mt-1">
                                    Nach der Zeitumstellung – die zweite Instanz von {time}
                                </div>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Help Text */}
                <div className="px-6 pb-6">
                    <div className="flex items-start gap-3 p-4 bg-[#F6F3EE] rounded-xl">
                        <Clock className="text-[#C9A46A] mt-0.5 flex-shrink-0" size={16} />
                        <p className="text-[11px] text-[#5A6477] leading-relaxed">
                            <strong>Unsicher?</strong> Frage Familienmitglieder oder prüfe Geburtsurkunde.
                            Die korrekte Wahl beeinflusst die Präzision deines Horoskops um bis zu 30 Minuten.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}


import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Play, RotateCcw } from 'lucide-react';

/* --- WhatIfPanel --- */
interface WhatIfProps {
    overrides: any;
    setOverrides: (val: any) => void;
    onSimulate: () => void;
    onReset: () => void;
    loading: boolean;
    results: any;
}

export const WhatIfPanel: React.FC<WhatIfProps> = ({ overrides, setOverrides, onSimulate, onReset, loading, results }) => {
    const updateField = (field: string, val: any) => {
        setOverrides({ ...overrides, [field]: val });
    };

    return (
        <div className="space-y-8">
            <div className="space-y-6">
                {/* GST Growth Slider */}
                <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex justify-between items-center group">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-wasabi shadow-[0_0_8px_rgba(128,144,118,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-khaki/60">GST Growth (6M)</span>
                        </div>
                        <span className="text-sm font-black text-white italic">{(overrides.gst_growth_6m * 100).toFixed(0)}%</span>
                    </div>
                    <input
                        type="range" min="-0.2" max="0.4" step="0.01"
                        value={overrides.gst_growth_6m}
                        onChange={(e) => updateField('gst_growth_6m', parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-khaki"
                    />
                    <div className="flex justify-between text-[8px] font-bold text-khaki/20 uppercase tracking-tighter">
                        <span>-20% (Contraction)</span>
                        <span>+40% (Aggressive)</span>
                    </div>
                </div>

                {/* EMI Bounces Slider */}
                <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${overrides.bank_emi_bounce_count > 0 ? 'bg-earth shadow-[0_0_8px_rgba(184,104,48,0.5)]' : 'bg-wasabi'}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-khaki/60">Bank EMI Bounces</span>
                        </div>
                        <span className="text-sm font-black text-white italic">{overrides.bank_emi_bounce_count}</span>
                    </div>
                    <input
                        type="range" min="0" max="12" step="1"
                        value={overrides.bank_emi_bounce_count}
                        onChange={(e) => updateField('bank_emi_bounce_count', parseInt(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-khaki"
                    />
                    <div className="flex justify-between text-[8px] font-bold text-khaki/20 uppercase tracking-tighter">
                        <span>Clean History</span>
                        <span>Severe Default</span>
                    </div>
                </div>

                {/* Litigation Index Selection */}
                <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${overrides.litigation_risk_score > 1 ? 'bg-earth shadow-[0_0_8px_rgba(184,104,48,0.5)]' : 'bg-wasabi'}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-khaki/60">Litigation Risk score</span>
                        </div>
                        <span className="text-xs font-black text-white uppercase italic">Level {overrides.litigation_risk_score}</span>
                    </div>
                    <div className="flex gap-2">
                        {[0, 1, 2, 3].map(v => (
                            <button
                                key={v}
                                onClick={() => updateField('litigation_risk_score', v)}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${
                                    overrides.litigation_risk_score === v 
                                    ? 'bg-khaki text-noir shadow-[0_0_15px_rgba(195,170,113,0.3)]' 
                                    : 'bg-white/5 text-khaki/40 hover:bg-white/10'
                                }`}
                            >
                                {v === 0 ? 'CLEAN' : v === 1 ? 'MINOR' : v === 2 ? 'MOD.' : 'CRIT.'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions area */}
            <div className="pt-4 space-y-4 border-t border-white/5">
                <button
                    onClick={onSimulate}
                    disabled={loading}
                    className="w-full py-4 bg-khaki text-noir rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(195,170,113,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {loading ? (
                        <div className="w-12 h-1 border-2 border-noir border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <Play size={16} className="fill-noir group-hover:scale-125 transition-transform" />
                            Run Strategic Simulation
                        </>
                    )}
                </button>
                
                {results && (
                    <button 
                        onClick={onReset} 
                        className="w-full flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-khaki/40 hover:text-white transition-colors"
                    >
                        <RotateCcw size={12} />
                        Revert to Baseline Data
                    </button>
                )}
            </div>
        </div>
    );
};

/* --- CamViewer --- */
interface CamProps {
    markdown: string;
}

export const CamViewer: React.FC<CamProps> = ({ markdown }) => (
    <div className="p-8 h-full overflow-y-auto custom-markdown">
        <ReactMarkdown components={{
            h1: ({ node, ...props }) => <h1 className="text-2xl font-extrabold text-white mb-6 border-b border-white/10 pb-4" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-khaki mt-8 mb-4 uppercase tracking-wider" {...props} />,
            p: ({ node, ...props }) => <p className="text-sm text-khaki/70 leading-relaxed mb-4" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-2 mb-4 text-sm text-khaki/70" {...props} />,
            li: ({ node, ...props }) => <li className="marker:text-khaki" {...props} />,
            strong: ({ node, ...props }) => <strong className="text-white font-bold" {...props} />
        }}>
            {markdown}
        </ReactMarkdown>
    </div>
);

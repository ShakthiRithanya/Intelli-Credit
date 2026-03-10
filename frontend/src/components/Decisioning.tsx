
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Play, RotateCcw, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { GlassCard, RiskBadge } from './BaseUI';

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
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Sliders Area */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-khaki/60">
                            <span>GST Growth (6M)</span>
                            <span className="text-wasabi">{(overrides.gst_growth_6m * 100).toFixed(0)}%</span>
                        </div>
                        <input
                            type="range" min="-0.2" max="0.4" step="0.05"
                            value={overrides.gst_growth_6m}
                            onChange={(e) => updateField('gst_growth_6m', parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-wasabi"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-khaki/60">
                            <span>EMI Bounces</span>
                            <span className="text-wasabi">{overrides.bank_emi_bounce_count}</span>
                        </div>
                        <input
                            type="range" min="0" max="10" step="1"
                            value={overrides.bank_emi_bounce_count}
                            onChange={(e) => updateField('bank_emi_bounce_count', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-wasabi"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-text-dim">
                            <span>Litigation Index</span>
                            <div className="flex gap-1">
                                {[0, 1, 2, 3].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => updateField('litigation_risk_score', v)}
                                        className={`w-6 h-6 rounded text-[10px] font-bold transition-all ${overrides.litigation_risk_score === v ? 'bg-wasabi text-noir' : 'bg-white/5 text-khaki/60 hover:bg-white/10'
                                            }`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 justify-end">
                    <button
                        onClick={onSimulate}
                        disabled={loading}
                        className="btn-premium w-full"
                    >
                        {loading ? "Calculating..." : <><Play size={16} /> Run Simulation</>}
                    </button>
                    {results && (
                        <button onClick={onReset} className="text-[10px] font-bold uppercase text-khaki/60 hover:text-white flex items-center justify-center gap-2">
                            <RotateCcw size={12} /> Reset to Baseline
                        </button>
                    )}
                </div>
            </div>

            {/* Simulation Results View */}
            {results && (
                <div className="glass-panel border-khaki/20 bg-khaki/[0.04] flex flex-col md:flex-row items-center justify-between gap-6 fade-up">
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-[8px] uppercase tracking-widest text-khaki/60 mb-1">Baseline</div>
                            <RiskBadge risk={results.baseline.risk_class} className="opacity-60 scale-90" />
                        </div>
                        <div className="text-khaki">→</div>
                        <div className="text-center">
                            <div className="text-[8px] uppercase tracking-widest text-khaki mb-1">Simulated</div>
                            <RiskBadge risk={results.simulated.risk_class} />
                        </div>
                    </div>

                    <div className="flex-1 max-w-md">
                        <div className="flex items-start gap-2 text-sm">
                            <Info size={16} className="text-khaki shrink-0 mt-1" />
                            <p className="text-white font-medium italic">"{results.summary_text}"</p>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-[10px] text-text-dim uppercase font-bold mb-1">Confidence Change</div>
                        <div className={`text-lg font-bold flex items-center justify-end gap-1 ${results.simulated.confidence >= results.baseline.confidence ? "text-wasabi" : "text-earth"
                            }`}>
                            {results.simulated.confidence >= results.baseline.confidence ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            {(results.simulated.confidence * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>
            )}
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

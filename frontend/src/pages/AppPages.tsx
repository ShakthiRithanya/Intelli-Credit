import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Activity, AlertTriangle, BarChart3, Building2,
    CheckCircle2, ChevronRight, FlaskConical, Gavel, Globe, Info, Landmark,
    Percent, PieChart, ShieldCheck,
    TrendingUp, TrendingDown, ExternalLink, FileSearch, X,
    Layout, Layers, FileText
} from 'lucide-react';
import { GlassCard, MetricCard, RiskBadge } from '../components/BaseUI';
import { FiveCRadarChart, ShapBarChart } from '../components/Charts';
import { WhatIfPanel, CamViewer } from '../components/Decisioning';

import { API_BASE_URL } from '../config';
// const API_BASE_URL = 'http://localhost:8000';

/* Inline stat block for the decision hero */
const DecisionStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-khaki/60">
            {icon}
            <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
        </div>
        <div className="text-lg font-bold text-white tracking-tight">{value}</div>
    </div>
);

/* --- FeatureSnippetModal --- */
const FeatureSnippetModal: React.FC<{ 
    feature: string | null; 
    snippets: any[]; 
    onClose: () => void 
}> = ({ feature, snippets, onClose }) => {
    if (!feature) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-card w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                        <FileSearch size={16} className="text-khaki" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-white">
                            Evidence for: <span className="text-khaki">{feature.replace(/_/g, ' ')}</span>
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={18} className="text-khaki/60 hover:text-white" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4">
                    {snippets.length === 0 ? (
                        <p className="text-[11px] text-khaki/60 italic text-center py-8">No specific source snippets found for this factor.</p>
                    ) : (
                        snippets.map((s, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.03] space-y-2">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                    <span className="text-khaki/60">{s.source_doc}</span>
                                    <span className={`px-2 py-0.5 rounded ${
                                        s.severity === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-khaki/10 text-khaki'
                                    }`}>{s.source_type}</span>
                                </div>
                                <p className="text-xs text-white leading-relaxed font-medium italic">"{s.text}"</p>
                            </div>
                        ))
                    )}
                </div>
                
                <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-khaki text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-white transition-colors">
                        CLOSE
                    </button>
                </div>
            </div>
        </div>
    );
};

/* --- WhyThisDecisionCard --- */
const WhyThisDecisionCard: React.FC<{ id: string }> = ({ id }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios.get(`${API_BASE_URL}/companies/${id}/explanation`)
            .then(res => setData(res.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading || !data) return null;

    return (
        <GlassCard title="Why This Decision?" icon={<FlaskConical size={18} className="text-khaki" />}>
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <RiskBadge risk={data.risk_class} />
                    <span className="text-[10px] font-bold text-khaki/40 uppercase tracking-widest">Confidence: {(data.confidence * 100).toFixed(1)}%</span>
                </div>
                <ul className="space-y-3">
                    {data.bullets.map((bullet: string, idx: number) => (
                        <li key={idx} className="flex gap-3 text-[11px] text-khaki/90 leading-relaxed font-medium">
                            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-khaki mt-1.5" />
                            {bullet}
                        </li>
                    ))}
                </ul>
            </div>
        </GlassCard>
    );
};

/* --- ExternalIntelCard --- */
const ExternalIntelCard: React.FC<{ id: string }> = ({ id }) => {
    const [intel, setIntel] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios.get(`${API_BASE_URL}/companies/${id}/external-intel`)
            .then(res => setIntel(res.data))
            .catch(() => setIntel([]))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading || intel.length === 0) return null;

    return (
        <GlassCard title="External Intelligence (News & Regulatory)" icon={<Globe size={18} className="text-khaki" />}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="p-2 rounded bg-white/5 border border-white/10">
                        <div className="text-[8px] uppercase text-khaki/60 font-bold">Ext. Litigation</div>
                        <div className="text-xs font-bold text-earth">HIGH (3/3)</div>
                    </div>
                    <div className="p-2 rounded bg-white/5 border border-white/10">
                        <div className="text-[8px] uppercase text-khaki/60 font-bold">MCA Score</div>
                        <div className="text-xs font-bold text-earth">YELLOW (2/3)</div>
                    </div>
                </div>

                <div className="space-y-3">
                    {intel.map((item, idx) => (
                        <div key={idx} className="group p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                            <div className="flex justify-between items-start mb-1">
                                <span className={`flex items-center gap-1.5 text-[9px] font-black px-1.5 py-0.5 rounded ${
                                    item.source_type === 'NEWS' ? 'bg-blue-500/10 text-blue-400' : 
                                    item.source_type === 'MCA' ? 'bg-amber-500/10 text-amber-400' : 'bg-purple-500/10 text-purple-400'
                                }`}>
                                    {item.source_type === 'NEWS' ? <Globe size={10} /> : item.source_type === 'MCA' ? <FileSearch size={10} /> : <Gavel size={10} />}
                                    {item.source_type}
                                </span>
                                <span className="text-[8px] text-khaki/40 font-mono">{item.published_date}</span>
                            </div>
                            <h4 className="text-[11px] font-bold text-white leading-tight group-hover:text-khaki transition-colors">{item.headline}</h4>
                            <p className="text-[10px] text-khaki/60 mt-1 line-clamp-2 italic">"{item.risk_summary}"</p>
                            <div className="mt-2 flex justify-end">
                                <button className="text-[9px] font-bold text-khaki flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    VIEW SOURCE <ExternalLink size={10} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </GlassCard>
    );
};

const FinancialSpreadingCard: React.FC<{ id: string }> = ({ id }) => {
    const [ratios, setRatios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios.get(`${API_BASE_URL}/companies/${id}/ratios`)
            .then(res => setRatios(res.data))
            .catch(() => setRatios([]))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="glass-card p-12 text-center text-khaki/20 animate-pulse uppercase tracking-[0.3em] font-black italic">
            SYNTHESIZING FINANCIAL LAYERS...
        </div>
    );
    if (ratios.length === 0) return null;

    // Helper for a simple sparkline
    const generateSparkline = (values: number[]) => {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const points = values.map((v, i) => `${(i / (values.length - 1)) * 40},${15 - ((v - min) / range) * 15}`).join(' ');
        return (
            <svg width="40" height="15" className="overflow-visible">
                <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    };

    return (
        <GlassCard title="Financial Spreading & Ratios" icon={<TrendingUp size={18} className="text-khaki" />}>
            <div className="overflow-hidden">
                <div className="grid grid-cols-6 gap-2 mb-4 px-4 py-3 bg-white/[0.03] rounded-xl text-[9px] font-black uppercase tracking-widest text-khaki/50 border border-white/5">
                    <div>Fiscal Year</div>
                    <div className="text-right">EBIT Margin</div>
                    <div className="text-right">Int. Coverage</div>
                    <div className="text-right">DSCR Ratio</div>
                    <div className="text-right">D/E Ratio</div>
                    <div className="text-center">Health</div>
                </div>
                
                <div className="space-y-2">
                    {ratios.map((r, idx) => {
                        const prev = ratios[idx - 1];
                        const isImproving = prev ? r.ebit_margin > prev.ebit_margin : null;
                        
                        return (
                            <div key={r.year} className="group grid grid-cols-6 items-center gap-2 px-4 py-4 rounded-2xl hover:bg-white/[0.03] border border-transparent hover:border-white/10 transition-all">
                                <div className="text-[11px] font-black text-white italic tracking-tighter">{r.year}</div>
                                
                                <div className="text-right space-y-1">
                                    <div className="text-xs font-black text-white italic tracking-tight">{(r.ebit_margin * 100).toFixed(1)}%</div>
                                    <div className={`flex justify-end ${isImproving === true ? 'text-wasabi' : isImproving === false ? 'text-earth' : 'text-khaki/20'}`}>
                                        {generateSparkline(ratios.slice(0, idx + 1).map(x => x.ebit_margin))}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-xs font-black text-white tracking-tighter italic">{r.interest_coverage_proxy.toFixed(1)}x</div>
                                    <div className="text-[8px] font-bold text-khaki/30 uppercase tracking-tighter">Interest Cov.</div>
                                </div>

                                <div className="text-right">
                                    <div className="text-xs font-black text-white tracking-tighter italic">{r.dscr_proxy.toFixed(1)}x</div>
                                    <div className="text-[8px] font-bold text-khaki/30 uppercase tracking-tighter">DSCR Proxy</div>
                                </div>

                                <div className="text-right">
                                    <div className="text-xs font-black text-white tracking-tighter italic">{r.debt_to_equity_proxy.toFixed(1)}x</div>
                                    <div className="text-[8px] font-bold text-khaki/30 uppercase tracking-tighter">Leverage</div>
                                </div>

                                <div className="flex justify-center">
                                    <div className={`w-3 h-3 rounded-full ${
                                        r.overall_flag === 'OK' ? 'bg-wasabi shadow-[0_0_12px_rgba(128,144,118,0.4)]' : 
                                        r.overall_flag === 'WATCH' ? 'bg-khaki shadow-[0_0_12px_rgba(248,215,148,0.4)]' : 
                                        'bg-earth shadow-[0_0_12px_rgba(184,104,48,0.4)]'
                                    }`} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="mt-8 p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-4">
                <div className="p-2 rounded-lg bg-khaki/10 text-khaki">
                    <Info size={14} />
                </div>
                <p className="text-[10px] text-khaki/40 leading-relaxed italic">
                    <span className="text-white font-bold not-italic">Data Provenance:</span> Financial proxies are derived from multi-period GSTR-1 historical trends combined with simulated bank statement velocity and limit utilization patterns.
                </p>
            </div>
        </GlassCard>
    );
};
const IndiaSpecificSignalsCard: React.FC<{ metrics: any }> = ({ metrics }) => {
    if (!metrics) return null;

    const isHighMismatch = metrics.gst_mismatch_flag === 'HIGH';

    return (
        <GlassCard title="India-Specific Compliance" icon={<Landmark size={18} className="text-khaki" />}>
            <div className="space-y-4">
                <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] group">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-khaki/60">GSTR-2A vs 3B ITC Mismatch</p>
                            <h4 className={`text-sm font-bold mt-0.5 ${isHighMismatch ? 'text-red-400' : 'text-white'}`}>
                                {metrics.gst_mismatch_flag}
                            </h4>
                        </div>
                        <div className={`p-1.5 rounded-lg ${isHighMismatch ? 'bg-red-500/10' : 'bg-khaki/10'}`}>
                            <AlertTriangle size={14} className={isHighMismatch ? 'text-red-400' : 'text-khaki'} />
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                        <p className="text-[9px] text-khaki/40 leading-relaxed max-w-[140px]">
                            {isHighMismatch 
                                ? 'Potential over-claiming of Input Tax Credit detected.' 
                                : 'ITC claimed in 3B aligns with vendor uploads in 2A.'}
                        </p>
                        <div className="text-right">
                            <p className="text-[8px] font-bold text-khaki/20 uppercase tracking-tighter">Gap Amount</p>
                            <p className="text-[11px] font-mono font-bold text-white">
                                ₹{((metrics.gstr_3b_itc_claimed - metrics.gstr_2a_itc_amount) / 1000).toFixed(1)}k
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                        <p className="text-[9px] font-black uppercase tracking-widest text-khaki/60 mb-1">CIBIL Commercial</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-mono font-bold text-white">{metrics.cibil_commercial_score}</span>
                            <span className="text-[9px] font-bold text-khaki/30">/ 900</span>
                        </div>
                        {metrics.cibil_commercial_score < 650 && (
                            <p className="text-[8px] font-bold text-red-400 uppercase mt-1">Potential Bureau Risk</p>
                        )}
                    </div>
                    <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                        <p className="text-[9px] font-black uppercase tracking-widest text-khaki/60 mb-1">Mismatch Score</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-mono font-bold text-white">{metrics.gst_mismatch_score}</span>
                            <span className="text-[9px] font-bold text-khaki/30">/ 2</span>
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};
export const CompanyListPage: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log(`Fetching from: ${API_BASE_URL}/companies`);
        axios.get(`${API_BASE_URL}/companies`)
            .then(res => {
                console.log("Data received:", res.data);
                if (Array.isArray(res.data)) {
                    setCompanies(res.data);
                } else {
                    console.error("Data is not an array:", res.data);
                }
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setError(err.message || "Failed to fetch companies.");
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex h-[60vh] items-center justify-center text-emerald-500 animate-pulse font-bold uppercase tracking-widest">Integrating Engine Data...</div>;

    if (error) return (
        <div className="flex h-[60vh] flex-col items-center justify-center text-earth gap-4">
            <div className="text-xl font-bold uppercase italic tracking-tighter">Connection Interrupted</div>
            <div className="text-sm text-khaki/60">{error}</div>
            <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-khaki/10 border border-khaki/30 text-khaki font-bold rounded-lg hover:bg-khaki hover:text-noir transition-all"
            >
                RETRY CONNECTION
            </button>
        </div>
    );

    return (
        <div className="space-y-12 fade-up">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-2">
                    <h1 className="text-5xl font-extrabold tracking-tighter">
                        Enterprise <span className="gradient-text">Risk Portfolio</span>
                    </h1>
                    <p className="text-khaki/60 max-w-xl">
                        Real-time credit monitoring using multi-source data synthesis. Select an account to evaluate model drivers and simulate market scenarios.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="glass-panel p-2 flex items-center gap-4 border-khaki/20 bg-khaki/[0.04]">
                        <div className="text-right">
                            <div className="text-[10px] uppercase font-bold text-khaki">Portfolio Health</div>
                            <div className="text-white font-bold">Stable</div>
                        </div>
                        <Activity size={20} className="text-khaki" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.length > 0 ? (
                    companies.map((c: any) => (
                        <button
                            key={c.company_id}
                            onClick={() => onSelect(c.company_id)}
                            className="glass-card group hover:scale-[1.02] transition-all duration-500 cursor-pointer text-left w-full"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-khaki/20 to-transparent flex items-center justify-center text-khaki group-hover:from-khaki group-hover:text-noir transition-all duration-500">
                                        <Building2 size={28} />
                                    </div>
                                    <RiskBadge risk={c.risk_class} />
                                </div>

                                <div>
                                    <h3 className="text-2xl font-bold group-hover:text-khaki transition-colors text-white">{c.name}</h3>
                                    <p className="text-khaki/50 text-sm font-medium">{c.sector}</p>
                                </div>

                                <div className="pt-4 border-t border-khaki/10 flex justify-between items-center text-khaki/70">
                                    <div className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck size={12} className="text-khaki" />
                                        CAM Validated
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold group-hover:text-white transition-colors">
                                        VIEW DASHBOARD <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center border border-dashed border-khaki/20 rounded-2xl bg-khaki/[0.02]">
                        <p className="text-khaki/40 font-bold uppercase tracking-widest">No active portfolio companies detected.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

/* --- CompanyDashboardPage --- */
export const CompanyDashboardPage: React.FC<{ 
    id: string; 
    onNavigate?: (route: string, id: string) => void 
}> = ({ id, onNavigate }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [mode, setMode] = useState<'baseline' | 'simulated'>('baseline');
    const [baselineSummary, setBaselineSummary] = useState<any>(null);
    const [simulatedSummary, setSimulatedSummary] = useState<any>(null);
    const [cam, setCam] = useState<any>(null);
    const [overrides, setOverrides] = useState<any>(null);
    const [simResults, setSimResults] = useState<any>(null);
    const [loadingSim, setLoadingSim] = useState(false);
    const [error, setError] = useState('');
    
    const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
    const [selectedSnippets, setSelectedSnippets] = useState<any[]>([]);

    const handleFeatureClick = (feature: string) => {
        setSelectedFeature(feature);
        axios.get(`${API_BASE_URL}/companies/${id}/feature-snippets?feature=${feature}`)
            .then(res => setSelectedSnippets(res.data.snippets))
            .catch(() => setSelectedSnippets([]));
    };

    useEffect(() => {
        setMode('baseline');
        setBaselineSummary(null);
        setSimulatedSummary(null);
        setCam(null);
        setSimResults(null);
        setError('');

        Promise.all([
            axios.get(`${API_BASE_URL}/companies/${id}/summary`),
            axios.get(`${API_BASE_URL}/companies/${id}/cam`)
        ]).then(([sumRes, camRes]) => {
            setBaselineSummary(sumRes.data);
            setCam(camRes.data);
            setOverrides({
                gst_growth_6m: sumRes.data.metrics.gst_growth_6m,
                bank_emi_bounce_count: sumRes.data.metrics.bank_emi_bounce_count,
                litigation_risk_score: sumRes.data.metrics.litigation_risk_score
            });
        }).catch(err => {
            setError(`Failed to load data for ${id}. Is the backend running? (${err?.message || 'Network error'})`);
        });
    }, [id]);

    const runSimulation = () => {
        setLoadingSim(true);
        axios.post(`${API_BASE_URL}/companies/${id}/simulate`, { overrides })
            .then(res => {
                setSimResults(res.data);
                setSimulatedSummary(res.data.simulated);
                setMode('simulated');
            })
            .finally(() => setLoadingSim(false));
    };

    if (error) return (
        <div className="flex flex-col h-[60vh] items-center justify-center gap-4 text-rose-400">
            <AlertTriangle size={32} />
            <p className="font-bold text-sm text-center max-w-md">{error}</p>
        </div>
    );
    if (!baselineSummary || !cam) return <div className="flex h-[80vh] items-center justify-center bg-noir/40 rounded-3xl border border-white/5"><div className="flex flex-col items-center gap-4"><div className="w-12 h-12 border-t-2 border-khaki rounded-full animate-spin"></div><div className="text-wasabi animate-pulse font-bold uppercase tracking-[0.3em] text-[10px] italic">Synthesizing Datapoints...</div></div></div>;

    const activeSummary = (mode === 'simulated' && simulatedSummary) ? simulatedSummary : baselineSummary;
    const riskClass = activeSummary.risk_class as string;

    const decisionMap: Record<string, { status: string; statusColor: string; limit: string; rate: string; verdict: string }> = {
        low_risk: { status: 'APPROVED', statusColor: 'text-wasabi border-wasabi/30 bg-wasabi/10', limit: '₹15 Cr – ₹25 Cr', rate: 'REPO + 350 bps (~9.5%)', verdict: 'Strong financial profile. Full sanction recommended.' },
        medium_risk: { status: 'CONDITIONALLY APPROVED', statusColor: 'text-khaki border-khaki/30 bg-khaki/10', limit: '₹8 Cr – ₹12 Cr', rate: 'REPO + 825 bps (~13.5%)', verdict: 'Moderate risk signals. Approve with tighter covenants.' },
        high_risk: { status: 'DECLINED', statusColor: 'text-earth border-earth/30 bg-earth/10', limit: 'N/A', rate: 'N/A', verdict: 'Elevated litigation & cash flow risks. Decline recommended.' },
    };
    const decision = decisionMap[riskClass] ?? decisionMap['medium_risk'];

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Layout size={14} /> },
        { id: 'memo', label: 'Credit Memo', icon: <FileText size={14} /> },
        { id: 'documents', label: 'Docs & Intel', icon: <FileSearch size={14} /> },
        { id: 'financials', label: 'Financials', icon: <TrendingUp size={14} /> },
        { id: 'sandbox', label: 'What-If Lab', icon: <FlaskConical size={14} /> },
    ];

    return (
        <div className="space-y-6 fade-up min-h-screen">
            {/* ══════════════════════════════════════════════════════════════
                PREMIUM HERO BAR
            ══════════════════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-6 md:p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-khaki/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
                
                <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-khaki text-noir flex items-center justify-center font-black text-2xl shadow-[0_0_30px_rgba(195,170,113,0.3)]">
                                {activeSummary.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter text-white">{activeSummary.name}</h1>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] font-black text-khaki/60 uppercase tracking-[0.2em]">{activeSummary.sector}</span>
                                    <span className="w-1 h-1 rounded-full bg-khaki/20" />
                                    <span className="text-[10px] font-bold text-khaki/40">Enterprise ID: <span className="text-white font-mono">{id.substring(0, 8)}</span></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
                        <div className="px-6 py-2 border-r border-white/5">
                            <div className="text-[9px] font-black text-khaki/40 uppercase tracking-widest mb-1">Risk Profile</div>
                            <RiskBadge risk={riskClass} />
                        </div>
                        <div className="px-6 py-2 border-r border-white/5">
                            <div className="text-[9px] font-black text-khaki/40 uppercase tracking-widest mb-1">Model Score</div>
                            <div className="text-xl font-black text-white italic tracking-tighter">{(activeSummary.confidence * 100).toFixed(1)}%</div>
                        </div>
                        <div className="px-6 py-2">
                             <div className="text-[9px] font-black text-khaki/40 uppercase tracking-widest mb-1">Sanction Limit</div>
                             <div className="text-xl font-black text-wasabi italic tracking-tighter">{decision.limit}</div>
                        </div>
                    </div>
                </div>

                {/* Simulation indicator */}
                {mode === 'simulated' && (
                    <div className="mt-8 flex items-center gap-3 px-4 py-2 rounded-xl bg-khaki/10 border border-khaki/30 text-khaki mx-auto lg:mx-0 w-fit">
                        <FlaskConical size={14} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Active: Strategic Simulation Mode</span>
                        <button onClick={() => setMode('baseline')} className="ml-4 text-[9px] font-black bg-khaki text-noir px-3 py-1 rounded-lg hover:bg-white transition-colors">RESET BASELINE</button>
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                TAB NAVIGATION
            ══════════════════════════════════════════════════════════════ */}
            <div className="flex flex-wrap items-center gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-2xl w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
                            activeTab === tab.id 
                            ? 'bg-khaki text-noir shadow-[0_0_20px_rgba(195,170,113,0.2)] scale-[1.05]' 
                            : 'text-khaki/40 hover:text-khaki hover:bg-white/5'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                SECTION CONTENT
            ══════════════════════════════════════════════════════════════ */}
            <div className="pt-4 transition-all duration-500">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start fade-up">
                        {/* Main Intelligence Engine (Left) */}
                        <div className="lg:col-span-8 space-y-8">
                            {/* Decision Hero (Banner Style) */}
                            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.02]">
                                <div className={`absolute top-0 right-0 w-1/3 h-full opacity-10 blur-[80px] ${riskClass === 'low_risk' ? 'bg-wasabi' : riskClass === 'high_risk' ? 'bg-earth' : 'bg-khaki'}`} />
                                <div className="p-10 relative z-10">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                                        <div className="space-y-6 flex-1 text-center md:text-left">
                                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-khaki/40 italic">Synthesized Appraisal Verdict</div>
                                            <div className="flex flex-col md:flex-row items-center gap-6">
                                                <div className={`inline-flex items-center gap-3 text-lg font-black uppercase tracking-[0.2em] px-8 py-3 rounded-full border shadow-[0_0_30px_rgba(0,0,0,0.3)] ${decision.statusColor}`}>
                                                    {riskClass === 'low_risk' ? <CheckCircle2 size={22} /> : 
                                                     riskClass === 'high_risk' ? <AlertTriangle size={22} /> : <Info size={22} />}
                                                    {decision.status}
                                                </div>
                                                <div className="hidden md:block w-px h-10 bg-white/10" />
                                                <p className="text-white text-xl font-bold font-serif italic max-w-sm leading-tight">
                                                    "{decision.verdict}"
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-10 bg-black/20 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                                            <DecisionStat icon={<Landmark size={20} className="text-khaki" />} label="Sanction Cap" value={decision.limit} />
                                            <DecisionStat icon={<Percent size={20} className="text-khaki" />} label="Premium" value={decision.rate} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Middle Intelligence Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Local Explainability (Moved here for balance) */}
                                <GlassCard title="Explainability Driven (SHAP)" icon={<BarChart3 size={18} />}>
                                    <div className="p-2">
                                        <ShapBarChart data={activeSummary?.shap?.top_drivers_for_class ?? []} onFeatureClick={handleFeatureClick} />
                                    </div>
                                    <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                                        <p className="text-[9px] text-khaki/40 italic uppercase tracking-widest">Positive vs Negative feature impact on current classification.</p>
                                    </div>
                                </GlassCard>

                                <div className="space-y-6">
                                    <MetricCard
                                        label="GST Momentum"
                                        value={`${((activeSummary?.metrics?.gst_growth_6m ?? 0) * 100).toFixed(1)}%`}
                                        subValue="Trailing 6M Trend"
                                        trend={(activeSummary?.metrics?.gst_growth_6m ?? 0) > 0 ? 'up' : 'down'}
                                    />
                                    <MetricCard
                                        label="Avg Sales Inflow"
                                        value={`₹${((activeSummary?.metrics?.gst_avg_monthly_sales ?? 0) / 1000000).toFixed(1)}M`}
                                        subValue="Monthly Average"
                                    />
                                    <MetricCard
                                        label="EMI Health"
                                        value={activeSummary?.metrics?.bank_emi_bounce_count ?? 0}
                                        subValue="Bounces (Last 12M)"
                                        trend={(activeSummary?.metrics?.bank_emi_bounce_count ?? 0) > 0 ? 'down' : 'up'}
                                    />
                                    <MetricCard
                                        label="Litigation Index"
                                        value={`${activeSummary?.metrics?.litigation_risk_score ?? 0} / 3`}
                                        subValue="Regulatory Check"
                                        trend={(activeSummary?.metrics?.litigation_risk_score ?? 0) > 1 ? 'down' : 'up'}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Column (Right) */}
                        <div className="lg:col-span-4 space-y-8">
                             <GlassCard title="Five Cs Health Factor" icon={<PieChart size={18} />}>
                                <div className="p-4 bg-white/[0.01] rounded-full border border-white/5 mb-6">
                                    {activeSummary?.five_c_scores && <FiveCRadarChart scores={activeSummary.five_c_scores} />}
                                </div>
                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black uppercase text-khaki/40 tracking-widest">Primary Strength</span>
                                            <span className="text-[10px] font-black text-wasabi uppercase tracking-tighter italic">Top Performer</span>
                                        </div>
                                        <div className="text-sm font-black text-white italic">Robust Capital Adequacy</div>
                                        <p className="text-[10px] text-khaki/40 leading-relaxed italic">The enterprise maintains a low D/E ratio which anchors the overall health score at Low Risk.</p>
                                    </div>
                                    
                                    <button 
                                        onClick={() => setActiveTab('memo')}
                                        className="w-full py-4 bg-khaki text-noir rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(195,170,113,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                                    >
                                        Review Detailed Credit Memo
                                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                )}

                {activeTab === 'memo' && (
                    <div className="fade-up max-w-5xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-white italic tracking-tight flex items-center gap-3">
                                <FileText className="text-khaki" />
                                Credit Appraisal Memo (Five Cs Framework)
                            </h2>
                            <button 
                                onClick={() => {
                                    window.open(`${API_BASE_URL}/companies/${id}/export-pdf`, '_blank');
                                }}
                                className="px-6 py-2 bg-khaki/10 text-khaki border border-khaki/30 text-[10px] font-black rounded-xl hover:bg-khaki hover:text-noir transition-all"
                            >
                                EXPORT PDF REPORT
                            </button>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 lg:p-12 min-h-[70vh]">
                            <CamViewer markdown={cam.cam_markdown} />
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start fade-up">
                        <div className="lg:col-span-7 space-y-8">
                            <DocumentsExtractionCard id={id} onNavigate={onNavigate} />
                            
                            {/* Neural Extraction Insight */}
                            <div className="p-8 rounded-3xl bg-earth/[0.03] border border-earth/20 flex items-start gap-6">
                                <div className="p-4 rounded-2xl bg-earth/20 text-earth">
                                    <Activity size={24} />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-white italic">Neural OCR layers and risk extraction</h3>
                                    <p className="text-khaki/60 text-sm leading-relaxed">
                                        The system has successfully scanned <span className="text-white font-bold">2 multi-page PDF documents</span>. OCR layers detected a potential "litigation" keyword linked to a ₹3.2Cr liability notice. 
                                    </p>
                                    <button 
                                        onClick={() => onNavigate?.('company_documents', id)}
                                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-earth hover:text-white transition-colors"
                                    >
                                        ENTER DEEP EXTRACTION Cockpit <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-5 space-y-8">
                            <IndiaSpecificSignalsCard metrics={baselineSummary?.metrics} />
                            <ExternalIntelCard id={id} />
                        </div>
                    </div>
                )}

                {activeTab === 'financials' && (
                    <div className="space-y-8 fade-up">
                        {/* Summary KPI Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                                <div className="text-[9px] font-black text-khaki/40 uppercase tracking-widest">DSCR Projection</div>
                                <div className="text-xl font-black text-white italic">2.5x <span className="text-[10px] text-wasabi ml-1">▲ 0.2</span></div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                                <div className="text-[9px] font-black text-khaki/40 uppercase tracking-widest">Fixed Asset Turn</div>
                                <div className="text-xl font-black text-white italic">4.8x <span className="text-[10px] text-khaki/20 ml-1">STABLE</span></div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                                <div className="text-[9px] font-black text-khaki/40 uppercase tracking-widest">Net Margin (Est.)</div>
                                <div className="text-xl font-black text-white italic">17.0% <span className="text-[10px] text-wasabi ml-1">+1% YoY</span></div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                                <div className="text-[9px] font-black text-khaki/40 uppercase tracking-widest">Int. Coverage Proxy</div>
                                <div className="text-xl font-black text-white italic">4.8x <span className="text-[10px] text-earth ml-1">▼ 0.5</span></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            <div className="lg:col-span-8">
                                <FinancialSpreadingCard id={id} />
                            </div>
                            <div className="lg:col-span-4 space-y-6">
                                <div className="space-y-6">
                                    <WhyThisDecisionCard id={id} />
                                    <GlassCard title="Risk Intelligence" icon={<AlertTriangle size={18} />}>
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-2xl bg-earth/[0.08] border border-earth/20 group relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-2 text-earth/20 group-hover:text-earth/40 transition-colors">
                                                    <TrendingDown size={32} />
                                                </div>
                                                <div className="relative z-10">
                                                    <div className="text-[10px] font-black text-earth uppercase tracking-widest mb-1">Ratio Alert</div>
                                                    <p className="text-xs text-white font-bold leading-relaxed">Interest Coverage Proxy has dipped 15% YoY.</p>
                                                    <div className="mt-2 text-[9px] text-khaki/40 italic">Impacts overall debt sustainability score.</div>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-khaki/[0.05] border border-khaki/20 group relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-2 text-khaki/10 group-hover:text-khaki/20 transition-colors">
                                                    <Activity size={32} />
                                                </div>
                                                <div className="relative z-10">
                                                    <div className="text-[10px] font-black text-khaki uppercase tracking-widest mb-1">Growth Warning</div>
                                                    <p className="text-xs text-white font-bold leading-relaxed">GSTR-1 Momentum is slower than sector benchmark.</p>
                                                    <div className="mt-2 text-[9px] text-khaki/40 italic">Market share erosion risk detected in Q3.</div>
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'sandbox' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start fade-up">
                        <div className="lg:col-span-5 space-y-6">
                            <GlassCard title="Strategic Simulation Sandbox" icon={<FlaskConical size={18} />}>
                                <p className="text-xs text-khaki/60 mb-8 italic leading-relaxed">Adjust input parameters to observe real-time score shifts and driver reallocation.</p>
                                <WhatIfPanel
                                    overrides={overrides}
                                    setOverrides={setOverrides}
                                    onSimulate={runSimulation}
                                    onReset={() => {
                                        setMode('baseline');
                                        setSimResults(null);
                                        setSimulatedSummary(null);
                                        setOverrides({
                                            gst_growth_6m: baselineSummary.metrics.gst_growth_6m,
                                            bank_emi_bounce_count: baselineSummary.metrics.bank_emi_bounce_count,
                                            litigation_risk_score: baselineSummary.metrics.litigation_risk_score
                                        });
                                    }}
                                    loading={loadingSim}
                                    results={simResults}
                                />
                            </GlassCard>
                        </div>
                        <div className="lg:col-span-7">
                            <div className="p-10 rounded-[32px] bg-noir border border-white/5 relative overflow-hidden min-h-[500px]">
                                {/* Lab background effect */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-khaki/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-wasabi/5 blur-[100px] rounded-full -ml-32 -mb-32" />

                                {mode === 'simulated' && simulatedSummary ? (
                                    <div className="relative z-10 space-y-10 fade-up">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-8">
                                            <div className="space-y-1">
                                                <h3 className="text-[10px] font-black uppercase text-khaki/40 tracking-[0.2em]">Strategic Insight Engine</h3>
                                                <div className="text-2xl font-black text-white italic">SIMULATED RISK SHIFT</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-[8px] font-black uppercase text-khaki/40">Confidence</div>
                                                    <div className={`text-xl font-black ${(simulatedSummary.confidence > baselineSummary.confidence) ? 'text-wasabi' : 'text-earth'}`}>
                                                        {(simulatedSummary.confidence * 100).toFixed(1)}%
                                                    </div>
                                                </div>
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                                                    simulatedSummary.confidence > baselineSummary.confidence 
                                                    ? 'bg-wasabi/10 border-wasabi/20 text-wasabi shadow-[0_0_20px_rgba(128,144,118,0.2)]' 
                                                    : 'bg-earth/10 border-earth/20 text-earth shadow-[0_0_20px_rgba(184,104,48,0.2)]'
                                                }`}>
                                                    {simulatedSummary.confidence > baselineSummary.confidence ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-2">
                                                <div className="text-[10px] font-black text-khaki/40 uppercase tracking-widest">Risk Trajectory</div>
                                                <div className="flex items-end gap-2">
                                                    <div className="text-3xl font-black text-white">{(simulatedSummary.confidence - baselineSummary.confidence > 0 ? '+' : '')}{((simulatedSummary.confidence - baselineSummary.confidence)*100).toFixed(1)}%</div>
                                                    <div className="text-[10px] font-bold text-khaki/20 uppercase mb-1.5">Basis Point Shift</div>
                                                </div>
                                            </div>
                                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-2 text-right">
                                                <div className="text-[10px] font-black text-khaki/40 uppercase tracking-widest">Model Stability</div>
                                                <div className="text-3xl font-black text-wasabi">STABLE</div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-khaki/10 text-khaki rounded-lg">
                                                        <Layers size={14} />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase text-white tracking-widest">Driver Reallocation</span>
                                                </div>
                                                <span className="text-[9px] font-bold text-khaki/20 uppercase tracking-tighter">Explainability Vector: SHAP (Simulated)</span>
                                            </div>
                                            <div className="p-2 rounded-[32px] bg-white/[0.01] border border-white/5">
                                                <ShapBarChart data={simulatedSummary.shap.top_drivers_for_class} onFeatureClick={handleFeatureClick} />
                                            </div>
                                        </div>
                                        
                                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-4">
                                            <div className="p-2 rounded-lg bg-khaki/10 text-khaki mt-1">
                                                <Info size={14} />
                                            </div>
                                            <p className="text-xs text-khaki/60 italic leading-relaxed">
                                                These results represent a <span className="text-white font-bold">synthetic projection</span> based on your overrides. Actual risk may vary based on unreported external indicators.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 space-y-8">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-khaki/10 animate-[spin_20s_linear_infinite]" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-16 h-16 rounded-full bg-khaki/5 flex items-center justify-center text-khaki/20 shadow-[0_0_50px_rgba(248,215,148,0.05)]">
                                                    <FlaskConical size={32} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Strategic Impact Preview</h3>
                                            <p className="text-khaki/30 text-sm max-w-sm mx-auto italic leading-relaxed">
                                                Adjust the economic and operational parameters on the left and execute the simulation to observe the neural shift in enterprise risk.
                                            </p>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-8 w-full max-w-md pt-12 grayscale opacity-20">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="space-y-2">
                                                    <div className="h-1 bg-white/10 w-full rounded" />
                                                    <div className="h-1 bg-white/10 w-2/3 rounded" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Evidence Modal */}
            <FeatureSnippetModal 
                feature={selectedFeature} 
                snippets={selectedSnippets} 
                onClose={() => setSelectedFeature(null)} 
            />
        </div>
    );
};

/* --- DocumentsExtractionCard --- */
const DocumentsExtractionCard: React.FC<{ 
    id: string; 
    onNavigate?: (route: string, id: string) => void 
}> = ({ id, onNavigate }) => {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios.get(`${API_BASE_URL}/companies/${id}/documents`)
            .then(res => setDocs(res.data))
            .catch(() => setDocs([]))
            .finally(() => setLoading(false));
    }, [id]);

    return (
        <GlassCard title="Documents & Extraction" icon={<FileSearch size={18} />}>
            <div className="space-y-4">
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="py-8 text-center text-khaki/40 text-xs animate-pulse">Fetching Document Registry...</div>
                    ) : docs.length === 0 ? (
                        <div className="py-8 text-center text-khaki/40 text-xs">No documents registered.</div>
                    ) : (
                        docs.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-khaki/10 flex items-center justify-center text-khaki">
                                        {doc.doc_type === 'Annual Report' ? <BarChart3 size={14} /> : 
                                            doc.doc_type === 'Legal Notice' ? <Gavel size={14} /> : 
                                            <Landmark size={14} />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-white truncate max-w-[120px]">{doc.filename}</div>
                                        <div className="text-[9px] font-bold text-khaki/40 uppercase">{doc.doc_type}</div>
                                    </div>
                                </div>
                                {doc.doc_quality === 'scanned' && (
                                    <span className="text-[8px] font-black bg-earth/10 text-earth border border-earth/20 px-1.5 py-0.5 rounded">SCANNED</span>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="pt-2">
                    <button 
                        onClick={() => onNavigate?.('company_documents', id)}
                        className="w-full py-3 bg-earth/10 border border-earth/20 rounded-xl text-earth font-black text-[10px] uppercase tracking-[0.2em] hover:bg-earth hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        <Activity size={14} />
                        Open Documents & Extraction Page
                    </button>
                </div>
            </div>
        </GlassCard>
    );
};

/* --- CompanyDocumentsPage --- */
export const CompanyDocumentsPage: React.FC<{ id: string }> = ({ id }) => {
    const [docs, setDocs] = useState<any[]>([]);
    const [extraction, setExtraction] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            axios.get(`${API_BASE_URL}/companies/${id}/documents`),
            axios.get(`${API_BASE_URL}/companies/${id}/document-extraction-demo`)
        ]).then(([docsRes, extRes]) => {
            setDocs(docsRes.data);
            setExtraction(extRes.data);
        }).catch(err => {
            console.error("Failed to load documents:", err);
        }).finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="py-24 text-center text-khaki animate-pulse font-black tracking-widest uppercase">Initializing Neural Document Registry...</div>;

    return (
        <div className="space-y-10 fade-up">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Document List */}
                <div className="lg:col-span-5 space-y-6">
                    <GlassCard title="Master Document Registry" icon={<FileSearch size={18} />}>
                        <div className="space-y-4">
                            {docs.length === 0 ? (
                                <div className="py-20 text-center text-khaki/40 italic">No documents uploaded for this enterprise yet.</div>
                            ) : (
                                <div className="overflow-hidden rounded-xl border border-white/5">
                                    <table className="w-full text-left">
                                        <thead className="bg-white/[0.03] text-[9px] font-black uppercase tracking-widest text-khaki/60">
                                            <tr>
                                                <th className="px-4 py-3">Document</th>
                                                <th className="px-4 py-3 text-center">Quality</th>
                                                <th className="px-4 py-3 text-right">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {docs.map((doc, idx) => (
                                                <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-lg bg-khaki/10 text-khaki group-hover:bg-khaki group-hover:text-noir transition-all">
                                                                {doc.doc_type === 'Annual Report' ? <BarChart3 size={14} /> : 
                                                                 doc.doc_type === 'Legal Notice' ? <Gavel size={14} /> : 
                                                                 <Landmark size={14} />}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold text-white">{doc.filename}</div>
                                                                <div className="text-[10px] text-khaki/40 font-bold uppercase">{doc.doc_type}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                                                            doc.doc_quality === 'scanned' 
                                                            ? 'bg-earth/10 border-earth/30 text-earth' 
                                                            : 'bg-wasabi/10 border-wasabi/30 text-wasabi'
                                                        }`}>
                                                            {doc.doc_quality.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <div className="text-[10px] font-mono text-khaki/40">
                                                            {new Date(doc.uploaded_at).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Right: Extraction Demo */}
                <div className="lg:col-span-7">
                    <GlassCard title="OCR & Neural Extraction Demo" icon={<Activity size={18} className="text-earth" />}>
                        {extraction && !extraction.no_extraction_demo_available ? (
                            <div className="space-y-8 p-2">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] font-black uppercase text-khaki/40 tracking-widest">Raw Document Stream (OCR LAYER)</div>
                                        <div className="text-[9px] font-bold text-earth animate-pulse">● NEURAL SCANNING ACTIVE</div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-black/60 border border-white/5 font-mono text-[11px] leading-relaxed italic text-khaki/60 h-[250px] overflow-y-auto custom-scrollbar relative">
                                        <p className="whitespace-pre-wrap">{extraction.ocr_snippet}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="text-[10px] font-black uppercase text-earth tracking-widest">Risk Factor Synthesis</div>
                                    <div className="p-6 rounded-2xl bg-earth/[0.05] border border-earth/20 space-y-4">
                                        <div className="flex gap-4 items-start">
                                            <div className="p-3 rounded-full bg-earth/20 text-earth">
                                                <AlertTriangle size={20} />
                                            </div>
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-black uppercase text-white tracking-widest">Interpreted Intent</span>
                                                    <span className="text-[10px] font-black bg-earth text-white px-2 py-0.5 rounded italic">SEVERITY: {extraction.risk_item?.severity.toUpperCase()}</span>
                                                </div>
                                                <p className="text-sm font-bold text-white leading-relaxed italic">
                                                    "{extraction.clean_snippet}"
                                                </p>
                                            </div>
                                        </div>
                                        {extraction.risk_item?.amount && (
                                            <div className="pt-4 border-t border-earth/20 flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-khaki/40">Quantified Liability</span>
                                                <span className="text-2xl font-black text-earth italic tracking-tighter">₹{(extraction.risk_item.amount / 1e7).toFixed(1)} Cr</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] flex items-start gap-4">
                                    <div className="p-2 rounded-lg bg-khaki/10 text-khaki">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[11px] font-bold text-white">Downstream Scoring Impact</div>
                                        <p className="text-[10px] text-khaki/60 leading-relaxed">
                                            This extracted risk factor feeds directly into the <span className="text-white">litigation_risk_score</span> metric and appears as a negative driver in the SHAP explainability chart on the dashboard.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-32 text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-khaki/5 border border-khaki/10 flex items-center justify-center mx-auto text-khaki/20">
                                    <FileSearch size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">No Scanned Documents</h3>
                                    <p className="text-xs text-khaki/40 max-w-xs mx-auto italic">Upload a scanned legal notice or bank statement from the borrower portal to see neural OCR extraction in action.</p>
                                </div>
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

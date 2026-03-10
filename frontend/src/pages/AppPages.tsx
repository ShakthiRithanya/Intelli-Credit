
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Activity, AlertTriangle, ArrowRight, BarChart3, Building2, Calendar,
    CheckCircle2, ChevronLeft, ChevronRight, Clock, FileText, Filter,
    FlaskConical, Info, Landmark, LayoutDashboard, Lock, MoreVertical,
    Percent, PieChart, RotateCcw, Search, ShieldCheck, TrendingDown,
    TrendingUp, Users
} from 'lucide-react';
import { GlassCard, MetricCard, RiskBadge } from '../components/BaseUI';
import { FiveCRadarChart, ShapBarChart } from '../components/Charts';
import { WhatIfPanel, CamViewer } from '../components/Decisioning';
import { API_BASE_URL } from '../config';


/* --- CompanyListPage --- */
export const CompanyListPage: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/companies`)
            .then(res => setCompanies(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex h-[60vh] items-center justify-center text-emerald-500 animate-pulse font-bold uppercase tracking-widest">Initalizing Intelligence Engine...</div>;

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
                {companies.map((c: any) => (
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
                ))}
            </div>
        </div>
    );
};

/* --- CompanyDashboardPage --- */
export const CompanyDashboardPage: React.FC<{ id: string }> = ({ id }) => {
    const [mode, setMode] = useState<'baseline' | 'simulated'>('baseline');
    const [baselineSummary, setBaselineSummary] = useState<any>(null);
    const [simulatedSummary, setSimulatedSummary] = useState<any>(null);
    const [cam, setCam] = useState<any>(null);
    const [overrides, setOverrides] = useState<any>(null);
    const [simResults, setSimResults] = useState<any>(null);
    const [loadingSim, setLoadingSim] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Reset on company change
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
    if (!baselineSummary || !cam) return <div className="flex h-[60vh] items-center justify-center text-wasabi animate-pulse font-bold uppercase tracking-widest italic">Synthesizing Datapoints...</div>;

    const activeSummary = (mode === 'simulated' && simulatedSummary) ? simulatedSummary : baselineSummary;

    // ── Derive pricing from risk class ──────────────────────────────────────────
    const riskClass = activeSummary.risk_class as string;
    const decisionMap: Record<string, { status: string; statusColor: string; limit: string; rate: string; verdict: string }> = {
        low_risk: { status: 'APPROVED', statusColor: 'text-wasabi border-wasabi/30 bg-wasabi/10', limit: '₹15 Cr – ₹25 Cr', rate: 'REPO + 350 bps (~9.5%)', verdict: 'Strong financial profile. Full sanction recommended.' },
        medium_risk: { status: 'CONDITIONALLY APPROVED', statusColor: 'text-khaki border-khaki/30 bg-khaki/10', limit: '₹8 Cr – ₹12 Cr', rate: 'REPO + 825 bps (~13.5%)', verdict: 'Moderate risk signals. Approve with tighter covenants.' },
        high_risk: { status: 'DECLINED', statusColor: 'text-earth border-earth/30 bg-earth/10', limit: 'N/A', rate: 'N/A', verdict: 'Elevated litigation & cash flow risks. Decline recommended.' },
    };
    const decision = decisionMap[riskClass] ?? decisionMap['medium_risk'];

    return (
        <div className="space-y-8 fade-up">
            <div className={`flex items-center justify-between p-3 rounded-xl border ${mode === 'simulated'
                ? 'bg-khaki/10 border-khaki/30 text-khaki'
                : 'bg-white/[0.03] border-white/10 text-text-dim'}`}>
                <div className="flex items-center gap-3 px-2">
                    {mode === 'simulated' ? <FlaskConical size={18} /> : <ShieldCheck size={18} />}
                    <span className="text-xs font-bold uppercase tracking-widest font-heading">
                        {mode === 'simulated' ? 'Viewing: Simulated scenario (What-If)' : 'Viewing: Baseline Data'}
                    </span>
                </div>
                {mode === 'simulated' && (
                    <button
                        onClick={() => setMode('baseline')}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-khaki text-black text-[10px] font-black uppercase hover:bg-khaki/80 transition-colors"
                    >
                        <RotateCcw size={12} /> Revert to Baseline
                    </button>
                )}
            </div>

            {/* ── Company title ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tighter mb-1 text-white">{activeSummary.name}</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-khaki/60 uppercase tracking-widest">{activeSummary.sector}</span>
                        <span className="w-1 h-1 rounded-full bg-khaki/20" />
                        <RiskBadge risk={riskClass} />
                        <span className="text-[11px] text-khaki/60">
                            Model confidence: <span className="text-white font-bold mono">{(activeSummary.confidence * 100).toFixed(1)}%</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                CREDIT DECISION HERO
            ══════════════════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className={`h-1 w-full ${riskClass === 'low_risk' ? 'bg-gradient-to-r from-wasabi to-emerald-primary' : riskClass === 'high_risk' ? 'bg-gradient-to-r from-earth to-earth-deep' : 'bg-gradient-to-r from-khaki to-khaki-soft'}`} />

                <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-khaki/60">AI Credit Decision</div>
                            <div className={`inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full border ${decision.statusColor}`}>
                                {riskClass === 'low_risk' && <CheckCircle2 size={15} />}
                                {riskClass === 'high_risk' && <AlertTriangle size={15} />}
                                {riskClass === 'medium_risk' && <Info size={15} />}
                                {decision.status}
                            </div>
                            <p className="text-khaki/80 text-sm max-w-md">{decision.verdict}</p>
                        </div>

                        <div className="flex flex-wrap gap-6 shrink-0">
                            <DecisionStat icon={<Landmark size={16} />} label="Suggested Loan Limit" value={decision.limit} />
                            <DecisionStat icon={<Percent size={16} />} label="Risk-Based Pricing" value={decision.rate} />
                            <DecisionStat icon={<ShieldCheck size={16} />} label="Model Confidence" value={`${(activeSummary.confidence * 100).toFixed(1)}%`} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                WHAT-IF SIMULATION
            ══════════════════════════════════════════════════════════════ */}
            <div className="fade-up">
                <GlassCard title="Strategic Simulation Sandbox (Human-in-the-Loop)" icon={<FlaskConical size={18} />}>
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

            {/* ══════════════════════════════════════════════════════════════
                ANALYSIS GRID
            ══════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <GlassCard title="Financial Metrics" icon={<TrendingUp size={18} />}>
                        <div className="grid grid-cols-1 gap-4">
                            <MetricCard
                                label="GST Growth (6m)"
                                value={`${((activeSummary?.metrics?.gst_growth_6m ?? 0) * 100).toFixed(1)}%`}
                                subValue={(activeSummary?.metrics?.gst_growth_6m ?? 0) > 0 ? '+ Above Benchmark' : '- Below Trend'}
                                trend={(activeSummary?.metrics?.gst_growth_6m ?? 0) > 0 ? 'up' : 'down'}
                            />
                            <MetricCard
                                label="Monthly Inflow (Avg)"
                                value={`₹${((activeSummary?.metrics?.gst_avg_monthly_sales ?? 0) / 1000000).toFixed(1)}M`}
                            />
                            <MetricCard
                                label="EMI Bounces"
                                value={activeSummary?.metrics?.bank_emi_bounce_count ?? 0}
                                subValue={(activeSummary?.metrics?.bank_emi_bounce_count ?? 0) > 0 ? 'Potential Default' : 'Strong Repayment'}
                                trend={(activeSummary?.metrics?.bank_emi_bounce_count ?? 0) > 0 ? 'down' : 'up'}
                            />
                            <MetricCard
                                label="Litigation Index"
                                value={`${activeSummary?.metrics?.litigation_risk_score ?? 0} / 3`}
                                subValue={(activeSummary?.metrics?.litigation_risk_score ?? 0) > 1 ? 'Material Risks' : 'Clean History'}
                                trend={(activeSummary?.metrics?.litigation_risk_score ?? 0) > 1 ? 'down' : 'up'}
                            />
                        </div>
                    </GlassCard>
                </div>

                <div className="lg:col-span-5 space-y-6">
                    <GlassCard title="Five Cs Health Factor" icon={<PieChart size={18} />}>
                        {activeSummary?.five_c_scores && <FiveCRadarChart scores={activeSummary.five_c_scores} />}
                    </GlassCard>
                    <GlassCard title="Local Explainability (SHAP)" icon={<BarChart3 size={18} />}>
                        <p className="text-[10px] text-khaki/60 mb-4 italic">
                            Feature drivers for <span className="text-white">{riskClass.replace('_', ' ')}</span> classification.
                        </p>
                        {activeSummary?.shap?.top_drivers_for_class && <ShapBarChart data={activeSummary.shap.top_drivers_for_class} />}
                    </GlassCard>
                </div>

                <div className="lg:col-span-4">
                    <div className="glass-card max-h-[860px] flex flex-col">
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={15} className="text-khaki" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-white">Credit Appraisal Memo</h3>
                            </div>
                            <button className="text-[10px] font-bold text-khaki/60 hover:text-white border border-white/10 px-2 py-1 rounded">
                                EXPORT PDF
                            </button>
                        </div>
                        <CamViewer markdown={cam.cam_markdown} />
                    </div>
                </div>
            </div>
        </div>
    );
};


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

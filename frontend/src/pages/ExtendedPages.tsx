
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer, Tooltip
} from 'recharts';
import {
    Briefcase, TrendingUp,
    Target, AlertTriangle, ShieldCheck, Landmark, Users, ChevronRight, ChevronDown
} from 'lucide-react';
import { GlassCard, MetricCard } from '../components/BaseUI';
import { API_BASE_URL as API } from '../config';

/* ── Shared loading / error states ─────────────────────────────────────────── */
const Loading = ({ msg }: { msg: string }) => (
    <div className="flex items-center justify-center py-24 text-emerald-500 font-bold tracking-widest text-sm animate-pulse uppercase">{msg}</div>
);
const Err = ({ msg }: { msg: string }) => (
    <div className="flex items-center justify-center py-24 text-rose-400 font-medium text-sm">{msg}</div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   PORTFOLIO PAGE
═══════════════════════════════════════════════════════════════════════════ */
import { PortfolioScatterChart } from '../components/Charts';

/* ═══════════════════════════════════════════════════════════════════════════
   PORTFOLIO PAGE
   Extends the default view with a risk heatmap and filterable exposure table.
═══════════════════════════════════════════════════════════════════════════ */
export const PortfolioPage: React.FC<{ onSelect?: (id: string) => void }> = ({ onSelect }) => {
    const [summary, setSummary] = useState<any>(null);
    const [allCompanies, setAllCompanies] = useState<any[]>([]);
    const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [sectorFilter, setSectorFilter] = useState('ALL');
    const [riskFilter, setRiskFilter] = useState('ALL');
    const [gstFilter, setGstFilter] = useState('ALL');

    useEffect(() => {
        setLoading(true);
        Promise.all([
            axios.get(`${API}/portfolio/summary`),
            axios.get(`${API}/portfolio/companies`)
        ]).then(([sumRes, compRes]) => {
            setSummary(sumRes.data);
            setAllCompanies(compRes.data);
            setFilteredCompanies(compRes.data);
        }).catch(() => setError('Failed to synchronize portfolio intelligence.'))
          .finally(() => setLoading(false));
    }, []);

    // Apply filters
    useEffect(() => {
        let filtered = [...allCompanies];
        if (sectorFilter !== 'ALL') filtered = filtered.filter(c => c.sector === sectorFilter);
        if (riskFilter !== 'ALL') filtered = filtered.filter(c => c.risk_class === riskFilter);
        if (gstFilter !== 'ALL') filtered = filtered.filter(c => c.gst_mismatch_flag === gstFilter);
        setFilteredCompanies(filtered);
    }, [sectorFilter, riskFilter, gstFilter, allCompanies]);

    const sectors = ['ALL', ...Array.from(new Set(allCompanies.map(c => c.sector)))];

    if (error) return <Err msg={error} />;
    if (loading || !summary) return <Loading msg="Synthesizing multi-source loan book..." />;

    return (
        <div className="space-y-10 fade-up">
            {/* Top Summaries */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
                <MetricCard label="Total Exposure" value={`₹${(summary.total_exposure / 1e7).toFixed(1)} Cr`} icon={<Landmark size={14} />} />
                <MetricCard label="Borrowers" value={summary.company_count} icon={<Users size={14} />} />
                <MetricCard label="Avg CIBIL" value={summary.avg_cibil_score} icon={<Target size={14} />} />
                <MetricCard 
                    label="Risk: High" 
                    value={summary.by_risk_class.high_risk} 
                    icon={<AlertTriangle size={14} className="text-earth" />} 
                    subValue="Requires Monitoring"
                />
                <MetricCard 
                    label="GST Mismatch" 
                    value={summary.high_gst_mismatch_count} 
                    icon={<AlertTriangle size={14} className="text-earth" />} 
                    subValue="High Priority"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Heatmap */}
                <div className="lg:col-span-2">
                    <GlassCard title="Risk vs. Exposure Heatmap" icon={<TrendingUp size={18} />}>
                        <div className="mb-4">
                            <p className="text-[10px] text-khaki/60 italic">
                                Visualizing account exposure against model-derived risk scores. Larger dots indicate higher sanctioned limits.
                            </p>
                        </div>
                        <PortfolioScatterChart data={allCompanies} onNodeClick={onSelect} />
                        <div className="mt-4 flex flex-wrap gap-4 text-[9px] font-bold uppercase tracking-widest text-khaki/40 border-t border-white/5 pt-4">
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#4ade80]" /> Low Risk (0-33)</div>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#fbbf24]" /> Medium Risk (34-66)</div>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#f87171]" /> High Risk (67-100)</div>
                        </div>
                    </GlassCard>
                </div>

                {/* Filter Panel */}
                <div>
                    <GlassCard title="Filtering & Segmenting" icon={<Briefcase size={18} />}>
                        <div className="space-y-6">
                            <div className="relative">
                                <label className="text-[10px] font-black uppercase text-khaki/60 block mb-2 tracking-widest">Industry Sector</label>
                                <div className="relative group">
                                    <select 
                                        value={sectorFilter} 
                                        onChange={(e) => setSectorFilter(e.target.value)}
                                        className="input-field cursor-pointer pr-10"
                                    >
                                        {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-khaki/40 pointer-events-none group-hover:text-khaki transition-colors" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-khaki/60 block mb-2 tracking-widest">Risk Classification</label>
                                <div className="flex flex-wrap gap-2">
                                    {['ALL', 'low_risk', 'medium_risk', 'high_risk'].map(r => (
                                        <button 
                                            key={r}
                                            onClick={() => setRiskFilter(r)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                                riskFilter === r ? 'bg-khaki text-noir' : 'bg-white/5 text-khaki/60 hover:bg-white/10'
                                            }`}
                                        >
                                            {r.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-khaki/60 block mb-2 tracking-widest">GST Mismatch Flag</label>
                                <div className="flex flex-wrap gap-2">
                                    {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map(g => (
                                        <button 
                                            key={g}
                                            onClick={() => setGstFilter(g)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                                gstFilter === g ? 'bg-khaki text-noir' : 'bg-white/5 text-khaki/60 hover:bg-white/10'
                                            }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Drill-down Table */}
            <GlassCard title="Segmented Borrower Details" icon={<Users size={18} />}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-[10px] uppercase font-black tracking-widest text-khaki/40">
                                <th className="py-3 px-4">Borrower Entity</th>
                                <th className="py-3 px-4">Risk Class</th>
                                <th className="py-3 px-4 text-right">Risk Score</th>
                                <th className="py-3 px-4 text-right">Exposure</th>
                                <th className="py-3 px-4 text-right">CIBIL</th>
                                <th className="py-3 px-4 text-center">GST Mismatch</th>
                                <th className="py-3 px-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {filteredCompanies.map((c) => (
                                <tr 
                                    key={c.company_id} 
                                    className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                                    onClick={() => onSelect && onSelect(c.company_id)}
                                >
                                    <td className="py-4 px-4">
                                        <div className="font-bold text-white text-sm">{c.name}</div>
                                        <div className="text-[10px] text-khaki/40 uppercase font-bold">{c.sector}</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                            c.risk_class === 'low_risk' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                                            c.risk_class === 'medium_risk' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                                            'bg-red-500/10 text-red-400 border border-red-500/30'
                                        }`}>
                                            {c.risk_class.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right font-mono font-bold text-white">{c.risk_score}</td>
                                    <td className="py-4 px-4 text-right font-mono text-khaki/80 italic text-xs">₹{(c.sanctioned_amount / 1e7).toFixed(2)} Cr</td>
                                    <td className="py-4 px-4 text-right font-mono text-white text-sm">{c.cibil_commercial_score}</td>
                                    <td className="py-4 px-4 text-center">
                                        {c.gst_mismatch_flag === 'HIGH' ? (
                                            <span className="flex items-center justify-center gap-1 text-[9px] font-black text-red-500 uppercase">
                                                <AlertTriangle size={10} /> HIGH
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-bold text-khaki/20 uppercase tracking-widest">{c.gst_mismatch_flag}</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <button className="p-2 rounded-lg bg-white/5 text-khaki opacity-0 group-hover:opacity-100 transition-all">
                                            <ChevronRight size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   ANALYTICS PAGE
═══════════════════════════════════════════════════════════════════════════ */
export const AnalyticsPage: React.FC = () => {
    const [trends, setTrends] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get(`${API}/analytics/trends`)
            .then(r => setTrends(r.data))
            .catch(() => setError('Failed to load analytics data. Is the backend running?'));
    }, []);

    if (error) return <Err msg={error} />;
    if (!trends) return <Loading msg="Fetching macro trends…" />;

    return (
        <div className="space-y-8 fade-up">
            {/* KPI strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <MetricCard
                    label="Avg. GST Growth (6m)"
                    value={`${(trends.avg_gst_growth * 100).toFixed(1)}%`}
                    subValue="Above industry avg"
                    trend="up"
                    icon={<TrendingUp size={18} />}
                />
                <MetricCard
                    label="Avg. EMI Bounces"
                    value={trends.avg_emi_bounces.toFixed(1)}
                    subValue="Last 6 months"
                    trend={trends.avg_emi_bounces > 1 ? 'down' : 'neutral'}
                    icon={<AlertTriangle size={18} />}
                />
                <MetricCard
                    label="Market Sentiment"
                    value={trends.market_sentiment}
                    subValue="Derived from NLP corpus"
                    trend="up"
                    icon={<ShieldCheck size={18} />}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard title="Portfolio GST Growth Trend" icon={<TrendingUp size={18} />}>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends.growth_trend}>
                                <defs>
                                    <linearGradient id="gGrowth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0a1815', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' }}
                                    formatter={(v: any) => [`${(v * 100).toFixed(1)}%`, 'GST Growth']}
                                />
                                <Area type="monotone" dataKey="growth" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gGrowth)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                <GlassCard title="Sector Performance (Risk Score)" icon={<AlertTriangle size={18} />}>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trends.risk_by_sector}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="sector" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0a1815', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' }}
                                    formatter={(v: any) => [v, 'Credit Health Score']}
                                />
                                <Bar dataKey="score" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

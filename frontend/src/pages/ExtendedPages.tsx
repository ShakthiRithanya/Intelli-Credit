
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts';
import {
    Briefcase, TrendingUp, PieChart as PieIcon,
    Target, AlertTriangle, ShieldCheck, Landmark, Users
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
export const PortfolioPage: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get(`${API}/portfolio/stats`)
            .then(r => setStats(r.data))
            .catch(() => setError('Failed to load portfolio stats. Is the backend running?'));
    }, []);

    if (error) return <Err msg={error} />;
    if (!stats) return <Loading msg="Aggregating loan book…" />;

    return (
        <div className="space-y-8 fade-up">
            {/* KPI strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <MetricCard
                    label="Total Accounts"
                    value={stats.total_accounts}
                    icon={<Users size={18} />}
                />
                <MetricCard
                    label="Estimated Book Value"
                    value={`₹${(stats.total_portfolio_revenue / 1e7).toFixed(1)} Cr`}
                    icon={<Landmark size={18} />}
                    trend="up"
                    subValue="Annualised GST basis"
                />
                <MetricCard
                    label="Portfolio Risk Grade"
                    value="B+"
                    subValue="Investment Grade"
                    trend="up"
                    icon={<ShieldCheck size={18} />}
                />
                <MetricCard
                    label="Sector HHI"
                    value="0.22"
                    subValue="Well Diversified"
                    trend="neutral"
                    icon={<PieIcon size={18} />}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard title="Risk Class Distribution" icon={<Target size={18} />}>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.risk_distribution}
                                    innerRadius={75}
                                    outerRadius={115}
                                    paddingAngle={6}
                                    dataKey="value"
                                >
                                    {stats.risk_distribution.map((entry: any, i: number) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0a1815', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' }}
                                />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                <GlassCard title="Sector Concentration" icon={<Briefcase size={18} />}>
                    {stats.sector_concentration.length === 0 ? (
                        <div className="text-text-dim text-sm italic py-12 text-center">
                            Sector data is populated once companies are mapped to sectors.
                        </div>
                    ) : (
                        <div className="h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.sector_concentration} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                                    <XAxis type="number" hide tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={100} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0a1815', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' }} />
                                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Risk distribution detail */}
            <GlassCard title="Risk Breakdown Detail" icon={<ShieldCheck size={18} />}>
                <div className="grid grid-cols-3 gap-6 py-2">
                    {stats.risk_distribution.map((r: any) => (
                        <div key={r.name} className="text-center space-y-2">
                            <div className="text-3xl font-extrabold" style={{ color: r.color }}>{r.value}</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-text-dim">{r.name}</div>
                            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div
                                    className="h-full rounded-full"
                                    style={{ width: `${(r.value / stats.total_accounts) * 100}%`, backgroundColor: r.color }}
                                />
                            </div>
                            <div className="text-xs text-text-dim">{((r.value / stats.total_accounts) * 100).toFixed(0)}% of portfolio</div>
                        </div>
                    ))}
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

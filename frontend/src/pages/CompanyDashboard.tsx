
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { FlaskConical, LayoutDashboard, FileText, Activity, TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface Props {
    companyId: string;
}

const CompanyDashboard: React.FC<Props> = ({ companyId }) => {
    const [data, setData] = useState<any>(null);
    const [cam, setCam] = useState<any>(null);
    const [simulating, setSimulating] = useState(false);
    const [overrides, setOverrides] = useState<any>({
        gst_growth_6m: 0,
        litigation_risk_score: 0,
        bank_emi_bounce_count: 0
    });
    const [simResults, setSimResults] = useState<any>(null);

    useEffect(() => {
        fetchData();
        fetchCam();
    }, [companyId]);

    const fetchData = async () => {
        const res = await axios.get(`${API_BASE_URL}/companies/${companyId}/summary`);
        setData(res.data);

        // Initialize overrides with current values
        const features = res.data.prediction.explanation.top_drivers_for_class;
        const baseOverrides: any = {};
        features.forEach((f: any) => {
            if (['gst_growth_6m', 'litigation_risk_score', 'bank_emi_bounce_count'].includes(f.feature)) {
                baseOverrides[f.feature] = f.value;
            }
        });
        setOverrides((prev: any) => ({ ...prev, ...baseOverrides }));
    };

    const fetchCam = async () => {
        const res = await axios.get(`${API_BASE_URL}/companies/${companyId}/cam`);
        setCam(res.data);
    };

    const handleSimulate = async () => {
        setSimulating(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/companies/${companyId}/simulate`, { overrides });
            setSimResults(res.data);
        } catch (err) {
            console.error(err);
        }
        setSimulating(false);
    };

    const resetSimulation = () => {
        setSimResults(null);
    };

    if (!data || !cam) return <div className="text-center py-20 animate-pulse text-emerald-500">Constructing Enterprise View...</div>;

    const currentPrediction = simResults ? simResults.simulation : data.prediction;
    const shapData = currentPrediction.explanation.top_drivers_for_class.map((d: any) => ({
        name: d.feature.replace(/_/g, ' '),
        impact: d.impact,
        value: d.value
    }));

    const riskColor =
        currentPrediction.risk_class === 'low_risk' ? '#10b981' :
            currentPrediction.risk_class === 'medium_risk' ? '#f59e0b' :
                '#ef4444';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-6 duration-700">

            {/* Left Column: Summary & Simulation */}
            <div className="lg:col-span-1 space-y-6">

                {/* Risk Card */}
                <div className="glass p-6 text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <LayoutDashboard className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-sm font-bold tracking-widest uppercase text-text-muted">Decision Summary</h2>
                    </div>

                    <div className="py-8 rounded-full border-4 border-white/5 inline-flex items-center justify-center w-48 h-48 relative">
                        <div className="absolute inset-0 rounded-full animate-pulse blur-xl opacity-20" style={{ backgroundColor: riskColor }}></div>
                        <div>
                            <p className="text-xs uppercase tracking-tighter text-text-secondary font-bold mb-1">Risk Class</p>
                            <h3 className="text-3xl font-black uppercase tracking-tight" style={{ color: riskColor }}>
                                {currentPrediction.risk_class.replace('_', ' ')}
                            </h3>
                            <p className="text-sm text-text-muted font-mono mt-1">Conf: {(currentPrediction.confidence * 100).toFixed(1)}%</p>
                        </div>
                    </div>

                    {simResults && (
                        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-medium text-emerald-400">
                            Simulation Active: {simResults.change_summary}
                        </div>
                    )}
                </div>

                {/* What-If Sandbox */}
                <div className="glass p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FlaskConical className="w-5 h-5 text-blue-400" />
                            <h2 className="text-sm font-bold tracking-widest uppercase text-text-muted">What-If Sandbox</h2>
                        </div>
                        {simResults && (
                            <button
                                onClick={resetSimulation}
                                className="text-[10px] uppercase font-bold text-rose-400 hover:text-rose-300 transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <label className="font-bold text-text-secondary">Expected GST Growth (6M)</label>
                                <span className="text-blue-400 font-mono">{(overrides.gst_growth_6m * 100).toFixed(0)}%</span>
                            </div>
                            <input
                                type="range" min="-0.5" max="0.5" step="0.05"
                                value={overrides.gst_growth_6m}
                                onChange={(e) => setOverrides({ ...overrides, gst_growth_6m: parseFloat(e.target.value) })}
                                className="w-full accent-emerald-500 h-1.5 rounded-full bg-white/5 appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <label className="font-bold text-text-secondary">Bank EMI Bounces (Count)</label>
                                <span className="text-blue-400 font-mono">{overrides.bank_emi_bounce_count}</span>
                            </div>
                            <input
                                type="range" min="0" max="10" step="1"
                                value={overrides.bank_emi_bounce_count}
                                onChange={(e) => setOverrides({ ...overrides, bank_emi_bounce_count: parseInt(e.target.value) })}
                                className="w-full accent-emerald-500 h-1.5 rounded-full bg-white/5 appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <label className="font-bold text-text-secondary">Litigation Severity (NLP Index)</label>
                                <span className="text-blue-400 font-mono">{overrides.litigation_risk_score}/3</span>
                            </div>
                            <div className="flex gap-2">
                                {[0, 1, 2, 3].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setOverrides({ ...overrides, litigation_risk_score: val })}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${overrides.litigation_risk_score === val ? 'bg-emerald-500 text-white' : 'bg-white/5 text-text-muted hover:bg-white/10'
                                            }`}
                                    >
                                        {val === 0 ? 'None' : val === 3 ? 'High' : val}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleSimulate}
                            disabled={simulating}
                            className="btn btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {simulating ? 'Processing Models...' : (
                                <> <Activity className="w-4 h-4" /> Run Simulation </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Middle & Right Column: Charts & CAM */}
            <div className="lg:col-span-2 space-y-6">

                {/* SHAP Chart */}
                <div className="glass p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-sm font-bold tracking-widest uppercase text-text-muted">Feature Importance (SHAP Analysis)</h2>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={shapData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={10} width={120} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{ backgroundColor: '#16221f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                                    labelStyle={{ color: '#f9fafb', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                                    {shapData.map((entry: any, index: number) => (
                                        <Cell key={index} fill={entry.impact > 0 ? '#ef4444' : '#10b981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* CAM Viewer */}
                <div className="glass p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-500" />
                            <h2 className="text-sm font-bold tracking-widest uppercase text-text-muted">Credit Appraisal Memo</h2>
                        </div>

                        <button className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded hover:bg-emerald-500 hover:text-white transition-colors">
                            Export PDF
                        </button>
                    </div>

                    <article className="prose prose-invert max-w-none text-text-secondary prose-headings:text-text-primary prose-strong:text-emerald-500">
                        <ReactMarkdown>{cam.cam_markdown}</ReactMarkdown>
                    </article>
                </div>
            </div>
        </div>
    );
};

export default CompanyDashboard;

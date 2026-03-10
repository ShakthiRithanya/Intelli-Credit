import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ClipboardList, ChevronDown, ChevronUp, CheckCircle2,
    XCircle, Clock, AlertTriangle, Send, RefreshCw
} from 'lucide-react';
import { RiskBadge } from '../components/BaseUI';

const API = 'http://localhost:8000';

/* ── Status badges ─────────────────────────────────────────────────────────── */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
        under_review: { label: 'Under Review', cls: 'text-amber-400 border-amber-500/40 bg-amber-500/8', icon: <Clock size={11} /> },
        approved: { label: 'Approved', cls: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/8', icon: <CheckCircle2 size={11} /> },
        rejected: { label: 'Rejected', cls: 'text-rose-400 border-rose-500/40 bg-rose-500/8', icon: <XCircle size={11} /> },
        accepted: { label: 'Borrower Accepted', cls: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/8', icon: <CheckCircle2 size={11} /> },
        review_requested: { label: 'Review Requested', cls: 'text-amber-400 border-amber-500/40 bg-amber-500/8', icon: <AlertTriangle size={11} /> },
        pending_review: { label: 'Pending Review', cls: 'text-amber-400 border-amber-500/40 bg-amber-500/8', icon: <Clock size={11} /> },
    };
    const s = map[status] ?? { label: status, cls: 'text-text-dim border-white/10 bg-white/5', icon: <Clock size={11} /> };
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${s.cls}`}>
            {s.icon} {s.label}
        </span>
    );
};

/* ── Officer decision panel ────────────────────────────────────────────────── */
const DecisionPanel: React.FC<{ app: any; onDecided: () => void }> = ({ app, onDecided }) => {
    const [decision, setDecision] = useState<'approve' | 'reject' | ''>('');
    const [notes, setNotes] = useState('');
    const [finalSanctioned, setFinalSanctioned] = useState(app.ai_sanctioned_amount?.toString() || '');
    const [finalRate, setFinalRate] = useState(app.ai_interest_rate?.toString() || '');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const submit = async () => {
        if (!decision) return;
        setLoading(true);
        try {
            await axios.post(`${API}/officer/applications/${app.application_id}/decide`, {
                decision,
                notes,
                final_sanctioned: parseFloat(finalSanctioned) || null,
                final_rate: parseFloat(finalRate) || null,
            });
            setMsg(`Decision "${decision}" recorded.`);
            onDecided();
        } catch {
            setMsg('Error saving decision.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border-t border-white/5 bg-white/[0.015] p-6 space-y-5">
            {/* AI Recommendation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><div className="text-[9px] uppercase tracking-widest text-text-dim mb-1">AI Risk</div>
                    <RiskBadge risk={app.ai_risk_class || 'medium_risk'} /></div>
                <div><div className="text-[9px] uppercase tracking-widest text-text-dim mb-1">AI Confidence</div>
                    <div className="font-bold">{((app.ai_confidence || 0) * 100).toFixed(1)}%</div></div>
                <div><div className="text-[9px] uppercase tracking-widest text-text-dim mb-1">AI Sanction</div>
                    <div className="font-bold">₹{((app.ai_sanctioned_amount || 0) / 1e6).toFixed(2)}M</div></div>
                <div><div className="text-[9px] uppercase tracking-widest text-text-dim mb-1">AI Rate</div>
                    <div className="font-bold">{app.ai_interest_rate || '—'}%</div></div>
            </div>

            {app.ai_summary && (
                <div className="text-sm text-text-dim italic bg-white/5 rounded-xl p-4 border border-white/5">
                    "{app.ai_summary}"
                </div>
            )}

            {/* Already decided */}
            {app.officer_decision ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 font-medium">
                    ✓ Decision already recorded: <strong className="uppercase">{app.officer_decision}</strong>
                    {app.officer_notes && <div className="text-text-dim mt-1 text-xs">{app.officer_notes}</div>}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Final Sanctioned Amount (₹)</label>
                            <input className="input-field" value={finalSanctioned}
                                onChange={e => setFinalSanctioned(e.target.value)} placeholder="e.g. 40000000" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Final Interest Rate (%)</label>
                            <input className="input-field" value={finalRate}
                                onChange={e => setFinalRate(e.target.value)} placeholder="e.g. 12.5" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Officer Notes (shown to borrower)</label>
                        <textarea className="input-field min-h-[80px]" value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Add remarks visible to the borrower..." />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => { setDecision('approve'); }}
                            className={`flex-1 h-11 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all ${decision === 'approve' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-emerald-500/8 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'}`}
                        >
                            <CheckCircle2 size={14} className="inline mr-2" /> Approve
                        </button>
                        <button
                            onClick={() => { setDecision('reject'); }}
                            className={`flex-1 h-11 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all ${decision === 'reject' ? 'bg-rose-500 text-white border-rose-500' : 'bg-rose-500/8 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'}`}
                        >
                            <XCircle size={14} className="inline mr-2" /> Reject
                        </button>
                        <button
                            onClick={submit}
                            disabled={!decision || loading}
                            className="flex-1 h-11 btn-premium text-xs"
                        >
                            {loading ? 'Saving...' : <><Send size={13} className="mr-1" /> Confirm Decision</>}
                        </button>
                    </div>
                    {msg && <div className="text-xs text-emerald-400 font-medium">{msg}</div>}
                </div>
            )}
        </div>
    );
};

/* ── Main Applications Page ────────────────────────────────────────────────── */
export const OfficerApplicationsPage: React.FC = () => {
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [filter, setFilter] = useState('');

    const fetchApps = () => {
        setLoading(true);
        axios.get(`${API}/officer/applications`)
            .then(r => setApps(r.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchApps(); }, []);

    const filtered = filter
        ? apps.filter(a => a.status === filter)
        : apps;

    return (
        <div className="space-y-6 fade-up">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <ClipboardList size={24} className="text-emerald-500" />
                    <div>
                        <h3 className="text-xl font-extrabold tracking-tight">Borrower Applications</h3>
                        <p className="text-xs text-text-dim">{apps.length} application{apps.length !== 1 ? 's' : ''} in the system</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select className="input-field w-44 text-xs" value={filter} onChange={e => setFilter(e.target.value)}>
                        <option value="">All Statuses</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="review_requested">Review Requested</option>
                        <option value="accepted">Borrower Accepted</option>
                    </select>
                    <button onClick={fetchApps} className="flex items-center gap-1.5 text-xs font-bold text-text-dim hover:text-white border border-white/10 px-3 py-2 rounded-xl transition-all">
                        <RefreshCw size={12} /> Refresh
                    </button>
                </div>
            </div>

            {loading && <div className="text-emerald-500 animate-pulse text-sm font-bold text-center py-12">Loading applications...</div>}

            {!loading && filtered.length === 0 && (
                <div className="glass-panel text-center py-16 text-text-dim">
                    <ClipboardList size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold">No applications yet.</p>
                    <p className="text-xs mt-1">Applications submitted via the Borrower Portal will appear here.</p>
                </div>
            )}

            <div className="space-y-3">
                {filtered.map(app => (
                    <div key={app.application_id} className="glass-card overflow-hidden">
                        <button
                            className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.015] transition-colors"
                            onClick={() => setExpanded(expanded === app.application_id ? null : app.application_id)}
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="min-w-0">
                                    <div className="font-bold text-sm truncate">{app.company_name}</div>
                                    <div className="text-[10px] text-text-dim font-mono">{app.application_id} · {app.sector}</div>
                                </div>
                                <div className="hidden md:flex items-center gap-3 shrink-0">
                                    <StatusBadge status={app.status} />
                                    {app.ai_risk_class && app.ai_risk_class !== 'pending' && (
                                        <RiskBadge risk={app.ai_risk_class} />
                                    )}
                                </div>
                                <div className="hidden lg:block text-xs text-text-dim ml-auto text-right shrink-0">
                                    ₹{((app.requested_amount || 0) / 1e6).toFixed(1)}M requested<br />
                                    <span className="text-[10px]">{app.created_at?.substring(0, 10)}</span>
                                </div>
                            </div>
                            {expanded === app.application_id ? <ChevronUp size={16} className="text-text-dim shrink-0" /> : <ChevronDown size={16} className="text-text-dim shrink-0" />}
                        </button>

                        {expanded === app.application_id && (
                            <DecisionPanel app={app} onDecided={fetchApps} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

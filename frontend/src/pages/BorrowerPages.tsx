
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FileText, Send, CheckCircle, Clock, AlertCircle,
    ArrowRight, Landmark, Percent, Info, Briefcase
} from 'lucide-react';
import { GlassCard } from '../components/BaseUI';

/* --- LoanApplyPage --- */
export const LoanApplyPage: React.FC<{ onStatusNav?: (id: string) => void }> = ({ onStatusNav }) => {
    const [formData, setFormData] = useState({
        company_name: '',
        sector: '',
        gstin: '',
        requested_amount: '',
        loan_purpose: '',
        contact_email: ''
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        Object.entries(formData).forEach(([k, v]) => data.append(k, v));

        try {
            const res = await axios.post('http://localhost:8000/borrower/applications', data);
            setResult(res.data);
        } catch (err) {
            alert("Application Error. Please check fields.");
        } finally {
            setLoading(false);
        }
    };

    if (result) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center space-y-8 fade-up">
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={40} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-4xl font-bold">Application Submitted</h2>
                    <p className="text-text-dim">Your reference ID is <span className="text-emerald-500 font-mono">{result.application_id}</span></p>
                </div>
                <div className="glass-panel p-6 border-emerald-500/20 text-sm text-text-dim italic">
                    <Clock size={16} className="inline mr-2 mb-1" />
                    {result.estimated_decision_time}
                </div>
                <button
                    onClick={() => onStatusNav ? onStatusNav(result.application_id) : undefined}
                    className="btn-premium px-12"
                >
                    CHECK STATUS <ArrowRight size={16} className="ml-2" />
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-12 fade-up">
            <div className="text-center space-y-4">
                <h1 className="text-5xl font-extrabold tracking-tighter">Grow Your <span className="gradient-text">Enterprise</span></h1>
                <p className="text-text-dim text-lg">Apply for a smart-credit line powered by Intelli-Credit AI.</p>
            </div>

            <GlassCard title="Business Details" icon={<FileText size={18} />}>
                <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Company Name</label>
                        <input required className="input-field" placeholder="e.g. Legacy Textiles" onChange={e => setFormData({ ...formData, company_name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Sector</label>
                        <select className="input-field" onChange={e => setFormData({ ...formData, sector: e.target.value })}>
                            <option value="">Select Sector</option>
                            <option value="IT">IT & Tech</option>
                            <option value="Textiles">Textiles</option>
                            <option value="Retail">Retail</option>
                            <option value="Manufacturing">Manufacturing</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim">GSTIN</label>
                        <input required className="input-field" placeholder="27AAAAA0000A1Z5" onChange={e => setFormData({ ...formData, gstin: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Requested Amount (₹)</label>
                        <input required type="number" className="input-field" placeholder="e.g. 50000000" onChange={e => setFormData({ ...formData, requested_amount: e.target.value })} />
                    </div>
                    <div className="col-span-full space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Loan Purpose</label>
                        <textarea className="input-field min-h-[100px]" placeholder="Explain how you will use the capital..." onChange={e => setFormData({ ...formData, loan_purpose: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Contact Email</label>
                        <input required type="email" className="input-field" placeholder="cfo@company.in" onChange={e => setFormData({ ...formData, contact_email: e.target.value })} />
                    </div>

                    <div className="col-span-full pt-8">
                        <button type="submit" disabled={loading} className="btn-premium w-full h-14 text-lg">
                            {loading ? "PROCESSING..." : <><Send size={20} className="mr-2" /> SUBMIT APPLICATION</>}
                        </button>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
};

/* --- ApplicationStatusPage --- */
export const ApplicationStatusPage: React.FC<{ id: string }> = ({ id }) => {
    const [data, setData] = useState<any>(null);
    const [actionMsg, setActionMsg] = useState('');

    useEffect(() => {
        axios.get(`http://localhost:8000/borrower/applications/${id}`).then(res => setData(res.data));
    }, [id]);

    const handleAction = async (action: string) => {
        const res = await axios.post(`http://localhost:8000/borrower/applications/${id}/${action}`);
        setActionMsg(res.data.message);
    };

    if (!data) return <div className="text-emerald-500 animate-pulse font-bold p-20 text-center">QUERYING BLOCKCHAIN LEDGER...</div>;

    const isApproved = data.status === 'approved';

    return (
        <div className="max-w-4xl mx-auto space-y-8 fade-up">
            <div className="flex justify-between items-center border-b border-white/5 pb-8">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight">{data.company_name}</h2>
                    <p className="text-text-dim">Application <span className="text-emerald-500 font-mono">#{id}</span></p>
                </div>
                <div className={`px-4 py-2 rounded-full font-bold uppercase tracking-widest text-xs border ${isApproved ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-rose-500/10 border-rose-500 text-rose-500'
                    }`}>
                    {data.status}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel text-center p-6 space-y-2 border-white/10">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim">Sanctioned Amount</div>
                    <div className="text-2xl font-bold flex items-center justify-center gap-2">
                        <Landmark size={20} className="text-emerald-500" />
                        ₹{(data.sanctioned_amount / 1000000).toFixed(1)}M
                    </div>
                </div>
                <div className="glass-panel text-center p-6 space-y-2 border-white/10">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim">Interest Rate</div>
                    <div className="text-2xl font-bold flex items-center justify-center gap-2">
                        <Percent size={20} className="text-gold-500" />
                        {data.indicative_interest_rate}% <span className="text-[10px] text-text-dim">p.a.</span>
                    </div>
                </div>
                <div className="glass-panel text-center p-6 space-y-2 border-white/10">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim">Risk Rating</div>
                    <div className="text-2xl font-bold flex items-center justify-center gap-2 uppercase">
                        <Info size={20} className="text-emerald-500" />
                        {data.risk_class.replace('_', ' ')}
                    </div>
                </div>
            </div>

            <GlassCard title="Intelli-Credit Assessment" icon={<Briefcase size={18} />}>
                <div className="p-8 space-y-6">
                    <div className="flex gap-4 items-start bg-white/5 p-6 rounded-2xl border border-white/5">
                        <AlertCircle size={24} className="text-emerald-500 shrink-0 mt-1" />
                        <p className="text-lg text-text-dim italic leading-relaxed">
                            "{data.summary_for_borrower}"
                        </p>
                    </div>

                    {isApproved && !actionMsg && (
                        <div className="flex flex-col md:flex-row gap-4 pt-6">
                            <button
                                onClick={() => handleAction('accept')}
                                className="btn-premium h-14 text-lg flex-1"
                            >
                                ACCEPT LOAN OFFER
                            </button>
                            <button
                                onClick={() => handleAction('review-requested')}
                                className="bg-white/5 hover:bg-white/10 text-white font-bold h-14 px-8 rounded-2xl border border-white/10 transition-all flex-1"
                            >
                                REQUEST MANUAL REVIEW
                            </button>
                        </div>
                    )}

                    {actionMsg && (
                        <div className="bg-emerald-500/20 p-4 rounded-xl text-emerald-500 text-center font-bold">
                            {actionMsg}
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
    );
};

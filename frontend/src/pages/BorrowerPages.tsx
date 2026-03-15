
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FileText, Send, CheckCircle, Clock, AlertCircle,
    ArrowRight, Landmark, Percent, Info, Briefcase,
    Upload, FolderOpen, Gavel
} from 'lucide-react';
import { GlassCard } from '../components/BaseUI';
import { API_BASE_URL } from '../config';

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
    const [registry, setRegistry] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const [annualReport, setAnnualReport] = useState<File | null>(null);
    const [bankStatements, setBankStatements] = useState<FileList | null>(null);
    const [legalDocs, setLegalDocs] = useState<FileList | null>(null);

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/registry`).then(res => setRegistry(res.data));
    }, []);

    const filteredRegistry = registry.filter(item => 
        item.gstin.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20);

    const handleSelectCompany = (item: any) => {
        setFormData({
            ...formData,
            gstin: item.gstin,
            company_name: item.name,
            sector: item.sector
        });
        setSearchTerm(item.gstin);
        setShowDropdown(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.gstin) {
            alert("Please select a valid GSTIN from the registry.");
            return;
        }
        setLoading(true);
        const data = new FormData();
        
        // Append text fields
        Object.entries(formData).forEach(([k, v]) => data.append(k, v));
        
        // Append files
        if (annualReport) data.append('annual_report', annualReport);
        if (bankStatements) {
            Array.from(bankStatements).forEach(f => data.append('bank_statements', f));
        }
        if (legalDocs) {
            Array.from(legalDocs).forEach(f => data.append('legal_docs', f));
        }

        try {
            const res = await axios.post(`${API_BASE_URL}/borrower/applications`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
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
                <div className="glass-panel p-6 border-emerald-500/10 space-y-3">
                    <div className="text-sm text-text-dim italic">
                        <Clock size={16} className="inline mr-2 mb-1" />
                        {result.estimated_decision_time}
                    </div>
                    <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest">
                        Note: Uploaded documents are now visible to the Credit Officer for analysis.
                    </p>
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

            <GlassCard title="Application Form" icon={<FileText size={18} />}>
                <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* GSTIN Dropdown - FIRST QUESTION */}
                    <div className="col-span-full space-y-2 relative">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Search GSTIN (Primary Look-up)</label>
                        <div className="relative z-20">
                            <input 
                                required 
                                className="input-field pr-10 focus:border-khaki/50" 
                                placeholder="Start typing GSTIN (e.g. 27XAK...)" 
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                    setShowDropdown(true);
                                    if (!e.target.value) setFormData({...formData, gstin: '', company_name: '', sector: ''});
                                }}
                                onFocus={() => setShowDropdown(true)}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-khaki animate-pulse">
                                <Info size={16} />
                            </div>
                        </div>

                        {showDropdown && filteredRegistry.length > 0 && (
                            <div className="absolute z-[100] left-0 right-0 mt-2 bg-[#0a0f0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-h-80 overflow-y-auto ring-1 ring-emerald-500/20">
                                {filteredRegistry.map(item => (
                                    <div 
                                        key={item.company_id}
                                        onClick={() => handleSelectCompany(item)}
                                        className="p-4 hover:bg-khaki/10 cursor-pointer border-b border-white/5 transition-all group flex flex-col gap-1"
                                    >
                                        <div className="text-sm font-black text-white group-hover:text-khaki font-mono tracking-wider">{item.gstin}</div>
                                        <div className="text-[10px] text-text-dim uppercase tracking-widest flex items-center gap-2">
                                            <span className="text-khaki/60 font-bold">{item.name}</span>
                                            <span className="text-white/10">•</span>
                                            <span>{item.sector}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {showDropdown && searchTerm && filteredRegistry.length === 0 && (
                            <div className="absolute z-[100] left-0 right-0 mt-2 bg-[#1a0a0a] border border-rose-500/20 p-5 rounded-2xl text-xs text-rose-400 shadow-2xl">
                                <div className="flex items-center gap-3">
                                    <AlertCircle size={14} />
                                    No matching GSTIN found in digital registry.
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Company Name (Auto-filled)</label>
                        <input readOnly className="input-field border-white/5 bg-white/[0.02] text-white/50 cursor-not-allowed font-medium" value={formData.company_name} placeholder="Select GSTIN above" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Type of Business (Auto-filled)</label>
                        <input readOnly className="input-field border-white/5 bg-white/[0.02] text-white/50 cursor-not-allowed font-medium" value={formData.sector} placeholder="Select GSTIN above" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Contact Email</label>
                        <input required type="email" className="input-field" placeholder="cfo@company.in" onChange={e => setFormData({ ...formData, contact_email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Requested Amount (₹)</label>
                        <input required type="number" className="input-field" placeholder="e.g. 5000000" onChange={e => setFormData({ ...formData, requested_amount: e.target.value })} />
                    </div>

                    <div className="col-span-full space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Loan Purpose</label>
                        <textarea className="input-field min-h-[100px]" placeholder="Explain how you will use the capital..." onChange={e => setFormData({ ...formData, loan_purpose: e.target.value })} />
                    </div>

                    <div className="col-span-full border-t border-white/5 pt-8 mt-4">
                        <div className="text-xs font-black uppercase tracking-[0.2em] text-khaki mb-6 flex items-center gap-2">
                            <Upload size={14} /> Document Uploads (KYC & Financials)
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FileInput 
                                label="Annual Report (FY24)" 
                                icon={<FileText size={18} />} 
                                onChange={e => setAnnualReport(e.target.files?.[0] || null)}
                                fileName={annualReport?.name}
                            />
                            <FileInput 
                                label="Bank Statements" 
                                icon={<FolderOpen size={18} />} 
                                onChange={e => setBankStatements(e.target.files)}
                                multiple
                                fileName={bankStatements ? `${bankStatements.length} files selected` : undefined}
                            />
                            <FileInput 
                                label="Legal / Sanctions" 
                                icon={<Gavel size={18} />} 
                                onChange={e => setLegalDocs(e.target.files)}
                                multiple
                                fileName={legalDocs ? `${legalDocs.length} files selected` : undefined}
                            />
                        </div>
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
        axios.get(`${API_BASE_URL}/borrower/applications/${id}`).then(res => setData(res.data));
    }, [id]);

    const handleAction = async (action: string) => {
        const res = await axios.post(`${API_BASE_URL}/borrower/applications/${id}/${action}`);
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

/* --- FileInput Component --- */
const FileInput: React.FC<{
    label: string,
    icon: React.ReactNode,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    multiple?: boolean,
    fileName?: string
}> = ({ label, icon, onChange, multiple, fileName }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim block mb-2">{label}</label>
        <div className="relative group">
            <input
                type="file"
                multiple={multiple}
                onChange={onChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={`h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] group-hover:bg-white/[0.07] transition-all flex items-center px-4 gap-3 ${fileName ? 'border-khaki/30 bg-khaki/5' : ''}`}>
                <div className={`${fileName ? 'text-khaki' : 'text-khaki/40'}`}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    {fileName ? (
                        <div className="text-[10px] font-bold text-white truncate">{fileName}</div>
                    ) : (
                        <div className="text-[10px] font-bold text-khaki/40 uppercase tracking-widest">Upload File</div>
                    )}
                </div>
                <Upload size={14} className="text-khaki/40 group-hover:text-khaki" />
            </div>
        </div>
    </div>
);

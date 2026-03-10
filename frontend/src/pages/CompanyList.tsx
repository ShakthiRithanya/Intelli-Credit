
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Building2, ChevronRight, Search, TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface Company {
    company_id: string;
    name: string;
    sector: string;
    base_risk: string;
}

interface CompanyListProps {
    onSelectCompany: (id: string) => void;
}

const CompanyList: React.FC<CompanyListProps> = ({ onSelectCompany }) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/companies`)
            .then(res => {
                setCompanies(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-center py-20 animate-pulse text-emerald-500">Loading Enterprise Data...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Portfolio Overview</h1>
                    <p className="text-text-secondary">Monitor and evaluate credit risk across 6 strategic corporate accounts.</p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted transition-colors group-hover:text-emerald-500" />
                    <input
                        type="text"
                        placeholder="Search by company or sector..."
                        className="glass bg-white/5 border-white/10 rounded-full py-2 pl-10 pr-4 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    />
                </div>
            </div>

            <div className="grid gap-4">
                {companies.map((company) => (
                    <div
                        key={company.company_id}
                        onClick={() => onSelectCompany(company.company_id)}
                        className="glass card group p-5 flex items-center justify-between cursor-pointer hover:bg-emerald-500/5 transition-all"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold group-hover:text-emerald-500 transition-colors">{company.name}</h3>
                                <p className="text-sm text-text-muted">{company.sector}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-12">
                            <div className="hidden md:block">
                                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Status</p>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${company.base_risk === 'low_risk' ? 'bg-emerald-500/10 text-emerald-500' :
                                    company.base_risk === 'medium_risk' ? 'bg-amber-500/10 text-amber-500' :
                                        'bg-rose-500/10 text-rose-500'
                                    }`}>
                                    {company.base_risk.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>

                            <div className="hidden md:block">
                                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Last Update</p>
                                <p className="text-xs font-medium">9 Mar 2026</p>
                            </div>

                            <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CompanyList;

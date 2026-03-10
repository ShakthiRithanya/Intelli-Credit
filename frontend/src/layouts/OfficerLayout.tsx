
import React from 'react';
import { Cpu } from 'lucide-react';

interface OfficerLayoutProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}

const OfficerLayout: React.FC<OfficerLayoutProps> = ({ title, subtitle, children }) => (
    <div className="space-y-10">
        {/* Role Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-8 py-6">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 shrink-0 mt-0.5">
                    <Cpu size={20} strokeWidth={2.5} />
                </div>
                <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-500 mb-1">
                        Credit Officer Cockpit
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-white leading-tight">{title}</h2>
                    <p className="text-text-dim text-sm mt-1">{subtitle}</p>
                </div>
            </div>
        </div>

        {children}
    </div>
);

export default OfficerLayout;

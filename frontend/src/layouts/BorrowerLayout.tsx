
import React from 'react';
import { Users } from 'lucide-react';

interface BorrowerLayoutProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}

const BorrowerLayout: React.FC<BorrowerLayoutProps> = ({ title, subtitle, children }) => (
    <div className="space-y-10">
        {/* Role Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-gold-500/20 bg-gold-500/5 px-8 py-6">
            {/* Subtle glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-gold-500/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-gold-500/15 border border-gold-500/20 text-gold-500 shrink-0 mt-0.5">
                    <Users size={20} strokeWidth={2.5} />
                </div>
                <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-gold-500 mb-1">
                        Borrower Portal
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-white leading-tight">{title}</h2>
                    <p className="text-text-dim text-sm mt-1">{subtitle}</p>
                </div>
            </div>
        </div>

        {children}
    </div>
);

export default BorrowerLayout;

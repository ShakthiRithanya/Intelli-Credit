
import React from 'react';
import { TrendingUp, TrendingDown, Minus, ShieldCheck, AlertTriangle, XOctagon } from 'lucide-react';

/* ─── GlassCard ──────────────────────────────────────────────── */
interface GlassCardProps {
    title?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ title, icon, children, className = '' }) => (
    <div className={`glass-card ${className}`}>
        {title && (
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-white/[0.015]">
                {icon && <span className="text-khaki">{icon}</span>}
                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-khaki/80">{title}</h3>
            </div>
        )}
        <div className="p-6">{children}</div>
    </div>
);

/* ─── MetricCard ─────────────────────────────────────────────── */
interface MetricCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, subValue, trend, icon }) => {
    const trendColor = trend === 'up' ? 'text-wasabi' : trend === 'down' ? 'text-earth' : 'text-slate-500';
    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

    return (
        <div className="rounded-xl bg-khaki/[0.03] border border-khaki/10 p-4 flex items-center justify-between gap-4 hover:border-khaki/40 hover:bg-khaki/[0.06] transition-all">
            <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-khaki/60">{label}</div>
                <div className="text-xl font-bold text-white tracking-tight">{value}</div>
                {subValue && <div className={`text-[11px] font-medium ${trendColor}`}>{subValue}</div>}
            </div>
            <div className={`shrink-0 ${trendColor}`}>
                {icon ? icon : <TrendIcon size={20} />}
            </div>
        </div>
    );
};

/* ─── RiskBadge ──────────────────────────────────────────────── */
interface RiskBadgeProps {
    risk: string;
    className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk = '', className = '' }) => {
    const normalized = risk?.toLowerCase() || '';
    const isLow = normalized.includes('low');
    const isHigh = normalized.includes('high');

    const badgeClass = isLow ? 'badge-low' : isHigh ? 'badge-high' : 'badge-med';
    const Icon = isLow ? ShieldCheck : isHigh ? XOctagon : AlertTriangle;
    const label = isLow ? 'Low Risk' : isHigh ? 'High Risk' : 'Medium Risk';

    return (
        <span className={`badge ${badgeClass} ${className}`}>
            <Icon size={11} />
            {label}
        </span>
    );
};


import React from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
    ScatterChart, Scatter, ZAxis, Legend
} from 'recharts';

/* --- PortfolioScatterChart --- */
interface ScatterProps {
    data: any[];
    onNodeClick?: (id: string) => void;
}

export const PortfolioScatterChart: React.FC<ScatterProps> = ({ data, onNodeClick }) => {
    // Separate data by risk class for different colors
    const lowRisk = data.filter(d => d.risk_class === 'low_risk');
    const medRisk = data.filter(d => d.risk_class === 'medium_risk');
    const highRisk = data.filter(d => d.risk_class === 'high_risk');

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-[#111a19] border border-white/10 p-3 rounded-lg shadow-xl">
                    <p className="text-sm font-bold text-white mb-1">{d.name}</p>
                    <p className="text-[10px] text-khaki/60 uppercase">{d.sector}</p>
                    <div className="mt-2 space-y-1">
                        <p className="text-[11px] text-white">Risk Score: <span className="font-mono">{d.risk_score}</span></p>
                        <p className="text-[11px] text-white">Exposure: <span className="font-mono">₹{(d.sanctioned_amount / 1e7).toFixed(1)} Cr</span></p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis 
                        type="number" 
                        dataKey="risk_score" 
                        name="Risk Score" 
                        stroke="#777" 
                        fontSize={10} 
                        domain={[0, 100]}
                        label={{ value: 'Risk Score (0-100)', position: 'bottom', fill: '#777', fontSize: 10 }}
                    />
                    <YAxis 
                        type="number" 
                        dataKey="sanctioned_amount" 
                        name="Sanctioned Amount" 
                        stroke="#777" 
                        fontSize={10}
                        tickFormatter={(val) => `₹${(val / 1e7).toFixed(1)}Cr`}
                        label={{ value: 'Exposure (₹ Cr)', angle: -90, position: 'left', fill: '#777', fontSize: 10 }}
                    />
                    <ZAxis type="number" range={[100, 400]} />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    
                    <Scatter 
                        name="Low Risk" 
                        data={lowRisk} 
                        fill="#4ade80" 
                        onClick={(d: any) => onNodeClick && onNodeClick(d.company_id)}
                        style={{ cursor: 'pointer' }}
                    />
                    <Scatter 
                        name="Medium Risk" 
                        data={medRisk} 
                        fill="#fbbf24" 
                        onClick={(d: any) => onNodeClick && onNodeClick(d.company_id)}
                        style={{ cursor: 'pointer' }}
                    />
                    <Scatter 
                        name="High Risk" 
                        data={highRisk} 
                        fill="#f87171" 
                        onClick={(d: any) => onNodeClick && onNodeClick(d.company_id)}
                        style={{ cursor: 'pointer' }}
                    />
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};

/* --- FiveCRadarChart --- */
interface FiveCProps {
    scores: {
        character: number;
        capacity: number;
        capital: number;
        collateral: number;
        conditions: number;
    };
}

export const FiveCRadarChart: React.FC<FiveCProps> = ({ scores }) => {
    const data = [
        { subject: 'Character', A: scores.character, fullMark: 1 },
        { subject: 'Capacity', A: scores.capacity, fullMark: 1 },
        { subject: 'Capital', A: scores.capital, fullMark: 1 },
        { subject: 'Collateral', A: scores.collateral, fullMark: 1 },
        { subject: 'Conditions', A: scores.conditions, fullMark: 1 },
    ];

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#555" />
                    <PolarAngleAxis dataKey="subject" stroke="#CCC" tick={{ fill: '#CCC', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} stroke="#777" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#111a19',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            fontSize: '11px'
                        }}
                    />
                    <Radar
                        name="Score"
                        dataKey="A"
                        stroke="#FFFFFF"
                        fill="#FFFFFF"
                        fillOpacity={0.25}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

/* --- ShapBarChart --- */
interface ShapProps {
    data: Array<{
        feature: string;
        impact: number;
        value: number | string;
    }>;
    onFeatureClick?: (feature: string) => void;
}

export const ShapBarChart: React.FC<ShapProps> = ({ data, onFeatureClick }) => {
    const chartData = data.map(d => ({
        name: d.feature.replace(/_/g, ' '),
        rawFeature: d.feature,
        impact: d.impact,
        actualValue: d.value
    }));

    return (
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#555" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#CCC"
                        fontSize={10}
                        width={120}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: '#ffffff05' }}
                        contentStyle={{
                            backgroundColor: '#111a19',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                        labelStyle={{ fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}
                    />
                    <Bar 
                        dataKey="impact" 
                        fill="#FFFFFF" 
                        onClick={(entry: any) => onFeatureClick && onFeatureClick(entry.rawFeature)}
                        style={{ cursor: 'pointer' }}
                    >
                        {chartData.map((_entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill="#FFFFFF"
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};


import React from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';

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
}

export const ShapBarChart: React.FC<ShapProps> = ({ data }) => {
    const chartData = data.map(d => ({
        name: d.feature.replace(/_/g, ' '),
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
                    <Bar dataKey="impact" fill="#FFFFFF">
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

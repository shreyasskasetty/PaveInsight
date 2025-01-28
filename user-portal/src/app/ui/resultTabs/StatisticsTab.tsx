import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, Label, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface StatisticsTabProps {
    data: {
        average: number;
        distribution: {
            labels: string[];
            counts: number[];
            percentages: number[];
        };
    };
}

const StatisticsTab: React.FC<StatisticsTabProps> = ({ data }) => {
    const COLORS = ['red', 'orange', 'yellow', 'lightgreen', 'darkgreen'];
    const [isAnimationActive, setIsAnimationActive] = useState(false);
    const [rotationAngle, setRotationAngle] = useState(-90);
    const [displayedValue, setDisplayedValue] = useState(0);
    const [animatedPieData, setAnimatedPieData] = useState(
        data.distribution.labels.map(label => ({
            name: label,
            value: 0,
            percentage: 0,
            range: parseInt(label.split('-')[0])
        }))
    );
    
    const pieData = data.distribution.labels.map((label, index) => ({
        name: label,
        value: data.distribution.counts[index],
        percentage: data.distribution.percentages[index],
        range: parseInt(label.split('-')[0])
    }))
    .sort((a, b) => a.range - b.range);

    useEffect(() => {

        // Gauge animation
        const targetAngle = (data.average / 100) * 180 - 90;
        const duration = 2000;
        const startTime = Date.now();
        const startAngle = -90;
        const startValue = 0;

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            const currentAngle = startAngle + (targetAngle - startAngle) * easeProgress;
            const currentValue = startValue + (data.average - startValue) * easeProgress;
            
            // Animate pie data
            const currentPieData = pieData.map((item, index) => ({
                ...item,
                value: item.value * easeProgress,
                percentage: item.percentage * easeProgress
            }));
            
            setRotationAngle(currentAngle);
            setDisplayedValue(currentValue);
            setAnimatedPieData(currentPieData);
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        setIsAnimationActive(true);
        animate();
    }, [data]);


    const generateGaugeMarkers = () => {
        const markers = [];
        for (let i = 0; i <= 10; i++) {
            const value = i * 10;
            const angle = 180 + (value / 100) * 180;
            const radians = (angle * Math.PI) / 180;
            
            const innerRadius = 120;
            const outerRadius = 140;
            const labelRadius = 160;
            
            const x1 = 200 + innerRadius * Math.cos(radians);
            const y1 = 200 + innerRadius * Math.sin(radians);
            const x2 = 200 + outerRadius * Math.cos(radians);
            const y2 = 200 + outerRadius * Math.sin(radians);
            const labelX = 200 + labelRadius * Math.cos(radians);
            const labelY = 200 + labelRadius * Math.sin(radians);

            markers.push(
                <g key={i}>
                    <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#4b5563"
                        strokeWidth={2}
                        strokeLinecap="round"
                    />
                    <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#9ca3af"
                        className="text-sm font-medium"
                    >
                        {value}
                    </text>
                </g>
            );
        }
        return markers;
    };

    const GaugeNeedle = () => (
        <g transform={`rotate(${rotationAngle}, 200, 200)`}>
            <path
                d="M 198 200 L 200 70 L 202 200 Z"
                fill="#3b82f6"
            />
            <circle cx="200" cy="200" r="10" fill="#3b82f6" />
            <circle cx="200" cy="200" r="4" fill="#1e293b" />
        </g>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            <Card className="w-full h-[600px] bg-slate-900 border-slate-800">
                <CardContent className="h-full p-8">
                    <div className="flex items-center mb-6">
                        <Activity className="w-6 h-6 mr-3 text-blue-500" />
                        <h3 className="text-xl font-semibold text-gray-100">PCI Distribution</h3>
                    </div>
                    <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                            <Pie
                                data={animatedPieData}
                                cx="50%"
                                cy="45%"
                                innerRadius={100}
                                outerRadius={140}
                                paddingAngle={5}
                                dataKey="value"
                                isAnimationActive={isAnimationActive}
                                animationBegin={0}
                                animationDuration={5000}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                        className="hover:opacity-80 transition-opacity"
                                    />
                                ))}
                                <Label
                                    value="PCI Distribution"
                                    position="center"
                                    className="text-lg font-medium fill-gray-100"
                                />
                            </Pie>
                            <Legend 
                                verticalAlign="bottom" 
                                height={48}
                                formatter={(value) => {
                                    const entry = animatedPieData.find(item => item.name === value);
                                    return `${value} (${entry?.percentage.toFixed(1)}%)`;
                                }}
                                className="fill-gray-100"
                                isAnimationActive={true}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="w-full h-[600px] bg-slate-900 border-slate-800">
                <CardContent className="h-full p-8">
                    <div className="flex items-center mb-6">
                        <Activity className="w-6 h-6 mr-3 text-blue-500" />
                        <h3 className="text-xl font-semibold text-gray-100">Average PCI Score</h3>
                    </div>
                    <div className="w-full h-[90%] flex items-center justify-center">
                        <svg width="100%" height="100%" viewBox="0 0 400 300">
                            <defs>
                                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y1="0%">
                                    <stop offset="0%" stopColor="#60a5fa" />
                                    <stop offset="50%" stopColor="#34d399" />
                                    <stop offset="100%" stopColor="#60a5fa" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M 60 200 A 140 140 0 0 1 340 200"
                                fill="none"
                                stroke="#1e293b"
                                strokeWidth={6}
                                strokeLinecap="round"
                            />
                            <path
                                d="M 60 200 A 140 140 0 0 1 340 200"
                                fill="none"
                                stroke="url(#gaugeGradient)"
                                strokeWidth={6}
                                strokeLinecap="round"
                            />
                            {generateGaugeMarkers()}
                            <GaugeNeedle />
                            <text
                                x="200"
                                y="250"
                                style={{fill: '#9ca3af'}}
                                textAnchor="middle"
                                className="text-4xl font-bold text-gray-100"
                            >
                                {displayedValue.toFixed(1)}
                            </text>
                        </svg>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default StatisticsTab;
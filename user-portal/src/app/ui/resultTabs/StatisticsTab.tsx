import { useEffect } from 'react';
import Plotly from 'plotly.js-dist';

interface StatisticsTabProps {
    data: {
        average: number;
        distribution: {
            labels: string[];
            values: number[];
        };
    };
}

const StatisticsTab: React.FC<StatisticsTabProps> = ({ data }) => {
    useEffect(() => {
        Plotly.newPlot('pieChart', [
            {
                values: data.distribution.values,
                labels: data.distribution.labels,
                type: 'pie',
            },
        ]);

        Plotly.newPlot('gaugeChart', [
            {
                type: 'indicator',
                mode: 'gauge+number',
                value: data.average,
                gauge: { axis: { range: [0, 100] } },
            },
        ]);
    }, [data]);

    return (
        <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
            <div id="pieChart" style={{ width: '45%', height: '400px' }}></div>
            <div id="gaugeChart" style={{ width: '45%', height: '400px' }}></div>
        </div>
    );
};

export default StatisticsTab;

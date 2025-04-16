import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData } from '@/utils/dataUtils';

interface BarChartProps {
  data: ChartData;
  title: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
  if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center">
        <p className="text-gray-500">No data available for bar chart</p>
      </Card>
    );
  }
  
  const chartData = data.labels.map((label, index) => {
    const dataPoint: any = { name: label };
    
    data.datasets.forEach(dataset => {
      dataPoint[dataset.label] = dataset.data[index];
    });
    
    return dataPoint;
  });
  
  const colors = data.datasets[0].backgroundColor || 
    ['#4361EE', '#3A0CA3', '#7209B7', '#F72585', '#4CC9F0', '#560BAD', '#480CA8', '#3A0CA3'];
  
  return (
    <Card className="w-full bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl">
      <CardHeader>
        <CardTitle className="text-gray-100">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend 
                  wrapperStyle={{
                    color: '#fff'
                  }}
                />
                {data.datasets.map((dataset, index) => (
                  <Bar 
                    key={index} 
                    dataKey={dataset.label} 
                    fill={Array.isArray(colors) ? colors[index % colors.length] : colors}
                    className="hover:opacity-80 transition-opacity duration-300"
                  />
                ))}
              </RechartsBarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400">No data available for bar chart</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BarChart;

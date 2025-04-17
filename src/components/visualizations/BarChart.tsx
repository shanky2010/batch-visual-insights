
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
      <Card className="w-full h-[400px] flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <p className="text-gray-400">No data available for bar chart</p>
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
  
  // Enhanced color palette with soft, harmonious colors
  const colors = [
    '#8B5CF6',   // Vivid Purple
    '#0EA5E9',   // Ocean Blue
    '#D946EF',   // Magenta Pink
    '#F97316',   // Bright Orange
    '#10B981',   // Soft Green
    '#6366F1',   // Indigo
  ];
  
  return (
    <Card className="w-full bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-2xl rounded-2xl overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-100 bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 text-transparent">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4"
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(255,255,255,0.1)" 
                  className="opacity-20"
                />
                <XAxis 
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ 
                    fill: '#9CA3AF', 
                    fontSize: 12, 
                    fontWeight: 500
                    // Removed textTransform: 'capitalize' as it's not a valid SVG property
                  }}
                />
                <YAxis 
                  tick={{ 
                    fill: '#9CA3AF', 
                    fontSize: 12 
                  }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                  itemStyle={{ 
                    color: '#fff', 
                    fontSize: 14,
                    fontWeight: 600 
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  wrapperStyle={{
                    color: '#fff',
                    fontWeight: 600,
                    paddingBottom: '10px'
                  }}
                />
                {data.datasets.map((dataset, index) => (
                  <Bar 
                    key={index} 
                    dataKey={dataset.label} 
                    fill={colors[index % colors.length]}
                    className="transition-all duration-300 ease-in-out hover:opacity-80"
                    barSize={40}
                    radius={[8, 8, 0, 0]}
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

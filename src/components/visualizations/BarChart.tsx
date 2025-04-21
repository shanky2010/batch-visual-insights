
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
      <Card className="w-full h-[400px] flex items-center justify-center bg-gradient-to-br from-newpurple-900 to-newblue-800 text-white">
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
  
  // Updated color palette for a pleasing, modern look
  const colors = [
    '#A879F5', // Mild purple
    '#4E54C8', // Indigo blue
    '#9B87F5', // Light purple
    '#45B7D1', // Cool blue
    '#FFC3A0', // Peach
    '#FF7E67', // Coral
    '#6EE7B7', // Pastel green
  ];
  
  return (
    <Card className="w-full bg-gradient-to-br from-newpurple-900 to-newblue-800 text-white border-none shadow-2xl rounded-2xl overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-100 bg-clip-text bg-gradient-to-r from-newpurple-400 to-newblue-400 text-transparent">
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
                className="bg-gradient-to-br from-newblue-900 to-newpurple-800 rounded-2xl p-4"
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(255,255,255,0.08)" 
                  className="opacity-15"
                />
                <XAxis 
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ 
                    fill: '#B4B4D7', 
                    fontSize: 12, 
                    fontWeight: 600
                    // Removed textTransform which caused the error
                  }}
                />
                <YAxis 
                  tick={{ 
                    fill: '#B4B4D7', 
                    fontSize: 12,
                    fontWeight: 600
                  }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(27, 29, 64, 0.97)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 6px rgba(27,29,64,0.11)'
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
                    color: '#E5E5FF',
                    fontWeight: 700,
                    paddingBottom: '10px'
                  }}
                />
                {data.datasets.map((dataset, index) => (
                  <Bar 
                    key={index} 
                    dataKey={dataset.label} 
                    fill={colors[index % colors.length]}
                    className="transition-all duration-300 ease-in-out hover:opacity-85"
                    barSize={40}
                    radius={[7, 7, 0, 0]}
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


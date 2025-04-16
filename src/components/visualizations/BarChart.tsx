
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
  
  // Transform data for recharts
  const chartData = data.labels.map((label, index) => {
    const dataPoint: any = { name: label };
    
    data.datasets.forEach(dataset => {
      dataPoint[dataset.label] = dataset.data[index];
    });
    
    return dataPoint;
  });
  
  // Get colors from the dataset
  const colors = data.datasets[0].backgroundColor || 
    ['#4361EE', '#3A0CA3', '#7209B7', '#F72585', '#4CC9F0', '#560BAD', '#480CA8', '#3A0CA3'];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {data.datasets.map((dataset, index) => (
                  <Bar 
                    key={index} 
                    dataKey={dataset.label} 
                    fill={Array.isArray(colors) ? colors[index % colors.length] : colors}
                  />
                ))}
              </RechartsBarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">No data available for bar chart</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BarChart;

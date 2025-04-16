
import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData } from '@/utils/dataUtils';

interface PieChartProps {
  data: ChartData;
  title: string;
}

const PieChart: React.FC<PieChartProps> = ({ data, title }) => {
  if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center">
        <p className="text-gray-500">No data available for pie chart</p>
      </Card>
    );
  }
  
  // Transform data for recharts
  const chartData = data.labels.map((label, index) => ({
    name: label,
    value: data.datasets[0].data[index]
  }));
  
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
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={Array.isArray(colors) ? colors[index % colors.length] : colors} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, 'Value']} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">No data available for pie chart</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PieChart;


import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData } from '@/utils/dataUtils';

interface PieChartProps {
  data: ChartData;
  title: string;
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show label if percentage is greater than 5%
  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      style={{ fontSize: '12px' }}
    >
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

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
  
  // Enhanced color palette for better visualization
  const colors = [
    '#4361EE', '#3A0CA3', '#7209B7', '#F72585', '#4CC9F0',
    '#560BAD', '#480CA8', '#3F37C9', '#4361EE', '#3A0CA3',
    '#7209B7', '#F72585', '#4CC9F0', '#560BAD', '#480CA8'
  ];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full"> {/* Increased height for better visibility */}
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [
                    `${value.toLocaleString()}`,
                    'Value'
                  ]}
                />
                <Legend 
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                />
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

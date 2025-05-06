
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData } from '@/utils/dataUtils';

interface HistogramProps {
  data: ChartData;
  title: string;
  customColor?: string;
  showLabels?: boolean;
}

const Histogram: React.FC<HistogramProps> = ({ 
  data, 
  title, 
  customColor = '#4361EE',
  showLabels = true
}) => {
  if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center">
        <p className="text-gray-500">No data available for histogram</p>
      </Card>
    );
  }
  
  // Transform data for recharts
  const chartData = data.labels.map((label, index) => ({
    name: label,
    frequency: data.datasets[0].data[index]
  }));
  
  return (
    <Card className="w-full bg-gradient-to-br from-gray-50 to-white border-none shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-gray-800">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis 
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                  stroke="#718096"
                  tickFormatter={showLabels ? undefined : () => ''}
                />
                <YAxis 
                  stroke="#718096"
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip 
                  formatter={(value) => [value, 'Frequency']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar 
                  dataKey="frequency" 
                  fill={customColor}
                  name="Frequency"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">No data available for histogram</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Histogram;


import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData } from '@/utils/dataUtils';

interface HistogramProps {
  data: ChartData;
  title: string;
}

const Histogram: React.FC<HistogramProps> = ({ data, title }) => {
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
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
                <Bar 
                  dataKey="frequency" 
                  fill="#4361EE" 
                  name="Frequency"
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

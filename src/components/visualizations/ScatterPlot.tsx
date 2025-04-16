
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScatterPlotProps {
  data: any;
  title: string;
  xLabel?: string;
  yLabel?: string;
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({ data, title, xLabel = 'X', yLabel = 'Y' }) => {
  if (!data || !data.datasets || data.datasets.length === 0 || data.datasets[0].data.length === 0) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center">
        <p className="text-gray-500">No data available for scatter plot</p>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {data.datasets[0].data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid />
                <XAxis type="number" dataKey="x" name={xLabel} />
                <YAxis type="number" dataKey="y" name={yLabel} />
                <ZAxis range={[60]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter 
                  name={title} 
                  data={data.datasets[0].data} 
                  fill={Array.isArray(data.datasets[0].backgroundColor) ? data.datasets[0].backgroundColor[0] : data.datasets[0].backgroundColor} 
                />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">No data available for scatter plot</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScatterPlot;

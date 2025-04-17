
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Legend, Label } from 'recharts';
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
      <Card className="w-full h-[400px] flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <p className="text-gray-400">No data available for scatter plot</p>
      </Card>
    );
  }
  
  return (
    <Card className="w-full bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-2xl rounded-2xl overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-100 bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 text-transparent">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          {data.datasets[0].data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name={xLabel}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickCount={5}
                >
                  <Label 
                    value={xLabel} 
                    position="bottom" 
                    offset={10}
                    style={{ fill: '#E5E7EB', fontSize: 14, fontWeight: 500 }}
                  />
                </XAxis>
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name={yLabel}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickCount={5}
                >
                  <Label
                    value={yLabel}
                    position="left"
                    angle={-90}
                    style={{ fill: '#E5E7EB', fontSize: 14, fontWeight: 500 }}
                    offset={-5}
                  />
                </YAxis>
                <ZAxis range={[60, 400]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    color: 'white'
                  }}
                  formatter={(value, name) => {
                    if (name === 'x') return [value, xLabel];
                    if (name === 'y') return [value, yLabel];
                    return [value, name];
                  }}
                  labelFormatter={() => 'Data Point'}
                />
                <Legend 
                  verticalAlign="top"
                  formatter={() => `${xLabel} vs ${yLabel}`}
                  wrapperStyle={{
                    color: '#fff',
                    fontWeight: 600,
                    paddingBottom: '10px'
                  }}
                />
                <Scatter 
                  name="Data Points" 
                  data={data.datasets[0].data} 
                  fill="#8B5CF6"
                  stroke="#7C3AED"
                  strokeWidth={1}
                  fillOpacity={0.8}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400">No data available for scatter plot</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScatterPlot;

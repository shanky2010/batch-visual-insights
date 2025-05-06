
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Legend, Label } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScatterPlotProps {
  data: any;
  title: string;
  xLabel?: string;
  yLabel?: string;
  customColors?: {
    pointColor?: string;
    pointStroke?: string;
    backgroundColor?: string;
  };
  domainRange?: {
    xMin?: number;
    xMax?: number;
    yMin?: number;
    yMax?: number;
  };
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({ 
  data, 
  title, 
  xLabel = 'X', 
  yLabel = 'Y',
  customColors = {
    pointColor: '#9B87F5',
    pointStroke: '#4E54C8',
    backgroundColor: 'from-newpurple-900 to-newblue-800'
  },
  domainRange
}) => {
  if (!data || !data.datasets || data.datasets.length === 0 || data.datasets[0].data.length === 0) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center bg-gradient-to-br from-newpurple-900 to-newblue-800 text-white">
        <p className="text-gray-400">No data available for scatter plot</p>
      </Card>
    );
  }
  
  const backgroundGradient = customColors.backgroundColor || 'from-newpurple-900 to-newblue-800';
  
  return (
    <Card className={`w-full bg-gradient-to-br ${backgroundGradient} text-white border-none shadow-2xl rounded-2xl overflow-hidden`}>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-100 bg-clip-text bg-gradient-to-r from-newpurple-400 to-newblue-400 text-transparent">
          {title}
        </CardTitle>
        <div className="mt-2 text-sm text-gray-200">
          <span className="font-semibold">X axis:</span> {xLabel} &nbsp; | &nbsp;
          <span className="font-semibold">Y axis:</span> {yLabel}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          {data.datasets[0].data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                className={`bg-gradient-to-br from-newblue-900 to-newpurple-800 rounded-2xl p-4`}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name={xLabel}
                  tick={{ fill: '#B4B4D7', fontSize: 13, fontWeight: 600 }}
                  tickCount={5}
                  domain={domainRange ? [domainRange.xMin || 'auto', domainRange.xMax || 'auto'] : ['auto', 'auto']}
                >
                  <Label 
                    value={`X: ${xLabel}`} 
                    position="bottom" 
                    offset={18}
                    style={{ fill: '#AAB4FF', fontSize: 15, fontWeight: 700 }}
                  />
                </XAxis>
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name={yLabel}
                  tick={{ fill: '#B4B4D7', fontSize: 13, fontWeight: 600 }}
                  tickCount={5}
                  domain={domainRange ? [domainRange.yMin || 'auto', domainRange.yMax || 'auto'] : ['auto', 'auto']}
                >
                  <Label
                    value={`Y: ${yLabel}`}
                    position="left"
                    angle={-90}
                    style={{ fill: '#AAB4FF', fontSize: 15, fontWeight: 700 }}
                    offset={-11}
                  />
                </YAxis>
                <ZAxis range={[60, 400]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(27, 29, 64, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px',
                    boxShadow: '0 4px 8px rgba(64, 64, 128, 0.10)',
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
                  formatter={() => `Scatter: ${xLabel} vs ${yLabel}`}
                  wrapperStyle={{
                    color: '#E5E5FF',
                    fontWeight: 700,
                    paddingBottom: '10px',
                    fontSize: 14,
                  }}
                />
                <Scatter 
                  name={`Data Points (${xLabel} vs ${yLabel})`} 
                  data={data.datasets[0].data} 
                  fill={customColors.pointColor}
                  stroke={customColors.pointStroke}
                  strokeWidth={1}
                  fillOpacity={0.81}
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

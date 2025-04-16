
import React from 'react';
import { ResponsiveContainer, Treemap as RechartsTreemap, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TreeMapProps {
  data: {
    name: string;
    value: number;
    children?: Array<{ name: string; value: number }>;
  }[];
  title: string;
}

// Custom color generation for treemap items
const getTreemapColors = (index: number) => {
  const colors = [
    '#4CC9F0', '#4361EE', '#3A0CA3', '#7209B7', '#F72585',
    '#560BAD', '#480CA8', '#3F37C9', '#6930C3', '#5390D9'
  ];
  return colors[index % colors.length];
};

// Custom content for treemap items
const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, index, name, value } = props;
  
  if (width < 30 || height < 30) {
    return null; // Don't render text for small rectangles
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: getTreemapColors(index),
          stroke: '#fff',
          strokeWidth: 2,
          strokeOpacity: 0.7,
          fillOpacity: 0.85
        }}
        className="filter hover:brightness-110 transition-all duration-300 cursor-pointer"
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - 8}
        textAnchor="middle"
        fill="#fff"
        fontSize={12}
        fontWeight="bold"
        className="pointer-events-none"
      >
        {name}
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 8}
        textAnchor="middle"
        fill="#fff"
        fontSize={11}
        className="pointer-events-none"
      >
        {`Value: ${value}`}
      </text>
    </g>
  );
};

// Custom tooltip for treemap
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 text-white p-2 rounded-md border border-gray-700 shadow-lg backdrop-blur-md">
        <p className="font-semibold">{payload[0].payload.name}</p>
        <p>Value: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const TreeMap: React.FC<TreeMapProps> = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <p className="text-gray-400">No data available for treemap</p>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl">
      <CardHeader>
        <CardTitle className="text-gray-100">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsTreemap
              data={data}
              dataKey="value"
              aspectRatio={4/3}
              animationDuration={1000}
              animationEasing="ease-in-out"
              content={<CustomTreemapContent />}
            >
              <Tooltip content={<CustomTooltip />} />
            </RechartsTreemap>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreeMap;

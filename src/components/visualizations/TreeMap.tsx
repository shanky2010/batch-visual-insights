
import React from 'react';
import { ResponsiveContainer, Treemap as RechartsTreemap } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TreeMapProps {
  data: {
    name: string;
    value: number;
    children?: Array<{ name: string; value: number }>;
  }[];
  title: string;
}

const TreeMap: React.FC<TreeMapProps> = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center">
        <p className="text-gray-500">No data available for treemap</p>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl">
      <CardHeader>
        <CardTitle className="text-gray-100">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsTreemap
              data={data}
              dataKey="value"
              stroke="#fff"
              fill="#8884d8"
              animationDuration={1000}
            >
            </RechartsTreemap>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreeMap;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatasetSummary } from '@/utils/dataUtils';

interface AnalysisCardProps {
  fileName: string;
  columnName: string;
  stats: DatasetSummary;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ fileName, columnName, stats }) => {
  // Function to format number with proper precision
  const formatNumber = (value: number | null): string => {
    if (value === null) return 'N/A';
    
    // For small numbers or integers, show more decimal places
    if (Number.isInteger(value) || Math.abs(value) < 0.01) {
      return value.toString();
    }
    
    // For regular numbers, limit to 4 decimal places
    return value.toFixed(4);
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          {columnName}
          <span className="text-sm text-gray-500 font-normal ml-2">
            from {fileName}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Mean</p>
            <p className="text-lg font-medium">{formatNumber(stats.mean)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Median</p>
            <p className="text-lg font-medium">{formatNumber(stats.median)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Std. Deviation</p>
            <p className="text-lg font-medium">{formatNumber(stats.stdDev)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Range</p>
            <p className="text-lg font-medium">
              {formatNumber(stats.min)} - {formatNumber(stats.max)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Variance</p>
            <p className="text-lg font-medium">{formatNumber(stats.variance)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Count</p>
            <p className="text-lg font-medium">{stats.count || 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisCard;

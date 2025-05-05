
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatasetSummary } from '@/utils/dataUtils';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface AnalysisCardProps {
  fileName: string;
  columnName: string;
  stats: DatasetSummary;
  comparisonStats?: DatasetSummary;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ fileName, columnName, stats, comparisonStats }) => {
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
  
  // Function to determine if a value is significantly different
  const getDifference = (value1: number | null, value2: number | null): { diff: number; isSignificant: boolean } => {
    if (value1 === null || value2 === null) return { diff: 0, isSignificant: false };
    
    const diff = value1 - value2;
    const percentDiff = Math.abs(diff) / (Math.abs(value2) || 1);
    
    return { 
      diff, 
      isSignificant: percentDiff > 0.1 // Consider 10% difference as significant
    };
  };
  
  // Function to render a value with comparison indicator
  const renderWithComparison = (value: number | null, comparisonValue: number | null, label: string) => {
    if (!comparisonStats || comparisonValue === null) {
      return (
        <p className="text-lg font-medium">{formatNumber(value)}</p>
      );
    }
    
    const { diff, isSignificant } = getDifference(value, comparisonValue);
    
    return (
      <div className="flex items-center space-x-1">
        <p className="text-lg font-medium">{formatNumber(value)}</p>
        {isSignificant && (
          <div className={`flex items-center ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {diff > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            <span className="text-xs font-medium ml-1">
              {Math.abs(diff).toFixed(2)}
            </span>
          </div>
        )}
      </div>
    );
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
            {renderWithComparison(stats.mean, comparisonStats?.mean, 'mean')}
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Median</p>
            {renderWithComparison(stats.median, comparisonStats?.median, 'median')}
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Std. Deviation</p>
            {renderWithComparison(stats.stdDev, comparisonStats?.stdDev, 'stdDev')}
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Range</p>
            <p className="text-lg font-medium">
              {formatNumber(stats.min)} - {formatNumber(stats.max)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Variance</p>
            {renderWithComparison(stats.variance, comparisonStats?.variance, 'variance')}
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Count</p>
            <p className="text-lg font-medium">{stats.count || 'N/A'}</p>
          </div>
          {stats.skewness !== undefined && (
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Skewness</p>
              {renderWithComparison(stats.skewness, comparisonStats?.skewness, 'skewness')}
            </div>
          )}
          {stats.kurtosis !== undefined && (
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Kurtosis</p>
              {renderWithComparison(stats.kurtosis, comparisonStats?.kurtosis, 'kurtosis')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisCard;

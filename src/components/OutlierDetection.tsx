
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Trash2, ChartBar, Box } from 'lucide-react';
import { toast } from "@/components/ui/sonner";
import { detectOutliersIQR, detectOutliersZScore } from '@/utils/dataUtils';
import { ChartContainer } from '@/components/ui/chart';

interface OutlierDetectionProps {
  fileName: string;
  columnName: string;
  columnValues: number[];
  onOutliersRemoved?: (values: number[], removedIndices: number[]) => void;
}

const OutlierDetection: React.FC<OutlierDetectionProps> = ({ 
  fileName, 
  columnName, 
  columnValues,
  onOutliersRemoved
}) => {
  const [detectionMethod, setDetectionMethod] = useState<'iqr' | 'zscore'>('iqr');
  const [zScoreThreshold, setZScoreThreshold] = useState<number>(2.5);
  const [showBoxPlot, setShowBoxPlot] = useState<boolean>(false);
  
  // Calculate outliers based on selected method
  const getOutliers = () => {
    if (detectionMethod === 'iqr') {
      return detectOutliersIQR(columnValues);
    } else {
      return detectOutliersZScore(columnValues, zScoreThreshold);
    }
  };
  
  const { outliers, outlierIndices } = getOutliers();
  
  // Calculate stats for outliers
  const calculateOutlierStats = () => {
    if (outliers.length === 0) return { min: null, max: null, mean: null, count: 0 };
    
    const sum = outliers.reduce((acc, val) => acc + val, 0);
    const mean = sum / outliers.length;
    const min = Math.min(...outliers);
    const max = Math.max(...outliers);
    
    return {
      min,
      max,
      mean,
      count: outliers.length
    };
  };
  
  const outlierStats = calculateOutlierStats();
  
  // Export outliers as CSV
  const exportOutliersCSV = () => {
    if (outliers.length === 0) {
      toast.info('No outliers to export');
      return;
    }
    
    let csv = 'Index,Value\n';
    outliers.forEach((value, i) => {
      const originalIndex = outlierIndices[i] + 1; // Add 1 to match typical row numbering starting at 1
      csv += `${originalIndex},${value}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName.replace(/\s+/g, '-').toLowerCase()}-${columnName.replace(/\s+/g, '-').toLowerCase()}-outliers.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Outliers exported as CSV');
  };

  // Remove outliers and pass cleaned data back to parent
  const removeOutliers = () => {
    if (outliers.length === 0) {
      toast.info('No outliers to remove');
      return;
    }

    // Create a set of indices to remove for O(1) lookup
    const indicesToRemove = new Set(outlierIndices);
    
    // Filter out the outliers
    const cleanedValues = columnValues.filter((_, index) => !indicesToRemove.has(index));
    
    // Call the callback with cleaned values and removed indices
    if (onOutliersRemoved) {
      onOutliersRemoved(cleanedValues, [...outlierIndices]);
      toast.success(`${outliers.length} outliers removed from dataset`);
    }
  };
  
  // Generate data for boxplot
  const generateBoxPlotData = () => {
    if (columnValues.length === 0) return null;
    
    // Sort values for calculations
    const sortedValues = [...columnValues].sort((a, b) => a - b);
    
    // Calculate quartiles
    const q1Index = Math.floor(sortedValues.length * 0.25);
    const medianIndex = Math.floor(sortedValues.length * 0.5);
    const q3Index = Math.floor(sortedValues.length * 0.75);
    
    const min = sortedValues[0];
    const q1 = sortedValues[q1Index];
    const median = sortedValues[medianIndex];
    const q3 = sortedValues[q3Index];
    const max = sortedValues[sortedValues.length - 1];
    
    return { min, q1, median, q3, max, outliers };
  };
  
  const boxPlotData = generateBoxPlotData();
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-semibold">
          Outlier Detection: {columnName}
          <span className="text-sm text-gray-500 font-normal ml-2">
            from {fileName}
          </span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select 
            value={detectionMethod} 
            onValueChange={(value) => setDetectionMethod(value as 'iqr' | 'zscore')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Detection Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="iqr">IQR Method</SelectItem>
              <SelectItem value="zscore">Z-Score Method</SelectItem>
            </SelectContent>
          </Select>
          
          {detectionMethod === 'zscore' && (
            <Select 
              value={zScoreThreshold.toString()} 
              onValueChange={(value) => setZScoreThreshold(parseFloat(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Z-Score Threshold" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2.0 (Less Strict)</SelectItem>
                <SelectItem value="2.5">2.5 (Standard)</SelectItem>
                <SelectItem value="3">3.0 (More Strict)</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBoxPlot(!showBoxPlot)}
          >
            <Box className="h-4 w-4 mr-2" />
            {showBoxPlot ? "Hide Box Plot" : "Show Box Plot"}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={exportOutliersCSV} 
            disabled={outliers.length === 0}
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          {onOutliersRemoved && (
            <Button 
              variant="destructive" 
              onClick={removeOutliers} 
              disabled={outliers.length === 0}
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Outliers
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-100 p-3 rounded-md">
            <p className="text-sm text-gray-500">Count</p>
            <p className="text-lg font-medium">{outlierStats.count} ({((outlierStats.count / columnValues.length) * 100).toFixed(1)}%)</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-md">
            <p className="text-sm text-gray-500">Min</p>
            <p className="text-lg font-medium">{outlierStats.min !== null ? outlierStats.min.toFixed(2) : 'N/A'}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-md">
            <p className="text-sm text-gray-500">Max</p>
            <p className="text-lg font-medium">{outlierStats.max !== null ? outlierStats.max.toFixed(2) : 'N/A'}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-md">
            <p className="text-sm text-gray-500">Mean</p>
            <p className="text-lg font-medium">{outlierStats.mean !== null ? outlierStats.mean.toFixed(2) : 'N/A'}</p>
          </div>
        </div>
        
        {showBoxPlot && boxPlotData && (
          <div className="mb-6 pt-2">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Box Plot Visualization</h3>
            <div className="h-[120px] w-full bg-gray-50 border rounded-md relative p-4">
              {/* Box plot horizontal line */}
              <div className="absolute h-[2px] w-[80%] bg-gray-400 top-1/2 left-[10%]"></div>
              
              {/* Min vertical line */}
              <div className="absolute h-[20px] w-[2px] bg-gray-600 top-1/2 -translate-y-1/2" style={{ left: '10%' }}></div>
              
              {/* Q1 box start */}
              <div 
                className="absolute h-[40px] w-[2px] bg-blue-600 top-1/2 -translate-y-1/2" 
                style={{ 
                  left: `${10 + ((boxPlotData.q1 - boxPlotData.min) / (boxPlotData.max - boxPlotData.min)) * 80}%` 
                }}
              ></div>
              
              {/* Q1-Q3 box */}
              <div 
                className="absolute h-[40px] bg-blue-200 top-1/2 -translate-y-1/2" 
                style={{ 
                  left: `${10 + ((boxPlotData.q1 - boxPlotData.min) / (boxPlotData.max - boxPlotData.min)) * 80}%`,
                  width: `${((boxPlotData.q3 - boxPlotData.q1) / (boxPlotData.max - boxPlotData.min)) * 80}%` 
                }}
              ></div>
              
              {/* Median line */}
              <div 
                className="absolute h-[40px] w-[2px] bg-blue-800 top-1/2 -translate-y-1/2 z-10" 
                style={{ 
                  left: `${10 + ((boxPlotData.median - boxPlotData.min) / (boxPlotData.max - boxPlotData.min)) * 80}%` 
                }}
              ></div>
              
              {/* Q3 box end */}
              <div 
                className="absolute h-[40px] w-[2px] bg-blue-600 top-1/2 -translate-y-1/2" 
                style={{ 
                  left: `${10 + ((boxPlotData.q3 - boxPlotData.min) / (boxPlotData.max - boxPlotData.min)) * 80}%` 
                }}
              ></div>
              
              {/* Max vertical line */}
              <div 
                className="absolute h-[20px] w-[2px] bg-gray-600 top-1/2 -translate-y-1/2" 
                style={{ 
                  left: '90%' 
                }}
              ></div>
              
              {/* Outliers */}
              {boxPlotData.outliers.map((value, index) => (
                <div 
                  key={index} 
                  className="absolute h-[6px] w-[6px] rounded-full bg-red-600 top-1/2 -translate-y-1/2 -translate-x-1/2" 
                  style={{ 
                    left: `${10 + ((value - boxPlotData.min) / (boxPlotData.max - boxPlotData.min)) * 80}%` 
                  }}
                ></div>
              ))}
              
              {/* Labels */}
              <div className="absolute -bottom-6 text-[10px] text-gray-600" style={{ left: '10%' }}>Min: {boxPlotData.min.toFixed(1)}</div>
              <div className="absolute -bottom-6 text-[10px] text-gray-600" style={{ 
                left: `${10 + ((boxPlotData.q1 - boxPlotData.min) / (boxPlotData.max - boxPlotData.min)) * 80}%` 
              }}>Q1: {boxPlotData.q1.toFixed(1)}</div>
              <div className="absolute -bottom-6 text-[10px] text-gray-600" style={{ 
                left: `${10 + ((boxPlotData.median - boxPlotData.min) / (boxPlotData.max - boxPlotData.min)) * 80}%` 
              }}>Median: {boxPlotData.median.toFixed(1)}</div>
              <div className="absolute -bottom-6 text-[10px] text-gray-600" style={{ 
                left: `${10 + ((boxPlotData.q3 - boxPlotData.min) / (boxPlotData.max - boxPlotData.min)) * 80}%` 
              }}>Q3: {boxPlotData.q3.toFixed(1)}</div>
              <div className="absolute -bottom-6 text-[10px] text-gray-600" style={{ left: '90%' }}>Max: {boxPlotData.max.toFixed(1)}</div>
            </div>
          </div>
        )}
        
        {outliers.length > 0 ? (
          <div className="bg-white border rounded-md max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row #</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outliers.map((value, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{outlierIndices[index] + 1}</TableCell>
                    <TableCell className="text-red-600 font-medium">{value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center p-6 text-gray-500">
            No outliers detected with current settings
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OutlierDetection;

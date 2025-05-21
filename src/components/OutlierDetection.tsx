
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from 'lucide-react';
import { toast } from "@/components/ui/sonner";
import { detectOutliersIQR, detectOutliersZScore } from '@/utils/dataUtils';

interface OutlierDetectionProps {
  fileName: string;
  columnName: string;
  columnValues: number[];
}

const OutlierDetection: React.FC<OutlierDetectionProps> = ({ 
  fileName, 
  columnName, 
  columnValues 
}) => {
  const [detectionMethod, setDetectionMethod] = useState<'iqr' | 'zscore'>('iqr');
  const [zScoreThreshold, setZScoreThreshold] = useState<number>(2.5);
  
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
            onClick={exportOutliersCSV} 
            disabled={outliers.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
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
                    <TableCell>{value}</TableCell>
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

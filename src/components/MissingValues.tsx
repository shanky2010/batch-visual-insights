
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { handleMissingValues, DataFile } from '@/utils/dataUtils';
import { toast } from "@/components/ui/sonner";

interface MissingValuesProps {
  file: DataFile;
  onProcessedData: (processedData: any[][]) => void;
}

const MissingValues: React.FC<MissingValuesProps> = ({ file, onProcessedData }) => {
  const [imputationMethod, setImputationMethod] = useState<'remove' | 'mean' | 'median' | 'value'>('mean');
  const [replacementValue, setReplacementValue] = useState<string>('0');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Calculate missing value statistics
  const calculateMissingStats = () => {
    const data = file.data;
    const totalCells = (data.length - 1) * data[0].length; // Exclude header row
    
    let missingCount = 0;
    let columnStats: {[colIndex: number]: number} = {};
    
    // Initialize column stats
    for (let i = 0; i < data[0].length; i++) {
      columnStats[i] = 0;
    }
    
    // Count missing values
    for (let i = 1; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        const value = data[i][j];
        if (value === undefined || value === null || value === '') {
          missingCount++;
          columnStats[j]++;
        }
      }
    }
    
    // Find columns with most missing values
    const sortedColumns = Object.entries(columnStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([colIndex, count]) => ({
        name: data[0][parseInt(colIndex)] || `Column ${parseInt(colIndex) + 1}`,
        count
      }));
    
    return {
      total: totalCells,
      missing: missingCount,
      percentage: (missingCount / totalCells) * 100,
      topColumns: sortedColumns
    };
  };
  
  const stats = calculateMissingStats();
  
  const handleImputation = () => {
    setIsProcessing(true);
    
    try {
      let replacementVal = undefined;
      
      if (imputationMethod === 'value') {
        // Try to convert to number if it's numeric
        const numValue = parseFloat(replacementValue);
        replacementVal = isNaN(numValue) ? replacementValue : numValue;
      }
      
      const processedData = handleMissingValues(file.data, imputationMethod, replacementVal);
      
      onProcessedData(processedData);
      toast.success(`Successfully handled missing values using ${imputationMethod} method`);
    } catch (error) {
      console.error('Error handling missing values:', error);
      toast.error('Failed to handle missing values');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          Missing Values
          <span className="text-sm text-gray-500 font-normal ml-2">
            in {file.name}
          </span>
        </CardTitle>
        <CardDescription>
          {stats.missing > 0 
            ? `Found ${stats.missing} missing values (${stats.percentage.toFixed(1)}% of total data)`
            : 'No missing values found in this dataset'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {stats.missing > 0 && (
          <>
            <div className="bg-yellow-50 p-3 rounded-md mb-4">
              <p className="text-sm font-medium">Columns with most missing values:</p>
              <ul className="mt-1 space-y-1">
                {stats.topColumns.map((col, index) => (
                  <li key={index} className="text-sm">
                    <span className="font-medium">{col.name}:</span> {col.count} missing values
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="grid gap-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="imputation-method" className="text-sm font-medium">Imputation Method</label>
                <Select 
                  value={imputationMethod} 
                  onValueChange={(value) => setImputationMethod(value as 'remove' | 'mean' | 'median' | 'value')}
                >
                  <SelectTrigger id="imputation-method">
                    <SelectValue placeholder="Select imputation method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mean">Mean Imputation</SelectItem>
                    <SelectItem value="median">Median Imputation</SelectItem>
                    <SelectItem value="value">Fixed Value</SelectItem>
                    <SelectItem value="remove">Remove Rows</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {imputationMethod === 'value' && (
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="replacement-value" className="text-sm font-medium">Replacement Value</label>
                  <Input
                    id="replacement-value"
                    value={replacementValue}
                    onChange={(e) => setReplacementValue(e.target.value)}
                    placeholder="Enter value"
                  />
                </div>
              )}
              
              <Button 
                onClick={handleImputation}
                disabled={isProcessing || stats.missing === 0}
              >
                {isProcessing ? 'Processing...' : 'Apply Imputation'}
              </Button>
            </div>
          </>
        )}
        
        {stats.missing === 0 && (
          <div className="text-center py-6 text-gray-500">
            This dataset doesn't contain any missing values
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MissingValues;

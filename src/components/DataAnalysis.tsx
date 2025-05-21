
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DataFile, 
  DatasetSummary, 
  calculateStatistics, 
  formatStatisticsForExport,
  getNumericColumns
} from '@/utils/dataUtils';
import AnalysisCard from './AnalysisCard';
import OutlierDetection from './OutlierDetection';
import MissingValues from './MissingValues';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import { toast } from "@/components/ui/sonner";

interface DataAnalysisProps {
  files: DataFile[];
  selectedColumns: {[key: string]: any}; // Map of column keys to column options
}

const DataAnalysis: React.FC<DataAnalysisProps> = ({ files, selectedColumns }) => {
  const [summaries, setSummaries] = useState<{[key: string]: DatasetSummary}>({});
  const [activeTab, setActiveTab] = useState<string>('statistics');
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<{[fileId: string]: any[][]}>({});

  // Create a mapping of files for easier access
  const filesMap = files.reduce<{[key: string]: DataFile}>((acc, file) => {
    acc[file.id] = file;
    return acc;
  }, {});

  // Calculate statistics for all selected columns
  const calculateAllStats = () => {
    const newSummaries: {[key: string]: DatasetSummary} = {};

    Object.entries(selectedColumns).forEach(([key, column]) => {
      const file = filesMap[column.fileId];
      if (!file) return;

      // Use processed data if available for this file, otherwise use original data
      const dataToUse = processedData[file.id] || file.data;
      
      const stats = calculateStatistics(dataToUse, column.columnIndex);
      newSummaries[key] = stats;
    });

    setSummaries(newSummaries);
    
    if (Object.keys(newSummaries).length > 0) {
      // Set the first column as selected by default
      setSelectedColumn(Object.keys(newSummaries)[0]);
    }
    
    toast.success('Statistics calculated successfully');
  };

  const exportStatistics = () => {
    try {
      const csv = formatStatisticsForExport(summaries, selectedColumns);

      // Create and trigger download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statistics-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Statistics exported as CSV");
    } catch (error) {
      console.error("Error exporting statistics:", error);
      toast.error("Failed to export statistics");
    }
  };
  
  // Handle processed data from MissingValues component
  const handleProcessedData = (file: DataFile, newData: any[][]) => {
    setProcessedData(prev => ({
      ...prev,
      [file.id]: newData
    }));
    
    // Recalculate statistics if we already have them
    if (Object.keys(summaries).length > 0) {
      calculateAllStats();
    }
  };
  
  // Get the column values for a specific column (for outlier detection)
  const getColumnValues = (columnKey: string): number[] => {
    if (!selectedColumn) return [];
    
    const column = selectedColumns[columnKey];
    if (!column) return [];
    
    const file = filesMap[column.fileId];
    if (!file) return [];
    
    // Use processed data if available for this file, otherwise use original data
    const dataToUse = processedData[file.id] || file.data;
    
    // Extract numeric values from the column (skip header row)
    return dataToUse.slice(1)
      .map(row => parseFloat(row[column.columnIndex]))
      .filter(val => !isNaN(val));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Data Analysis</h2>
        <div className="flex space-x-2">
          <Button 
            onClick={calculateAllStats}
            disabled={Object.keys(selectedColumns).length === 0 || files.length === 0}
          >
            Calculate Statistics
          </Button>
          <Button 
            variant="outline" 
            onClick={exportStatistics} 
            disabled={Object.keys(summaries).length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Statistics
          </Button>
        </div>
      </div>
      
      {Object.keys(summaries).length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-[400px]">
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="outliers">Outliers</TabsTrigger>
            <TabsTrigger value="missing">Missing Values</TabsTrigger>
          </TabsList>
          
          <TabsContent value="statistics" className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(summaries).map(([key, summary]) => {
                const column = selectedColumns[key];
                const file = filesMap[column?.fileId];
                
                if (!file || !column) return null;
                
                return (
                  <div key={key} onClick={() => setSelectedColumn(key)}>
                    <AnalysisCard 
                      fileName={file.name}
                      columnName={summary.columnName}
                      stats={summary}
                    />
                  </div>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="outliers" className="space-y-4 pt-2">
            {selectedColumn && selectedColumns[selectedColumn] ? (
              <OutlierDetection
                fileName={filesMap[selectedColumns[selectedColumn]?.fileId]?.name || ''}
                columnName={summaries[selectedColumn]?.columnName || ''}
                columnValues={getColumnValues(selectedColumn)}
              />
            ) : (
              <div className="text-center p-8 text-gray-500">
                {Object.keys(summaries).length > 0 
                  ? "Select a column to analyze outliers" 
                  : "Calculate statistics first to analyze outliers"}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="missing" className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-6">
              {files.map(file => (
                <MissingValues 
                  key={file.id} 
                  file={file}
                  onProcessedData={(newData) => handleProcessedData(file, newData)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
      
      {Object.keys(summaries).length === 0 && (
        <div className="bg-gray-50 border rounded-lg p-8 text-center">
          <p className="text-gray-500">
            {Object.keys(selectedColumns).length === 0 
              ? "Select columns to analyze" 
              : "Click 'Calculate Statistics' to begin analysis"}
          </p>
        </div>
      )}
    </div>
  );
};

export default DataAnalysis;

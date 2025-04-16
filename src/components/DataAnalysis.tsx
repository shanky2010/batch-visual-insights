
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Chart, Download, RefreshCw, X } from 'lucide-react';
import AnalysisCard from './AnalysisCard';
import BarChart from './visualizations/BarChart';
import PieChart from './visualizations/PieChart';
import Histogram from './visualizations/Histogram';
import ScatterPlot from './visualizations/ScatterPlot';
import { 
  DataFile, 
  DatasetSummary,
  calculateStatistics, 
  getNumericColumns,
  prepareBarChartData,
  preparePieChartData,
  prepareHistogramData,
  prepareScatterPlotData
} from '@/utils/dataUtils';

interface DataAnalysisProps {
  files: DataFile[];
}

interface ColumnOption {
  fileId: string;
  fileName: string;
  columnIndex: number;
  columnName: string;
}

const DataAnalysis: React.FC<DataAnalysisProps> = ({ files }) => {
  const [columnOptions, setColumnOptions] = useState<ColumnOption[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<{[key: string]: ColumnOption}>({});
  const [summaries, setSummaries] = useState<{[key: string]: DatasetSummary}>({});
  const [chartData, setChartData] = useState<{
    bar: any;
    pie: any;
    histogram: any;
    scatter: any;
  }>({
    bar: null,
    pie: null,
    histogram: null,
    scatter: null
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("statistics");
  const [scatterplotConfig, setScatterplotConfig] = useState<{x: ColumnOption | null, y: ColumnOption | null}>({
    x: null,
    y: null
  });

  // When files change, update column options
  useEffect(() => {
    const options: ColumnOption[] = [];
    
    files.forEach(file => {
      const numericColumns = getNumericColumns(file.data, file.headers);
      
      numericColumns.forEach(column => {
        options.push({
          fileId: file.id,
          fileName: file.name,
          columnIndex: column.index,
          columnName: column.name
        });
      });
    });
    
    setColumnOptions(options);
    
    // Reset selections if no files or columns
    if (options.length === 0) {
      setSelectedColumns({});
      setSummaries({});
      setChartData({
        bar: null,
        pie: null,
        histogram: null,
        scatter: null
      });
      setScatterplotConfig({ x: null, y: null });
    }
  }, [files]);

  // Perform analysis when selected columns change
  const performAnalysis = () => {
    if (Object.keys(selectedColumns).length === 0) {
      toast.error("Please select at least one column to analyze");
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      // Calculate statistics for each selected column
      const newSummaries: {[key: string]: DatasetSummary} = {};
      
      Object.entries(selectedColumns).forEach(([key, columnOption]) => {
        const file = files.find(f => f.id === columnOption.fileId);
        
        if (file) {
          const stats = calculateStatistics(file.data, columnOption.columnIndex);
          newSummaries[key] = {
            columnName: columnOption.columnName,
            ...stats
          };
        }
      });
      
      setSummaries(newSummaries);
      
      // Prepare chart data for the first selected column
      if (Object.keys(selectedColumns).length > 0) {
        const firstKey = Object.keys(selectedColumns)[0];
        const firstColumn = selectedColumns[firstKey];
        const file = files.find(f => f.id === firstColumn.fileId);
        
        if (file) {
          // Find a suitable category column for the x-axis (first non-numeric column or use index)
          const firstNonNumericColumn = file.headers.findIndex((_, idx) => {
            // Skip current column and check if column contains text values
            if (idx === firstColumn.columnIndex) return false;
            
            const columnValues = file.data.slice(1).map(row => row[idx]);
            const isAllNumeric = columnValues.every(val => !isNaN(parseFloat(val)));
            
            return !isAllNumeric;
          });
          
          const labelColumnIndex = firstNonNumericColumn !== -1 ? firstNonNumericColumn : 0;
          
          // Prepare various chart data
          const barData = prepareBarChartData(
            file.data, 
            labelColumnIndex, 
            firstColumn.columnIndex
          );
          
          const pieData = preparePieChartData(
            file.data, 
            labelColumnIndex, 
            firstColumn.columnIndex
          );
          
          const histogramData = prepareHistogramData(
            file.data,
            firstColumn.columnIndex
          );
          
          setChartData({
            bar: barData,
            pie: pieData,
            histogram: histogramData,
            scatter: null // This will be handled separately
          });
        }
      }
      
      // Handle scatter plot if we have selections for both axes
      if (scatterplotConfig.x && scatterplotConfig.y) {
        const xFile = files.find(f => f.id === scatterplotConfig.x?.fileId);
        const yFile = files.find(f => f.id === scatterplotConfig.y?.fileId);
        
        if (xFile && yFile && xFile.id === yFile.id) {
          // Both columns are from the same file
          const scatterData = prepareScatterPlotData(
            xFile.data,
            scatterplotConfig.x.columnIndex,
            scatterplotConfig.y.columnIndex
          );
          
          setChartData(prev => ({
            ...prev,
            scatter: scatterData
          }));
        }
      }
      
      toast.success("Analysis completed successfully");
    } catch (error) {
      console.error("Error performing analysis:", error);
      toast.error("Failed to analyze data. Please check the format of your CSV files.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate a unique key for a column selection
  const generateColumnKey = (columnOption: ColumnOption) => {
    return `${columnOption.fileId}-${columnOption.columnIndex}`;
  };

  // Handle column selection
  const handleColumnSelect = (columnOption: ColumnOption) => {
    const key = generateColumnKey(columnOption);
    
    setSelectedColumns(prev => ({
      ...prev,
      [key]: columnOption
    }));
  };

  // Remove a column from selection
  const removeColumn = (key: string) => {
    setSelectedColumns(prev => {
      const newSelections = { ...prev };
      delete newSelections[key];
      return newSelections;
    });
    
    setSummaries(prev => {
      const newSummaries = { ...prev };
      delete newSummaries[key];
      return newSummaries;
    });
  };

  // Export analysis results
  const exportResults = () => {
    try {
      const results: any = {
        statistics: {},
        timestamp: new Date().toISOString()
      };
      
      // Add statistics for each selected column
      Object.entries(summaries).forEach(([key, summary]) => {
        const columnOption = selectedColumns[key];
        
        if (columnOption) {
          results.statistics[`${columnOption.fileName} - ${columnOption.columnName}`] = {
            mean: summary.mean,
            median: summary.median,
            min: summary.min,
            max: summary.max,
            standardDeviation: summary.stdDev
          };
        }
      });
      
      // Convert to JSON and create download
      const jsonString = JSON.stringify(results, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-analysis-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Analysis results exported successfully");
    } catch (error) {
      console.error("Error exporting results:", error);
      toast.error("Failed to export results");
    }
  };

  return (
    <div className="space-y-6">
      {/* Column Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <Select 
                onValueChange={(value) => {
                  const option = columnOptions.find(opt => 
                    generateColumnKey(opt) === value
                  );
                  if (option) handleColumnSelect(option);
                }}
              >
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Select a column to analyze" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Available Columns</SelectLabel>
                    {columnOptions.map((option) => (
                      <SelectItem 
                        key={generateColumnKey(option)} 
                        value={generateColumnKey(option)}
                      >
                        {option.fileName} - {option.columnName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={performAnalysis}
                disabled={isAnalyzing || Object.keys(selectedColumns).length === 0}
                className="bg-data-purple hover:bg-data-violet"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : 'Analyze Data'}
              </Button>
              
              <Button
                variant="outline"
                onClick={exportResults}
                disabled={Object.keys(summaries).length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Results
              </Button>
            </div>
            
            {/* Display selected columns */}
            {Object.keys(selectedColumns).length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Selected columns:</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedColumns).map(([key, column]) => (
                    <div 
                      key={key}
                      className="flex items-center bg-blue-100 text-blue-800 text-xs font-medium rounded px-2.5 py-1"
                    >
                      {column.fileName} - {column.columnName}
                      <button
                        onClick={() => removeColumn(key)}
                        className="ml-1.5 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tabs */}
      {Object.keys(summaries).length > 0 && (
        <Tabs
          defaultValue="statistics"
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full"
        >
          <TabsList className="mb-6 grid w-full grid-cols-4">
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="barcharts">Bar & Pie Charts</TabsTrigger>
            <TabsTrigger value="histograms">Histograms</TabsTrigger>
            <TabsTrigger value="scatterplots">Scatter Plots</TabsTrigger>
          </TabsList>
          
          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(summaries).map(([key, summary]) => {
                const columnOption = selectedColumns[key];
                return (
                  <AnalysisCard
                    key={key}
                    fileName={columnOption.fileName}
                    columnName={columnOption.columnName}
                    stats={summary}
                  />
                );
              })}
            </div>
          </TabsContent>
          
          {/* Bar Charts Tab */}
          <TabsContent value="barcharts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {chartData.bar && (
                <BarChart 
                  data={chartData.bar} 
                  title={`Bar Chart: ${Object.values(selectedColumns)[0]?.columnName || 'Data'}`} 
                />
              )}
              
              {chartData.pie && (
                <PieChart 
                  data={chartData.pie} 
                  title={`Pie Chart: ${Object.values(selectedColumns)[0]?.columnName || 'Data'}`} 
                />
              )}
              
              {!chartData.bar && !chartData.pie && (
                <div className="col-span-2 flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No data available for charts. Select a column and analyze the data.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Histograms Tab */}
          <TabsContent value="histograms" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(selectedColumns).map(([key, columnOption]) => {
                // Generate histogram data for each selected column
                const file = files.find(f => f.id === columnOption.fileId);
                
                if (!file) return null;
                
                const histogramData = prepareHistogramData(
                  file.data,
                  columnOption.columnIndex
                );
                
                return (
                  <Histogram
                    key={key}
                    data={histogramData}
                    title={`Histogram: ${columnOption.fileName} - ${columnOption.columnName}`}
                  />
                );
              })}
              
              {Object.keys(selectedColumns).length === 0 && (
                <div className="col-span-2 flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No data available for histograms. Select a column and analyze the data.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Scatter Plots Tab */}
          <TabsContent value="scatterplots" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">X Axis Column:</h3>
                    <Select 
                      value={scatterplotConfig.x ? generateColumnKey(scatterplotConfig.x) : ""}
                      onValueChange={(value) => {
                        const option = columnOptions.find(opt => generateColumnKey(opt) === value);
                        if (option) {
                          setScatterplotConfig(prev => ({
                            ...prev,
                            x: option
                          }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select X axis column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columnOptions.map((option) => (
                          <SelectItem 
                            key={`x-${generateColumnKey(option)}`} 
                            value={generateColumnKey(option)}
                          >
                            {option.fileName} - {option.columnName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Y Axis Column:</h3>
                    <Select 
                      value={scatterplotConfig.y ? generateColumnKey(scatterplotConfig.y) : ""}
                      onValueChange={(value) => {
                        const option = columnOptions.find(opt => generateColumnKey(opt) === value);
                        if (option) {
                          setScatterplotConfig(prev => ({
                            ...prev,
                            y: option
                          }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Y axis column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columnOptions.map((option) => (
                          <SelectItem 
                            key={`y-${generateColumnKey(option)}`} 
                            value={generateColumnKey(option)}
                          >
                            {option.fileName} - {option.columnName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={() => {
                    if (scatterplotConfig.x && scatterplotConfig.y) {
                      const xFile = files.find(f => f.id === scatterplotConfig.x?.fileId);
                      const yFile = files.find(f => f.id === scatterplotConfig.y?.fileId);
                      
                      if (xFile && yFile) {
                        if (xFile.id !== yFile.id) {
                          toast.error("Both columns must be from the same file for scatter plots");
                          return;
                        }
                        
                        const scatterData = prepareScatterPlotData(
                          xFile.data,
                          scatterplotConfig.x.columnIndex,
                          scatterplotConfig.y.columnIndex
                        );
                        
                        setChartData(prev => ({
                          ...prev,
                          scatter: scatterData
                        }));
                      }
                    } else {
                      toast.error("Please select both X and Y axis columns");
                    }
                  }}
                  disabled={!scatterplotConfig.x || !scatterplotConfig.y}
                  className="w-full md:w-auto"
                >
                  Generate Scatter Plot
                </Button>
              </CardContent>
            </Card>
            
            {chartData.scatter && (
              <ScatterPlot 
                data={chartData.scatter} 
                title="Scatter Plot" 
                xLabel={scatterplotConfig.x?.columnName}
                yLabel={scatterplotConfig.y?.columnName}
              />
            )}
            
            {!chartData.scatter && (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  {columnOptions.length === 0 
                    ? "No numeric columns available for scatter plots." 
                    : "Select X and Y axis columns and generate a scatter plot."}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Empty state */}
      {files.length > 0 && Object.keys(summaries).length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Chart className="w-8 h-8 text-data-blue" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Analysis</h3>
          <p className="text-gray-500 mb-4 max-w-md">
            Select columns from your uploaded CSV files and click "Analyze Data" to generate statistics and visualizations.
          </p>
          <Button 
            onClick={performAnalysis}
            disabled={Object.keys(selectedColumns).length === 0}
            className="bg-data-purple hover:bg-data-violet"
          >
            Start Analysis
          </Button>
        </div>
      )}
    </div>
  );
};

export default DataAnalysis;

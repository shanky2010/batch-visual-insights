import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { BarChart3, Download, RefreshCw, X, FileText } from 'lucide-react';
import AnalysisCard from './AnalysisCard';
import BarChart from './visualizations/BarChart';
import PieChart from './visualizations/PieChart';
import Histogram from './visualizations/Histogram';
import ScatterPlot from './visualizations/ScatterPlot';
import TreeMap from './visualizations/TreeMap';
import DataComparison from './DataComparison';
import { 
  DataFile, 
  DatasetSummary,
  calculateStatistics, 
  getNumericColumns,
  prepareBarChartData,
  preparePieChartData,
  prepareHistogramData,
  prepareScatterPlotData,
  prepareTreeMapData,
  formatStatisticsForExport
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
  const [fileColumnMapping, setFileColumnMapping] = useState<{[fileId: string]: ColumnOption[]}>({});

  useEffect(() => {
    const options: ColumnOption[] = [];
    const mapping: {[fileId: string]: ColumnOption[]} = {};
    
    files.forEach(file => {
      const numericColumns = getNumericColumns(file.data, file.headers);
      mapping[file.id] = [];
      
      numericColumns.forEach(column => {
        const option = {
          fileId: file.id,
          fileName: file.name,
          columnIndex: column.index,
          columnName: column.name
        };
        options.push(option);
        mapping[file.id].push(option);
      });
    });
    
    setColumnOptions(options);
    setFileColumnMapping(mapping);
    
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

  const performAnalysis = () => {
    if (Object.keys(selectedColumns).length === 0) {
      toast.error("Please select at least one column to analyze");
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const newSummaries: {[key: string]: DatasetSummary} = {};
      const fileCharts: {[fileId: string]: any} = {};
      
      Object.entries(selectedColumns).forEach(([key, columnOption]) => {
        const file = files.find(f => f.id === columnOption.fileId);
        
        if (file) {
          const stats = calculateStatistics(file.data, columnOption.columnIndex);
          newSummaries[key] = {
            columnName: columnOption.columnName,
            ...stats
          };
          
          if (!fileCharts[file.id]) {
            const firstNonNumericColumn = file.headers.findIndex((_, idx) => {
              const columnValues = file.data.slice(1).map(row => row[idx]);
              const isAllNumeric = columnValues.every(val => !isNaN(parseFloat(val)));
              return !isAllNumeric;
            });
            
            const labelColumnIndex = firstNonNumericColumn !== -1 ? firstNonNumericColumn : 0;
            
            fileCharts[file.id] = {
              file,
              labelColumnIndex,
              columns: []
            };
          }
          
          fileCharts[file.id].columns.push({
            key,
            columnOption
          });
        }
      });
      
      setSummaries(newSummaries);
      
      if (Object.keys(fileCharts).length > 0) {
        const firstFileId = Object.keys(fileCharts)[0];
        const firstFileData = fileCharts[firstFileId];
        const firstColumnData = firstFileData.columns[0];
        
        if (firstFileData && firstColumnData) {
          const barData = prepareBarChartData(
            firstFileData.file.data, 
            firstFileData.labelColumnIndex, 
            firstColumnData.columnOption.columnIndex
          );
          
          const pieData = preparePieChartData(
            firstFileData.file.data, 
            firstFileData.labelColumnIndex, 
            firstColumnData.columnOption.columnIndex
          );
          
          const histogramData = prepareHistogramData(
            firstFileData.file.data,
            firstColumnData.columnOption.columnIndex
          );
          
          setChartData({
            bar: barData,
            pie: pieData,
            histogram: histogramData,
            scatter: null
          });
        }
      }
      
      if (scatterplotConfig.x && scatterplotConfig.y) {
        const xFile = files.find(f => f.id === scatterplotConfig.x?.fileId);
        const yFile = files.find(f => f.id === scatterplotConfig.y?.fileId);
        
        if (xFile && yFile && xFile.id === yFile.id) {
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

  const generateColumnKey = (columnOption: ColumnOption) => {
    return `${columnOption.fileId}-${columnOption.columnIndex}`;
  };

  const handleColumnSelect = (columnOption: ColumnOption) => {
    const key = generateColumnKey(columnOption);
    
    setSelectedColumns(prev => ({
      ...prev,
      [key]: columnOption
    }));
  };

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

  const exportResults = () => {
    try {
      const format = 'csv'; // Could add option for JSON or other formats later
      
      if (format === 'csv') {
        // Generate CSV content
        const csv = formatStatisticsForExport(summaries, selectedColumns);
        
        // Create and download the file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `data-analysis-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // JSON format - this is the original code
        const results: any = {
          statistics: {},
          timestamp: new Date().toISOString()
        };
        
        Object.entries(summaries).forEach(([key, summary]) => {
          const columnOption = selectedColumns[key];
          
          if (columnOption) {
            results.statistics[`${columnOption.fileName} - ${columnOption.columnName}`] = {
              mean: summary.mean,
              median: summary.median,
              min: summary.min,
              max: summary.max,
              standardDeviation: summary.stdDev,
              variance: summary.variance,
              count: summary.count
            };
          }
        });
        
        const jsonString = JSON.stringify(results, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `data-analysis-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      toast.success("Analysis results exported successfully");
    } catch (error) {
      console.error("Error exporting results:", error);
      toast.error("Failed to export results");
    }
  };

  const getSelectedColumnsByFile = () => {
    const grouped: {[fileId: string]: ColumnOption[]} = {};
    
    Object.values(selectedColumns).forEach(column => {
      if (!grouped[column.fileId]) {
        grouped[column.fileId] = [];
      }
      grouped[column.fileId].push(column);
    });
    
    return grouped;
  };

  return (
    <div className="space-y-6">
      <Card className="border-none bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl">
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
                    {files.map(file => (
                      <React.Fragment key={file.id}>
                        <SelectLabel className="pl-2 text-xs font-bold text-gray-500">
                          {file.name}
                        </SelectLabel>
                        {fileColumnMapping[file.id]?.map(option => (
                          <SelectItem
                            key={generateColumnKey(option)}
                            value={generateColumnKey(option)}
                          >
                            {option.columnName}
                          </SelectItem>
                        ))}
                      </React.Fragment>
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
              
              <Button
                variant="outline"
                className="flex items-center"
                onClick={() => {
                  const csvContent = formatStatisticsForExport(summaries, selectedColumns);
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `statistical-summary-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  
                  toast.success("Statistical summary exported as CSV");
                }}
                disabled={Object.keys(summaries).length === 0}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export as CSV
              </Button>
            </div>
            
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

      {Object.keys(summaries).length > 0 && (
        <Tabs
          defaultValue="statistics"
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full"
        >
          <TabsList className="mb-6 grid w-full grid-cols-6 bg-gradient-to-r from-gray-900 to-gray-800 p-1 rounded-xl">
            <TabsTrigger 
              value="statistics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Statistics
            </TabsTrigger>
            <TabsTrigger 
              value="barcharts"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Bar & Pie
            </TabsTrigger>
            <TabsTrigger 
              value="histograms"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Histograms
            </TabsTrigger>
            <TabsTrigger 
              value="scatterplots"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Scatter Plots
            </TabsTrigger>
            <TabsTrigger 
              value="treemap"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              TreeMap
            </TabsTrigger>
            <TabsTrigger 
              value="comparison"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Compare
            </TabsTrigger>
          </TabsList>
          
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
          
          <TabsContent value="barcharts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(getSelectedColumnsByFile()).map(([fileId, columns]) => {
                const file = files.find(f => f.id === fileId);
                if (!file || columns.length === 0) return null;
                
                const firstColumn = columns[0];
                const labelColumnIndex = file.headers.findIndex((_, idx) => {
                  const columnValues = file.data.slice(1).map(row => row[idx]);
                  const isAllNumeric = columnValues.every(val => !isNaN(parseFloat(val)));
                  return !isAllNumeric;
                });
                
                const actualLabelColumn = labelColumnIndex !== -1 ? labelColumnIndex : 0;
                
                const barData = prepareBarChartData(
                  file.data, 
                  actualLabelColumn, 
                  firstColumn.columnIndex
                );
                
                const pieData = preparePieChartData(
                  file.data, 
                  actualLabelColumn, 
                  firstColumn.columnIndex
                );
                
                return (
                  <React.Fragment key={`charts-${fileId}`}>
                    <BarChart 
                      data={barData} 
                      title={`Bar Chart: ${file.name} - ${firstColumn.columnName}`}
                    />
                    <PieChart 
                      data={pieData} 
                      title={`Pie Chart: ${file.name} - ${firstColumn.columnName}`}
                    />
                  </React.Fragment>
                );
              })}
              
              {Object.keys(getSelectedColumnsByFile()).length === 0 && (
                <div className="col-span-2 flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No data available for charts. Select a column and analyze the data.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="histograms" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(getSelectedColumnsByFile()).map(([fileId, columns]) => {
                const file = files.find(f => f.id === fileId);
                if (!file) return null;
                
                return columns.map(columnOption => {
                  const histogramData = prepareHistogramData(
                    file.data,
                    columnOption.columnIndex
                  );
                  
                  return (
                    <Histogram
                      key={`histogram-${generateColumnKey(columnOption)}`}
                      data={histogramData}
                      title={`Histogram: ${file.name} - ${columnOption.columnName}`}
                    />
                  );
                });
              })}
              
              {Object.keys(selectedColumns).length === 0 && (
                <div className="col-span-2 flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No data available for histograms. Select a column and analyze the data.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
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
          
          <TabsContent value="treemap" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {Object.entries(selectedColumns).map(([key, columnOption]) => {
                const file = files.find(f => f.id === columnOption.fileId);
                
                if (!file) return null;
                
                const treeMapData = prepareTreeMapData(
                  file.data,
                  columnOption.columnIndex
                );
                
                return (
                  <TreeMap
                    key={key}
                    data={treeMapData}
                    title={`TreeMap: ${columnOption.fileName} - ${columnOption.columnName}`}
                  />
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="comparison" className="space-y-6">
            <DataComparison 
              files={files}
              selectedColumns={selectedColumns}
            />
          </TabsContent>
        </Tabs>
      )}
      
      {files.length > 0 && Object.keys(summaries).length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg text-center text-white">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-data-blue" aria-hidden="true" />
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

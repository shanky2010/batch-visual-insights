
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DataFile, 
  DatasetSummary, 
  calculateStatistics, 
  formatStatisticsForExport,
  getNumericColumns,
  prepareHistogramData,
  prepareScatterPlotData
} from '@/utils/dataUtils';
import AnalysisCard from './AnalysisCard';
import OutlierDetection from './OutlierDetection';
import MissingValues from './MissingValues';
import Histogram from './visualizations/Histogram';
import ScatterPlot from './visualizations/ScatterPlot';
import { Button } from "@/components/ui/button";
import { 
  Download, 
  ChartBar, 
  ChartScatter, 
  CircleX,
  CirclePlus
} from 'lucide-react';
import { toast } from "@/components/ui/sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface DataAnalysisProps {
  files: DataFile[];
  selectedColumns: {[key: string]: any}; // Map of column keys to column options
}

const DataAnalysis: React.FC<DataAnalysisProps> = ({ files, selectedColumns }) => {
  const [summaries, setSummaries] = useState<{[key: string]: DatasetSummary}>({});
  const [activeTab, setActiveTab] = useState<string>('statistics');
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<{[fileId: string]: any[][]}>({});
  const [visualizationSettings, setVisualizationSettings] = useState({
    histogram: {
      color: '#4361EE',
      showLabels: true,
    },
    scatter: {
      xColumn: null as string | null,
      yColumn: null as string | null,
      pointColor: '#9B87F5',
      pointStroke: '#4E54C8',
      backgroundColor: 'from-newpurple-900 to-newblue-800',
      customDomain: false,
      xMin: 0,
      xMax: 100,
      yMin: 0,
      yMax: 100
    }
  });
  const [filteredData, setFilteredData] = useState<{[fileId: string]: any[][]}>({});

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

      // Find first two numeric columns for scatter plot default
      if (Object.keys(newSummaries).length >= 2) {
        setVisualizationSettings(prev => ({
          ...prev,
          scatter: {
            ...prev.scatter,
            xColumn: Object.keys(newSummaries)[0],
            yColumn: Object.keys(newSummaries)[1]
          }
        }));
      }
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
    if (!columnKey) return [];
    
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

  // Handle outlier removal
  const handleOutliersRemoved = (columnKey: string, cleanedValues: number[], removedIndices: number[]) => {
    if (!columnKey) return;
    
    const column = selectedColumns[columnKey];
    if (!column) return;
    
    const file = filesMap[column.fileId];
    if (!file) return;
    
    // Use processed data if available for this file, otherwise use original data
    const dataToUse = processedData[file.id] || file.data;
    
    // Create a set of indices to remove for O(1) lookup
    const indicesToRemove = new Set(removedIndices);
    
    // Filter out rows with outliers
    const headers = dataToUse[0];
    const filteredRows = dataToUse.slice(1).filter((_, index) => !indicesToRemove.has(index));
    const newData = [headers, ...filteredRows];
    
    // Update filtered data
    setFilteredData(prev => ({
      ...prev,
      [file.id]: newData
    }));

    // Notify user
    toast.success(`Removed ${removedIndices.length} outliers from ${file.name}`);
  };

  // Export filtered dataset
  const exportFilteredDataset = (fileId: string) => {
    const file = filesMap[fileId];
    if (!file) return;
    
    const dataToExport = filteredData[fileId];
    if (!dataToExport || dataToExport.length <= 1) {
      toast.info('No filtered data to export');
      return;
    }
    
    // Convert data to CSV
    const csv = dataToExport.map(row => row.join(',')).join('\n');
    
    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace(/\s+/g, '-').toLowerCase()}-filtered.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Filtered dataset exported as CSV');
  };

  // Prepare histogram data
  const getHistogramData = (columnKey: string) => {
    if (!columnKey) return null;
    
    const column = selectedColumns[columnKey];
    if (!column) return null;
    
    const file = filesMap[column.fileId];
    if (!file) return null;
    
    // Use processed data if available for this file, otherwise use original data
    const dataToUse = filteredData[file.id] || processedData[file.id] || file.data;
    
    return prepareHistogramData(dataToUse, column.columnIndex);
  };

  // Prepare scatter plot data
  const getScatterPlotData = () => {
    const { xColumn, yColumn } = visualizationSettings.scatter;
    if (!xColumn || !yColumn) return null;
    
    const xColumnData = selectedColumns[xColumn];
    const yColumnData = selectedColumns[yColumn];
    
    if (!xColumnData || !yColumnData) return null;
    
    // Both columns need to be from the same file
    if (xColumnData.fileId !== yColumnData.fileId) return null;
    
    const file = filesMap[xColumnData.fileId];
    if (!file) return null;
    
    // Use processed data if available for this file, otherwise use original data
    const dataToUse = filteredData[file.id] || processedData[file.id] || file.data;
    
    return prepareScatterPlotData(dataToUse, xColumnData.columnIndex, yColumnData.columnIndex);
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
          <TabsList className="grid grid-cols-5 w-[600px]">
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="outliers">Outliers</TabsTrigger>
            <TabsTrigger value="missing">Missing Values</TabsTrigger>
            <TabsTrigger value="histogram">Histogram</TabsTrigger>
            <TabsTrigger value="scatter">Scatter Plot</TabsTrigger>
          </TabsList>
          
          <TabsContent value="statistics" className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(summaries).map(([key, summary]) => {
                const column = selectedColumns[key];
                const file = filesMap[column?.fileId];
                
                if (!file || !column) return null;
                
                return (
                  <div 
                    key={key} 
                    onClick={() => setSelectedColumn(key)}
                    className={`cursor-pointer transition-all ${selectedColumn === key ? 'ring-2 ring-primary scale-[1.02]' : 'hover:scale-[1.01]'}`}
                  >
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
              <div className="space-y-6">
                <OutlierDetection
                  fileName={filesMap[selectedColumns[selectedColumn]?.fileId]?.name || ''}
                  columnName={summaries[selectedColumn]?.columnName || ''}
                  columnValues={getColumnValues(selectedColumn)}
                  onOutliersRemoved={(cleaned, removed) => handleOutliersRemoved(selectedColumn, cleaned, removed)}
                />
                
                {filteredData[selectedColumns[selectedColumn]?.fileId] && (
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => exportFilteredDataset(selectedColumns[selectedColumn].fileId)}
                      className="ml-auto"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Filtered Dataset
                    </Button>
                  </div>
                )}
              </div>
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
          
          <TabsContent value="histogram" className="space-y-4 pt-2">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Histogram Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="column-select">Select Column</Label>
                      <Select 
                        value={selectedColumn || ''} 
                        onValueChange={(value) => setSelectedColumn(value)}
                      >
                        <SelectTrigger id="column-select">
                          <SelectValue placeholder="Select a column" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(summaries).map(([key, summary]) => (
                            <SelectItem key={key} value={key}>
                              {summary.columnName} ({filesMap[selectedColumns[key].fileId].name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="show-labels" className="flex-grow">Show Labels</Label>
                      <Switch 
                        id="show-labels" 
                        checked={visualizationSettings.histogram.showLabels}
                        onCheckedChange={(checked) => setVisualizationSettings(prev => ({
                          ...prev,
                          histogram: {
                            ...prev.histogram,
                            showLabels: checked
                          }
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="color-picker">Bar Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input 
                          id="color-picker"
                          type="color" 
                          value={visualizationSettings.histogram.color}
                          onChange={(e) => setVisualizationSettings(prev => ({
                            ...prev,
                            histogram: {
                              ...prev.histogram,
                              color: e.target.value
                            }
                          }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input 
                          type="text" 
                          value={visualizationSettings.histogram.color}
                          onChange={(e) => setVisualizationSettings(prev => ({
                            ...prev,
                            histogram: {
                              ...prev.histogram,
                              color: e.target.value
                            }
                          }))}
                          className="w-32"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {selectedColumn && (
              <Histogram 
                data={getHistogramData(selectedColumn) || { labels: [], datasets: [{ label: '', data: [] }] }}
                title={`Histogram: ${summaries[selectedColumn]?.columnName || 'Selected Column'}`}
                customColor={visualizationSettings.histogram.color}
                showLabels={visualizationSettings.histogram.showLabels}
              />
            )}
            
            {!selectedColumn && (
              <div className="text-center p-8 text-gray-500">
                {Object.keys(summaries).length > 0 
                  ? "Select a column to generate histogram" 
                  : "Calculate statistics first to generate histograms"}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="scatter" className="space-y-4 pt-2">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Scatter Plot Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="x-column">X Axis Column</Label>
                      <Select 
                        value={visualizationSettings.scatter.xColumn || ''} 
                        onValueChange={(value) => setVisualizationSettings(prev => ({
                          ...prev,
                          scatter: {
                            ...prev.scatter,
                            xColumn: value
                          }
                        }))}
                      >
                        <SelectTrigger id="x-column">
                          <SelectValue placeholder="Select X axis column" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(summaries).map(([key, summary]) => (
                            <SelectItem key={key} value={key}>
                              {summary.columnName} ({filesMap[selectedColumns[key].fileId].name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="y-column">Y Axis Column</Label>
                      <Select 
                        value={visualizationSettings.scatter.yColumn || ''} 
                        onValueChange={(value) => setVisualizationSettings(prev => ({
                          ...prev,
                          scatter: {
                            ...prev.scatter,
                            yColumn: value
                          }
                        }))}
                      >
                        <SelectTrigger id="y-column">
                          <SelectValue placeholder="Select Y axis column" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(summaries).map(([key, summary]) => (
                            <SelectItem key={key} value={key}>
                              {summary.columnName} ({filesMap[selectedColumns[key].fileId].name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="custom-domain" className="flex-grow">Custom Domain Range</Label>
                      <Switch 
                        id="custom-domain" 
                        checked={visualizationSettings.scatter.customDomain}
                        onCheckedChange={(checked) => setVisualizationSettings(prev => ({
                          ...prev,
                          scatter: {
                            ...prev.scatter,
                            customDomain: checked
                          }
                        }))}
                      />
                    </div>
                    
                    {visualizationSettings.scatter.customDomain && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="x-min">X Min</Label>
                          <Input 
                            id="x-min"
                            type="number"
                            value={visualizationSettings.scatter.xMin}
                            onChange={(e) => setVisualizationSettings(prev => ({
                              ...prev,
                              scatter: {
                                ...prev.scatter,
                                xMin: parseFloat(e.target.value)
                              }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="x-max">X Max</Label>
                          <Input 
                            id="x-max"
                            type="number"
                            value={visualizationSettings.scatter.xMax}
                            onChange={(e) => setVisualizationSettings(prev => ({
                              ...prev,
                              scatter: {
                                ...prev.scatter,
                                xMax: parseFloat(e.target.value)
                              }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="y-min">Y Min</Label>
                          <Input 
                            id="y-min"
                            type="number"
                            value={visualizationSettings.scatter.yMin}
                            onChange={(e) => setVisualizationSettings(prev => ({
                              ...prev,
                              scatter: {
                                ...prev.scatter,
                                yMin: parseFloat(e.target.value)
                              }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="y-max">Y Max</Label>
                          <Input 
                            id="y-max"
                            type="number"
                            value={visualizationSettings.scatter.yMax}
                            onChange={(e) => setVisualizationSettings(prev => ({
                              ...prev,
                              scatter: {
                                ...prev.scatter,
                                yMax: parseFloat(e.target.value)
                              }
                            }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="point-color">Point Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input 
                          id="point-color"
                          type="color" 
                          value={visualizationSettings.scatter.pointColor}
                          onChange={(e) => setVisualizationSettings(prev => ({
                            ...prev,
                            scatter: {
                              ...prev.scatter,
                              pointColor: e.target.value
                            }
                          }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input 
                          type="text" 
                          value={visualizationSettings.scatter.pointColor}
                          onChange={(e) => setVisualizationSettings(prev => ({
                            ...prev,
                            scatter: {
                              ...prev.scatter,
                              pointColor: e.target.value
                            }
                          }))}
                          className="w-32"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="stroke-color">Point Stroke Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input 
                          id="stroke-color"
                          type="color" 
                          value={visualizationSettings.scatter.pointStroke}
                          onChange={(e) => setVisualizationSettings(prev => ({
                            ...prev,
                            scatter: {
                              ...prev.scatter,
                              pointStroke: e.target.value
                            }
                          }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input 
                          type="text" 
                          value={visualizationSettings.scatter.pointStroke}
                          onChange={(e) => setVisualizationSettings(prev => ({
                            ...prev,
                            scatter: {
                              ...prev.scatter,
                              pointStroke: e.target.value
                            }
                          }))}
                          className="w-32"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="background">Background Style</Label>
                      <Select 
                        value={visualizationSettings.scatter.backgroundColor}
                        onValueChange={(value) => setVisualizationSettings(prev => ({
                          ...prev,
                          scatter: {
                            ...prev.scatter,
                            backgroundColor: value
                          }
                        }))}
                      >
                        <SelectTrigger id="background">
                          <SelectValue placeholder="Select background style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="from-newpurple-900 to-newblue-800">Purple to Blue</SelectItem>
                          <SelectItem value="from-red-900 to-orange-800">Red to Orange</SelectItem>
                          <SelectItem value="from-green-900 to-teal-800">Green to Teal</SelectItem>
                          <SelectItem value="from-gray-900 to-gray-700">Monochrome Dark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {visualizationSettings.scatter.xColumn && visualizationSettings.scatter.yColumn ? (
              <ScatterPlot 
                data={getScatterPlotData() || { datasets: [{ data: [] }] }}
                title={`Scatter Plot: ${summaries[visualizationSettings.scatter.xColumn]?.columnName || 'X'} vs ${summaries[visualizationSettings.scatter.yColumn]?.columnName || 'Y'}`}
                xLabel={summaries[visualizationSettings.scatter.xColumn]?.columnName || 'X'}
                yLabel={summaries[visualizationSettings.scatter.yColumn]?.columnName || 'Y'}
                customColors={{
                  pointColor: visualizationSettings.scatter.pointColor,
                  pointStroke: visualizationSettings.scatter.pointStroke,
                  backgroundColor: visualizationSettings.scatter.backgroundColor
                }}
                domainRange={visualizationSettings.scatter.customDomain ? {
                  xMin: visualizationSettings.scatter.xMin,
                  xMax: visualizationSettings.scatter.xMax,
                  yMin: visualizationSettings.scatter.yMin,
                  yMax: visualizationSettings.scatter.yMax
                } : undefined}
              />
            ) : (
              <div className="text-center p-8 text-gray-500">
                {Object.keys(summaries).length > 0 
                  ? "Select X and Y columns to generate scatter plot" 
                  : "Calculate statistics first to create scatter plots"}
              </div>
            )}
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

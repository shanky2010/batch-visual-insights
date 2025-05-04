import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from "@/components/ui/sonner";
import { 
  ComparisonResult,
  DataFile, 
  compareDatasets, 
  generateComparisonTableData
} from '@/utils/dataUtils';

interface DataComparisonProps {
  files: DataFile[];
  selectedColumns: {[key: string]: any}; // Map of column keys to column options
}

const DataComparison: React.FC<DataComparisonProps> = ({ files, selectedColumns }) => {
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const generateComparison = () => {
    if (files.length < 2) {
      toast.error("You need at least two datasets to compare");
      return;
    }

    setIsComparing(true);

    try {
      // Group selected columns by file
      const fileColumnMapping: {[fileId: string]: number[]} = {};
      
      Object.values(selectedColumns).forEach(column => {
        if (!fileColumnMapping[column.fileId]) {
          fileColumnMapping[column.fileId] = [];
        }
        fileColumnMapping[column.fileId].push(column.columnIndex);
      });

      // Prepare datasets for comparison
      const datasetsToCompare = files
        .filter(file => fileColumnMapping[file.id] && fileColumnMapping[file.id].length > 0)
        .map(file => ({
          id: file.id,
          name: file.name,
          data: file.data,
          headers: file.headers,
          columnIndices: fileColumnMapping[file.id] || []
        }));

      if (datasetsToCompare.length < 2) {
        toast.error("Please select columns from at least two different datasets");
        setIsComparing(false);
        return;
      }

      // Perform comparison
      const results = compareDatasets(datasetsToCompare);
      setComparisonResults(results);
      
      // Generate table data
      const data = generateComparisonTableData(results);
      setTableData(data);
      
      toast.success(`Compared ${datasetsToCompare.length} datasets successfully`);
    } catch (error) {
      console.error("Error comparing datasets:", error);
      toast.error("Failed to compare datasets");
    } finally {
      setIsComparing(false);
    }
  };

  const handleSort = (field: string) => {
    setSortField(field);
    setSortDirection(current => (sortField === field && current === 'asc') ? 'desc' : 'asc');
    
    // Sort table data
    const sorted = [...tableData].sort((a, b) => {
      const valA = a[field];
      const valB = b[field];
      
      // Handle string comparison
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      
      // Handle numeric comparison (including formatted strings)
      const numA = typeof valA === 'string' ? parseFloat(valA.replace(/[+]/g, '')) : valA;
      const numB = typeof valB === 'string' ? parseFloat(valB.replace(/[+]/g, '')) : valB;
      
      // Handle non-numeric values
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });
    
    setTableData(sorted);
  };
  
  const exportComparison = () => {
    try {
      let csv = "Column Name,";
      
      // Get all unique dataset names
      const datasetNames = new Set<string>();
      comparisonResults.forEach(result => {
        result.datasets.forEach(ds => {
          datasetNames.add(ds.datasetName);
        });
      });
      
      // Create header row
      const datasets = Array.from(datasetNames);
      datasets.forEach(dsName => {
        csv += `${dsName} (Mean),${dsName} (Median),${dsName} (StdDev),${dsName} (Min),${dsName} (Max),`;
      });
      
      if (datasets.length === 2) {
        csv += "Difference (Mean),Difference (Median),Difference (StdDev),Difference (Min),Difference (Max)";
      }
      
      csv += "\n";
      
      // Add data rows
      comparisonResults.forEach(result => {
        csv += `"${result.columnName}",`;
        
        // Add each dataset's statistics
        datasets.forEach(dsName => {
          const dataset = result.datasets.find(ds => ds.datasetName === dsName);
          if (dataset) {
            const stats = dataset.stats;
            csv += `${stats.mean !== null ? stats.mean : 'N/A'},`;
            csv += `${stats.median !== null ? stats.median : 'N/A'},`;
            csv += `${stats.stdDev !== null ? stats.stdDev : 'N/A'},`;
            csv += `${stats.min !== null ? stats.min : 'N/A'},`;
            csv += `${stats.max !== null ? stats.max : 'N/A'},`;
          } else {
            csv += "N/A,N/A,N/A,N/A,N/A,";
          }
        });
        
        // Add differences if available
        if (result.differences.length > 0 && datasets.length === 2) {
          const diff = result.differences[0];
          csv += `${diff.mean},${diff.median},${diff.stdDev},${diff.min},${diff.max}`;
        }
        
        csv += "\n";
      });
      
      // Create and download the CSV file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dataset-comparison-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Comparison exported as CSV");
    } catch (error) {
      console.error("Error exporting comparison:", error);
      toast.error("Failed to export comparison");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="ml-2 h-4 w-4" />
      : <ChevronDown className="ml-2 h-4 w-4" />;
  };

  // Helper to style cells based on differences
  const getCellStyle = (field: string, value: string | number) => {
    if (!field.startsWith('diff-')) return "";
    
    // Remove + symbol for numeric comparison but keep it for display
    const numValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[+]/g, '')) 
      : value;
    
    if (isNaN(numValue) || numValue === 0) return "text-gray-500";
    if (numValue > 0) return "text-green-600 font-medium";
    return "text-red-600 font-medium";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Dataset Comparison</h2>
        <div className="flex gap-2">
          <Button 
            onClick={generateComparison}
            disabled={isComparing || Object.keys(selectedColumns).length === 0 || files.length < 2}
            variant="default"
          >
            {isComparing ? 'Comparing...' : 'Compare Selected Columns'}
          </Button>
          
          <Button
            onClick={exportComparison}
            disabled={comparisonResults.length === 0}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Comparison
          </Button>
        </div>
      </div>
      
      {tableData.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Comparison Results</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('columnName')}
                  >
                    Column Name {getSortIcon('columnName')}
                  </TableHead>
                  
                  {/* Dynamic headers for datasets */}
                  {comparisonResults[0]?.datasets.map(dataset => (
                    <React.Fragment key={dataset.datasetId}>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort(`${dataset.datasetName}-mean`)}
                      >
                        {dataset.datasetName} Mean {getSortIcon(`${dataset.datasetName}-mean`)}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort(`${dataset.datasetName}-median`)}
                      >
                        {dataset.datasetName} Median {getSortIcon(`${dataset.datasetName}-median`)}
                      </TableHead>
                      <TableHead>StdDev</TableHead>
                      <TableHead>Min</TableHead>
                      <TableHead>Max</TableHead>
                    </React.Fragment>
                  ))}
                  
                  {/* Show difference columns if there are exactly 2 datasets */}
                  {comparisonResults[0]?.differences.length > 0 && (
                    <>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('diff-mean')}
                      >
                        Mean Diff {getSortIcon('diff-mean')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('diff-median')}
                      >
                        Median Diff {getSortIcon('diff-median')}
                      </TableHead>
                      <TableHead>StdDev Diff</TableHead>
                      <TableHead>Min Diff</TableHead>
                      <TableHead>Max Diff</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.columnName}</TableCell>
                    
                    {/* Dynamic cells for each dataset */}
                    {Object.keys(row).filter(key => key !== 'columnName' && !key.startsWith('diff-')).map(key => (
                      <TableCell key={key}>{row[key]}</TableCell>
                    ))}
                    
                    {/* Difference cells if available */}
                    {Object.keys(row).filter(key => key.startsWith('diff-')).map(key => (
                      <TableCell 
                        key={key}
                        className={getCellStyle(key, row[key])}
                      >
                        {row[key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">
              {files.length < 2 
                ? "You need at least two datasets to compare" 
                : Object.keys(selectedColumns).length === 0 
                  ? "Select columns to compare" 
                  : "Click 'Compare Selected Columns' to generate a comparison"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataComparison;

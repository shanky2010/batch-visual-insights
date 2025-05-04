/**
 * Utility functions for data processing
 */

export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  rowIndex?: number;
  colIndex?: number;
}

export interface FileValidation {
  isValid: boolean;
  issues: ValidationIssue[];
  hasDuplicateRows: boolean;
  hasMissingValues: boolean;
  hasInconsistentColumns: boolean;
}

export interface DataFile {
  id: string;
  name: string;
  content: string;
  data: any[][];
  headers: string[];
  parsed: boolean;
  fileSize?: number;
  dateAdded?: string;
  validation?: FileValidation;
}

export interface DatasetSummary {
  columnName: string;
  mean: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  stdDev: number | null;
  variance: number | null;
  quartiles?: {
    q1: number | null;
    q3: number | null;
  };
  count?: number;
  skewness?: number | null;
  kurtosis?: number | null;
}

export interface ComparisonResult {
  columnName: string;
  datasets: {
    datasetId: string;
    datasetName: string;
    stats: DatasetSummary;
  }[];
  differences: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    variance: number;
  }[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// Parse CSV string into a 2D array
export const parseCSV = (csv: string): any[][] => {
  const lines = csv.trim().split('\n');
  return lines.map(line => {
    // Handle quoted fields that may contain commas
    const arr: string[] = [];
    let inQuotes = false;
    let currentField = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        arr.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    arr.push(currentField.trim());
    return arr;
  });
};

// Check if a value is numeric
export const isNumeric = (value: string): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(Number(value));
};

// Get numeric columns from data
export const getNumericColumns = (data: any[][], headers: string[]): { index: number; name: string }[] => {
  if (data.length <= 1) return [];
  
  const numericColumns: { index: number; name: string }[] = [];
  
  // Skip header row (first row)
  for (let colIndex = 0; colIndex < data[0].length; colIndex++) {
    let isColumnNumeric = true;
    
    // Check if all values in the column are numeric (starting from second row)
    for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
      if (!data[rowIndex][colIndex] || !isNumeric(data[rowIndex][colIndex])) {
        isColumnNumeric = false;
        break;
      }
    }
    
    if (isColumnNumeric) {
      numericColumns.push({
        index: colIndex,
        name: headers[colIndex] || `Column ${colIndex + 1}`
      });
    }
  }
  
  return numericColumns;
};

// Calculate basic statistics for a dataset
export const calculateStatistics = (
  data: any[][], 
  columnIndex: number
): DatasetSummary => {
  // Extract numeric values from the column (skip header row)
  const values = data.slice(1).map(row => parseFloat(row[columnIndex])).filter(val => !isNaN(val));
  const columnName = data[0][columnIndex] || `Column ${columnIndex + 1}`;
  
  if (values.length === 0) {
    return { 
      columnName,
      mean: null, 
      median: null, 
      min: null, 
      max: null, 
      stdDev: null, 
      variance: null,
      quartiles: { q1: null, q3: null },
      count: 0,
      skewness: null,
      kurtosis: null
    };
  }
  
  // Calculate mean
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;
  
  // Calculate median
  const sortedValues = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sortedValues.length / 2);
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[middle - 1] + sortedValues[middle]) / 2
    : sortedValues[middle];
  
  // Calculate min and max
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Calculate quartiles
  const q1Index = Math.floor(sortedValues.length * 0.25);
  const q3Index = Math.floor(sortedValues.length * 0.75);
  const q1 = sortedValues[q1Index];
  const q3 = sortedValues[q3Index];
  
  // Calculate standard deviation and variance
  const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate skewness (measure of asymmetry)
  const cubedDifferences = values.map(val => Math.pow((val - mean) / stdDev, 3));
  const skewness = cubedDifferences.reduce((acc, val) => acc + val, 0) / values.length;
  
  // Calculate kurtosis (measure of "tailedness")
  const fourthPowerDifferences = values.map(val => Math.pow((val - mean) / stdDev, 4));
  const kurtosis = fourthPowerDifferences.reduce((acc, val) => acc + val, 0) / values.length - 3; // Excess kurtosis
  
  return { 
    columnName,
    mean, 
    median, 
    min, 
    max, 
    stdDev, 
    variance,
    quartiles: { q1, q3 },
    count: values.length,
    skewness,
    kurtosis
  };
};

// Compare statistics between datasets
export const compareDatasets = (
  datasets: {
    id: string;
    name: string;
    data: any[][];
    headers: string[];
    columnIndices: number[];
  }[]
): ComparisonResult[] => {
  if (datasets.length === 0) return [];
  
  // Get all column names from all datasets
  const allColumns: Map<string, Set<string>> = new Map();
  
  datasets.forEach(dataset => {
    dataset.columnIndices.forEach(columnIdx => {
      const columnName = dataset.headers[columnIdx] || `Column ${columnIdx + 1}`;
      if (!allColumns.has(columnName)) {
        allColumns.set(columnName, new Set());
      }
      allColumns.get(columnName)?.add(dataset.id);
    });
  });
  
  // Generate comparison results
  const results: ComparisonResult[] = [];
  
  for (const [columnName, datasetIds] of allColumns.entries()) {
    if (datasetIds.size < 2) continue; // Need at least 2 datasets to compare
    
    const datasetsWithColumn = datasets.filter(ds => 
      datasetIds.has(ds.id) && 
      ds.headers.includes(columnName)
    );
    
    const datasetStats = datasetsWithColumn.map(ds => {
      const columnIdx = ds.headers.indexOf(columnName);
      const stats = calculateStatistics(ds.data, columnIdx);
      
      return {
        datasetId: ds.id,
        datasetName: ds.name,
        stats
      };
    });
    
    // Calculate differences (if there are exactly 2 datasets)
    const differences = [];
    
    if (datasetStats.length === 2) {
      const ds1 = datasetStats[0].stats;
      const ds2 = datasetStats[1].stats;
      
      differences.push({
        mean: calculateDifference(ds1.mean, ds2.mean),
        median: calculateDifference(ds1.median, ds2.median),
        stdDev: calculateDifference(ds1.stdDev, ds2.stdDev),
        min: calculateDifference(ds1.min, ds2.min),
        max: calculateDifference(ds1.max, ds2.max),
        variance: calculateDifference(ds1.variance, ds2.variance)
      });
    }
    
    results.push({
      columnName,
      datasets: datasetStats,
      differences
    });
  }
  
  return results;
};

// Helper function to calculate difference between two values that might be null
const calculateDifference = (val1: number | null, val2: number | null): number => {
  if (val1 === null || val2 === null) return 0;
  return val1 - val2;
};

// Format a statistics summary for export
export const formatStatisticsForExport = (
  summaries: { [key: string]: DatasetSummary },
  selectedColumns: any
): string => {
  let csv = "Column Name,File Name,Mean,Median,Min,Max,Standard Deviation,Variance,Count\n";
  
  Object.entries(summaries).forEach(([key, summary]) => {
    const columnOption = selectedColumns[key];
    if (columnOption) {
      csv += `"${summary.columnName}","${columnOption.fileName}",${formatValue(summary.mean)},${formatValue(summary.median)},${formatValue(summary.min)},${formatValue(summary.max)},${formatValue(summary.stdDev)},${formatValue(summary.variance)},${summary.count || 'N/A'}\n`;
    }
  });
  
  return csv;
};

// Helper function to format values for export
const formatValue = (value: number | null): string => {
  if (value === null) return "N/A";
  if (Math.abs(value) < 0.0001) return value.toExponential(4);
  return value.toString();
};

// Detect outliers using IQR method
export const detectOutliersIQR = (data: number[]): { outliers: number[]; outlierIndices: number[] } => {
  const sortedData = [...data].sort((a, b) => a - b);
  const q1Index = Math.floor(sortedData.length * 0.25);
  const q3Index = Math.floor(sortedData.length * 0.75);
  
  const q1 = sortedData[q1Index];
  const q3 = sortedData[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  const outliers: number[] = [];
  const outlierIndices: number[] = [];
  
  data.forEach((value, index) => {
    if (value < lowerBound || value > upperBound) {
      outliers.push(value);
      outlierIndices.push(index);
    }
  });
  
  return { outliers, outlierIndices };
};

// Detect outliers using Z-score method
export const detectOutliersZScore = (data: number[], threshold = 3): { outliers: number[]; outlierIndices: number[] } => {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  
  const squaredDifferences = data.map(val => Math.pow(val - mean, 2));
  const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  const outliers: number[] = [];
  const outlierIndices: number[] = [];
  
  data.forEach((value, index) => {
    const zScore = Math.abs((value - mean) / stdDev);
    if (zScore > threshold) {
      outliers.push(value);
      outlierIndices.push(index);
    }
  });
  
  return { outliers, outlierIndices };
};

// Calculate correlation between two columns
export const calculateCorrelation = (xValues: number[], yValues: number[]): number => {
  if (xValues.length !== yValues.length || xValues.length === 0) {
    return 0;
  }
  
  const n = xValues.length;
  
  // Calculate means
  const xMean = xValues.reduce((sum, val) => sum + val, 0) / n;
  const yMean = yValues.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate the numerator (covariance * n)
  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
  }
  
  // Calculate the denominator
  let xSumSquares = 0;
  let ySumSquares = 0;
  
  for (let i = 0; i < n; i++) {
    xSumSquares += Math.pow(xValues[i] - xMean, 2);
    ySumSquares += Math.pow(yValues[i] - yMean, 2);
  }
  
  const denominator = Math.sqrt(xSumSquares * ySumSquares);
  
  if (denominator === 0) {
    return 0; // Avoid division by zero
  }
  
  return numerator / denominator;
};

// Calculate correlation matrix for multiple columns
export const calculateCorrelationMatrix = (data: any[][], columnIndices: number[]): number[][] => {
  // Extract numeric values for each column (skip header row)
  const columnValues = columnIndices.map(colIndex => 
    data.slice(1).map(row => parseFloat(row[colIndex])).filter(val => !isNaN(val))
  );
  
  const n = columnIndices.length;
  const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    // Diagonal elements are always 1
    matrix[i][i] = 1;
    
    // Calculate correlation for each pair
    for (let j = i + 1; j < n; j++) {
      const correlation = calculateCorrelation(columnValues[i], columnValues[j]);
      matrix[i][j] = correlation;
      matrix[j][i] = correlation; // Correlation matrix is symmetric
    }
  }
  
  return matrix;
};

// Remove duplicate rows from data
export const removeDuplicateRows = (data: any[][]): any[][] => {
  if (data.length <= 1) return data;
  
  const headers = data[0];
  const uniqueRows = new Map<string, any[]>();
  
  // Add header row
  const result = [headers];
  
  // Process data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowStr = JSON.stringify(row);
    
    if (!uniqueRows.has(rowStr)) {
      uniqueRows.set(rowStr, row);
      result.push(row);
    }
  }
  
  return result;
};

// Handle missing values
export const handleMissingValues = (
  data: any[][], 
  method: 'remove' | 'mean' | 'median' | 'value', 
  replacementValue?: any
): any[][] => {
  if (data.length <= 1) return data;
  
  const headers = data[0];
  const result = [headers];
  
  // For mean/median replacement, calculate values for each column
  const columnStats: {[colIndex: number]: {mean: number, median: number}} = {};
  
  if (method === 'mean' || method === 'median') {
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const colValues = data.slice(1)
        .map(row => row[colIndex])
        .filter(val => val !== undefined && val !== null && val !== '')
        .map(val => isNumeric(val) ? parseFloat(val) : val);
      
      const numericValues = colValues.filter(val => typeof val === 'number' && !isNaN(val));
      
      if (numericValues.length > 0) {
        const sum = numericValues.reduce((acc, val) => acc + val, 0);
        const mean = sum / numericValues.length;
        
        const sortedValues = [...numericValues].sort((a, b) => a - b);
        const medianIndex = Math.floor(sortedValues.length / 2);
        const median = sortedValues.length % 2 === 0
          ? (sortedValues[medianIndex - 1] + sortedValues[medianIndex]) / 2
          : sortedValues[medianIndex];
          
        columnStats[colIndex] = { mean, median };
      }
    }
  }
  
  // Process data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const newRow = [...row];
    let hasMissingValues = false;
    
    // Check for missing values in this row
    for (let j = 0; j < row.length; j++) {
      const val = row[j];
      if (val === undefined || val === null || val === '') {
        hasMissingValues = true;
        
        // Replace based on method
        if (method === 'mean' && columnStats[j]) {
          newRow[j] = columnStats[j].mean;
        } else if (method === 'median' && columnStats[j]) {
          newRow[j] = columnStats[j].median;
        } else if (method === 'value' && replacementValue !== undefined) {
          newRow[j] = replacementValue;
        }
      }
    }
    
    // Add row to result if it should be kept
    if (method !== 'remove' || !hasMissingValues) {
      result.push(newRow);
    }
  }
  
  return result;
};

// Prepare data for a bar chart
export const prepareBarChartData = (
  data: any[][], 
  labelColumnIndex: number, 
  valueColumnIndex: number,
  limit: number = 10
): ChartData => {
  // Skip header row and extract data
  const extractedData = data.slice(1, limit + 1).map(row => ({
    label: row[labelColumnIndex], 
    value: parseFloat(row[valueColumnIndex])
  }));
  
  // Filter out non-numeric values and sort by value
  const filteredData = extractedData
    .filter(item => !isNaN(item.value))
    .sort((a, b) => b.value - a.value);
  
  // Remove duplicates based on label (keep the first occurrence which has highest value due to sorting)
  const uniqueData = filteredData.reduce((acc: typeof filteredData, current) => {
    if (!acc.find(item => item.label === current.label)) {
      acc.push(current);
    }
    return acc;
  }, []);
  
  // Limit to specified number of items after deduplication
  const limitedData = uniqueData.slice(0, limit);
  
  // Prepare labels and data for the chart
  const labels = limitedData.map(item => item.label);
  const values = limitedData.map(item => item.value);
  
  // Enhanced color palette
  const colors = [
    '#4361EE', '#3A0CA3', '#7209B7', '#F72585', '#4CC9F0', 
    '#560BAD', '#480CA8', '#3A0CA3', '#3F37C9', '#4361EE'
  ];
  
  return {
    labels,
    datasets: [
      {
        label: 'Value',
        data: values,
        backgroundColor: colors.slice(0, values.length),
        borderColor: colors.slice(0, values.length).map(color => color.replace('1)', '0.8)')),
        borderWidth: 1
      }
    ]
  };
};

// Prepare data for a pie chart
export const preparePieChartData = (
  data: any[][], 
  labelColumnIndex: number, 
  valueColumnIndex: number,
  limit: number = 8
): ChartData => {
  // Skip header row and extract data
  const extractedData = data.slice(1, limit + 1).map(row => ({
    label: row[labelColumnIndex], 
    value: parseFloat(row[valueColumnIndex])
  }));
  
  // Filter out non-numeric values and sort by value
  const filteredData = extractedData
    .filter(item => !isNaN(item.value))
    .sort((a, b) => b.value - a.value);
  
  // Remove duplicates based on label (keep the first occurrence which has highest value due to sorting)
  const uniqueData = filteredData.reduce((acc: typeof filteredData, current) => {
    if (!acc.find(item => item.label === current.label)) {
      acc.push(current);
    }
    return acc;
  }, []);
  
  // Limit to specified number of items after deduplication
  const limitedData = uniqueData.slice(0, limit);
  
  // Calculate total for percentage
  const total = limitedData.reduce((sum, item) => sum + item.value, 0);
  
  // Filter out items less than 1% and combine them into "Others"
  const significantData = limitedData.filter(item => (item.value / total) >= 0.01);
  const otherSum = limitedData
    .filter(item => (item.value / total) < 0.01)
    .reduce((sum, item) => sum + item.value, 0);
  
  if (otherSum > 0) {
    significantData.push({ label: 'Others', value: otherSum });
  }
  
  // Prepare labels and data for the chart
  const labels = significantData.map(item => item.label);
  const values = significantData.map(item => item.value);
  
  // Enhanced color palette
  const colors = [
    '#4361EE', '#3A0CA3', '#7209B7', '#F72585', '#4CC9F0', 
    '#560BAD', '#480CA8', '#3A0CA3'
  ];
  
  return {
    labels,
    datasets: [
      {
        label: 'Value',
        data: values,
        backgroundColor: colors.slice(0, values.length)
      }
    ]
  };
};

// Prepare data for a histogram
export const prepareHistogramData = (
  data: any[][], 
  columnIndex: number,
  bins: number = 10
): ChartData => {
  // Extract numeric values from the column (skip header row)
  const values = data.slice(1).map(row => parseFloat(row[columnIndex])).filter(val => !isNaN(val));
  
  if (values.length === 0) {
    return { labels: [], datasets: [{ label: 'Frequency', data: [] }] };
  }
  
  // Calculate min and max
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Calculate bin width
  const binWidth = (max - min) / bins;
  
  // Initialize bins
  const histogram = Array(bins).fill(0);
  const binLabels = Array(bins).fill('');
  
  // Fill the bins
  for (let i = 0; i < bins; i++) {
    const lowerBound = min + i * binWidth;
    const upperBound = min + (i + 1) * binWidth;
    binLabels[i] = `${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)}`;
  }
  
  // Count values in each bin
  values.forEach(value => {
    if (value === max) {
      // Edge case: if value is max, put it in the last bin
      histogram[bins - 1]++;
    } else {
      const binIndex = Math.floor((value - min) / binWidth);
      histogram[binIndex]++;
    }
  });
  
  return {
    labels: binLabels,
    datasets: [
      {
        label: 'Frequency',
        data: histogram,
        backgroundColor: '#4361EE',
        borderColor: '#3A0CA3',
        borderWidth: 1
      }
    ]
  };
};

// Prepare data for a scatter plot
export const prepareScatterPlotData = (
  data: any[][], 
  xColumnIndex: number,
  yColumnIndex: number,
  limit: number = 100
): any => {
  // Skip header row and extract data
  const points = data.slice(1, limit + 1).map(row => ({
    x: parseFloat(row[xColumnIndex]),
    y: parseFloat(row[yColumnIndex])
  }));
  
  // Filter out non-numeric values
  const filteredPoints = points.filter(point => !isNaN(point.x) && !isNaN(point.y));
  
  // Remove duplicate points (points with same x and y values)
  const uniquePoints = filteredPoints.reduce((acc: typeof filteredPoints, current) => {
    if (!acc.find(point => point.x === current.x && point.y === current.y)) {
      acc.push(current);
    }
    return acc;
  }, []);
  
  // Limit to specified number of points after deduplication
  const limitedPoints = uniquePoints.slice(0, limit);
  
  return {
    datasets: [
      {
        label: 'Data Points',
        data: limitedPoints,
        backgroundColor: ['#4361EE'],
        pointBackgroundColor: '#4361EE',
        pointBorderColor: '#3A0CA3',
        pointRadius: 5,
        pointHoverRadius: 8
      }
    ]
  };
};

// Prepare data for a treemap visualization
export const prepareTreeMapData = (
  data: any[][], 
  valueColumnIndex: number,
  limit: number = 10
): { name: string; value: number }[] => {
  // Skip header row and extract data
  const extractedData = data.slice(1, limit + 1).map(row => ({
    name: `Category ${row[0]}`,
    value: parseFloat(row[valueColumnIndex])
  }));
  
  // Filter out non-numeric values and sort by value
  const filteredData = extractedData
    .filter(item => !isNaN(item.value))
    .sort((a, b) => b.value - a.value);
  
  // Remove duplicates based on name (keep the first occurrence which has highest value due to sorting)
  const uniqueData = filteredData.reduce((acc: typeof filteredData, current) => {
    if (!acc.find(item => item.name === current.name)) {
      acc.push(current);
    }
    return acc;
  }, []);
  
  // Limit to specified number of items after deduplication
  return uniqueData.slice(0, limit);
};

// Generate comparison table data
export const generateComparisonTableData = (comparisonResults: ComparisonResult[]): any[] => {
  const tableData = [];
  
  for (const result of comparisonResults) {
    const rowData: any = {
      columnName: result.columnName
    };
    
    result.datasets.forEach(dataset => {
      // Add dataset statistics
      rowData[`${dataset.datasetName}-mean`] = formatDisplayValue(dataset.stats.mean);
      rowData[`${dataset.datasetName}-median`] = formatDisplayValue(dataset.stats.median);
      rowData[`${dataset.datasetName}-stdDev`] = formatDisplayValue(dataset.stats.stdDev);
      rowData[`${dataset.datasetName}-min`] = formatDisplayValue(dataset.stats.min);
      rowData[`${dataset.datasetName}-max`] = formatDisplayValue(dataset.stats.max);
    });
    
    // Add difference if available
    if (result.differences.length > 0) {
      const diff = result.differences[0];
      rowData['diff-mean'] = formatDifferenceValue(diff.mean);
      rowData['diff-median'] = formatDifferenceValue(diff.median);
      rowData['diff-stdDev'] = formatDifferenceValue(diff.stdDev);
      rowData['diff-min'] = formatDifferenceValue(diff.min);
      rowData['diff-max'] = formatDifferenceValue(diff.max);
    }
    
    tableData.push(rowData);
  }
  
  return tableData;
};

// Helper function to format display values
const formatDisplayValue = (value: number | null): string => {
  if (value === null) return 'N/A';
  if (Math.abs(value) < 0.001) return value.toExponential(3);
  return value.toFixed(4);
};

// Helper function to format difference values with indicators
const formatDifferenceValue = (value: number): string => {
  if (value === 0) return '0';
  
  const formattedValue = Math.abs(value) < 0.001 
    ? value.toExponential(3) 
    : value.toFixed(4);
  
  // Add indicator for increase/decrease
  return value > 0 ? `+${formattedValue}` : formattedValue;
};

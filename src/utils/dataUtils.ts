/**
 * Utility functions for data processing
 */

export interface DataFile {
  id: string;
  name: string;
  content: string;
  data: any[][];
  headers: string[];
  parsed: boolean;
}

export interface DatasetSummary {
  columnName: string;
  mean: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  stdDev: number | null;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
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
): { mean: number | null; median: number | null; min: number | null; max: number | null; stdDev: number | null } => {
  // Extract numeric values from the column (skip header row)
  const values = data.slice(1).map(row => parseFloat(row[columnIndex])).filter(val => !isNaN(val));
  
  if (values.length === 0) {
    return { mean: null, median: null, min: null, max: null, stdDev: null };
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
  
  // Calculate standard deviation
  const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return { mean, median, min, max, stdDev };
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
    .sort((a, b) => b.value - a.value); // Sort in descending order
  
  // Prepare labels and data for the chart
  const labels = filteredData.map(item => item.label);
  const values = filteredData.map(item => item.value);
  
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
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('1)', '0.8)')),
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
    .sort((a, b) => b.value - a.value); // Sort in descending order
  
  // Calculate total for percentage
  const total = filteredData.reduce((sum, item) => sum + item.value, 0);
  
  // Filter out items less than 1% and combine them into "Others"
  const significantData = filteredData.filter(item => (item.value / total) >= 0.01);
  const otherSum = filteredData
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
        backgroundColor: colors
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
  
  return {
    datasets: [
      {
        label: 'Data Points',
        data: filteredPoints,
        backgroundColor: ['#4361EE'],
        pointBackgroundColor: '#4361EE',
        pointBorderColor: '#3A0CA3',
        pointRadius: 5,
        pointHoverRadius: 8
      }
    ]
  };
};

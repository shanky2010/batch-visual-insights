
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer } from "@/components/ui/chart";
import { Download, Table } from 'lucide-react';
import { toast } from "@/components/ui/sonner";
import html2canvas from 'html2canvas';

interface CorrelationMatrixProps {
  fileName: string;
  columnNames: string[];
  correlationMatrix: number[][];
  correlationType: 'pearson' | 'spearman' | 'kendall';
  onCorrelationTypeChange: (type: 'pearson' | 'spearman' | 'kendall') => void;
}

const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({ 
  fileName, 
  columnNames, 
  correlationMatrix,
  correlationType,
  onCorrelationTypeChange
}) => {
  const matrixRef = useRef<HTMLDivElement>(null);
  const [highlightThreshold, setHighlightThreshold] = useState<number>(0.7);
  
  // Color scale for correlation values
  const getCorrelationColor = (value: number): string => {
    // Skip NaN values
    if (isNaN(value)) return '#f1f1f1';
    
    const absValue = Math.abs(value);
    
    // Strong positive correlation (dark blue)
    if (value > highlightThreshold) return '#0EA5E9';
    
    // Strong negative correlation (orange)
    if (value < -highlightThreshold) return '#F97316';
    
    // Moderate to weak correlation (purple with varying opacity)
    if (absValue > 0.3) {
      const opacity = (absValue - 0.3) / 0.4; // Scale from 0 to 1
      return `rgba(139, 92, 246, ${opacity})`;
    }
    
    // Very weak or no correlation (light gray)
    return '#f1f1f1';
  };
  
  // Format correlation value for display
  const formatCorrelation = (value: number): string => {
    if (isNaN(value)) return 'N/A';
    return value.toFixed(2);
  };
  
  // Export matrix as image
  const exportAsImage = async () => {
    if (!matrixRef.current) return;
    
    try {
      const canvas = await html2canvas(matrixRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${fileName.replace(/\s+/g, '-').toLowerCase()}-${correlationType}-correlation-matrix.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Correlation matrix image downloaded');
    } catch (error) {
      console.error('Error exporting image:', error);
      toast.error('Failed to export image');
    }
  };
  
  // Export matrix as CSV
  const exportAsCSV = () => {
    let csv = 'Column';
    
    // Add header row
    columnNames.forEach(column => {
      csv += `,${column}`;
    });
    csv += '\n';
    
    // Add data rows
    correlationMatrix.forEach((row, rowIndex) => {
      csv += columnNames[rowIndex];
      
      row.forEach(value => {
        csv += `,${isNaN(value) ? '' : value.toFixed(4)}`;
      });
      
      csv += '\n';
    });
    
    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName.replace(/\s+/g, '-').toLowerCase()}-${correlationType}-correlation-matrix.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Correlation matrix CSV downloaded');
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-semibold">
          Correlation Matrix
          <span className="text-sm text-gray-500 font-normal ml-2">
            for {fileName}
          </span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select 
            value={correlationType} 
            onValueChange={(value) => onCorrelationTypeChange(value as 'pearson' | 'spearman' | 'kendall')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Correlation Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pearson">Pearson</SelectItem>
              <SelectItem value="spearman">Spearman</SelectItem>
              <SelectItem value="kendall">Kendall</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={highlightThreshold.toString()} 
            onValueChange={(value) => setHighlightThreshold(parseFloat(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Highlight Threshold" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">Medium (±0.5)</SelectItem>
              <SelectItem value="0.7">Strong (±0.7)</SelectItem>
              <SelectItem value="0.9">Very Strong (±0.9)</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportAsImage}>
            <Download className="h-4 w-4 mr-2" />
            PNG
          </Button>
          <Button variant="outline" onClick={exportAsCSV}>
            <Table className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 overflow-x-auto">
        <div ref={matrixRef} className="p-4 bg-white">
          <div className="flex">
            <div className="w-28 shrink-0" /> {/* Empty corner cell */}
            {columnNames.map((column, index) => (
              <div 
                key={`header-${index}`}
                className="w-16 shrink-0 text-center font-medium p-2 rotate-45 origin-bottom-left transform translate-y-8"
                style={{ height: '120px' }}
              >
                {column}
              </div>
            ))}
          </div>

          {correlationMatrix.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="flex">
              <div className="w-28 shrink-0 p-2 font-medium text-right">
                {columnNames[rowIndex]}
              </div>
              {row.map((value, colIndex) => (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="w-16 h-16 shrink-0 flex items-center justify-center text-xs font-medium"
                  style={{
                    backgroundColor: getCorrelationColor(value),
                    color: Math.abs(value) > 0.7 ? '#fff' : '#222222',
                    border: '1px solid #fff',
                  }}
                  title={`${columnNames[rowIndex]} × ${columnNames[colIndex]}: ${formatCorrelation(value)}`}
                >
                  {formatCorrelation(value)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CorrelationMatrix;

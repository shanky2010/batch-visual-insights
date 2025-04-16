
import React, { useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, X } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { DataFile, parseCSV } from '@/utils/dataUtils';

interface FileUploadProps {
  onFilesProcessed: (files: DataFile[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesProcessed }) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<DataFile[]>([]);
  const [processing, setProcessing] = useState(false);

  // Process a file
  const processFile = async (file: File): Promise<DataFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string;
          const parsedData = parseCSV(csvContent);
          const headers = parsedData[0];
          
          resolve({
            id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            name: file.name,
            content: csvContent,
            data: parsedData,
            headers: headers,
            parsed: true
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error(`Failed to read file ${file.name}`));
      };
      
      reader.readAsText(file);
    });
  };

  // Handle dropped or selected files
  const handleFiles = useCallback(async (fileList: FileList) => {
    setProcessing(true);
    
    try {
      const csvFiles = Array.from(fileList).filter(file => 
        file.type === 'text/csv' || file.name.endsWith('.csv')
      );
      
      if (csvFiles.length === 0) {
        toast.error("Please upload valid CSV files.");
        setProcessing(false);
        return;
      }
      
      const processedFiles = await Promise.all(csvFiles.map(processFile));
      
      setFiles((prevFiles) => {
        const newFiles = [...prevFiles, ...processedFiles];
        onFilesProcessed(newFiles); // Notify parent component
        return newFiles;
      });
      
      toast.success(`Successfully uploaded ${csvFiles.length} CSV file(s)`);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error("Error processing CSV files. Please check their format.");
    } finally {
      setProcessing(false);
    }
  }, [onFilesProcessed]);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // Handle file selection
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // Remove a file
  const removeFile = (fileId: string) => {
    setFiles(prevFiles => {
      const newFiles = prevFiles.filter(file => file.id !== fileId);
      onFilesProcessed(newFiles); // Notify parent component
      return newFiles;
    });
    toast.info("File removed");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-data-purple">Upload Files</CardTitle>
        <CardDescription>Upload CSV files for batch data analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className={`
            border-2 border-dashed rounded-lg p-8 mb-4
            flex flex-col items-center justify-center
            text-center cursor-pointer
            transition-all duration-200
            ${dragActive ? 'border-data-blue bg-blue-50' : 'border-gray-300 hover:border-data-blue'}
          `}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <Upload className="h-12 w-12 text-data-blue mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {dragActive ? 'Drop your files here' : 'Drag & drop files or click to browse'}
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            Supports CSV files only
          </p>
          <input
            id="file-upload"
            type="file"
            multiple
            accept=".csv,text/csv"
            onChange={handleChange}
            className="hidden"
            disabled={processing}
          />
          <Button disabled={processing}>
            {processing ? 'Processing...' : 'Select Files'}
          </Button>
        </div>
        
        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Uploaded Files</h3>
            <div className="space-y-2">
              {files.map((file) => (
                <div 
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-data-blue mr-2" />
                    <span className="text-sm font-medium truncate max-w-[280px]">{file.name}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;

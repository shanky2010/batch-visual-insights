
import React, { useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, X, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { DataFile, parseCSV } from '@/utils/dataUtils';
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  onFilesProcessed: (files: DataFile[]) => void;
}

interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  rowIndex?: number;
  colIndex?: number;
}

interface FileValidation {
  isValid: boolean;
  issues: ValidationIssue[];
  hasDuplicateRows: boolean;
  hasMissingValues: boolean;
  hasInconsistentColumns: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesProcessed }) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<DataFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadingToDb, setUploadingToDb] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { session, user } = useSession();

  // Validate a CSV file
  const validateCsvFile = (parsedData: any[][]): FileValidation => {
    const issues: ValidationIssue[] = [];
    let hasDuplicateRows = false;
    let hasMissingValues = false;
    let hasInconsistentColumns = false;
    
    if (!parsedData || parsedData.length === 0) {
      issues.push({ 
        type: 'error', 
        message: 'File is empty or could not be parsed' 
      });
      return { isValid: false, issues, hasDuplicateRows, hasMissingValues, hasInconsistentColumns };
    }
    
    // Check if headers exist
    const headers = parsedData[0];
    if (!headers || headers.length === 0) {
      issues.push({ 
        type: 'error', 
        message: 'No column headers found' 
      });
    }
    
    // Check for consistent column count
    const headerCount = headers.length;
    let inconsistentRowFound = false;
    
    // Check for missing values and inconsistent column counts
    for (let i = 1; i < parsedData.length; i++) {
      const row = parsedData[i];
      
      // Check for inconsistent column count
      if (row.length !== headerCount) {
        issues.push({ 
          type: 'error', 
          message: `Row ${i + 1} has ${row.length} columns, expected ${headerCount}`,
          rowIndex: i
        });
        inconsistentRowFound = true;
      }
      
      // Check for missing values
      for (let j = 0; j < row.length; j++) {
        if (!row[j] || row[j].toString().trim() === '') {
          issues.push({ 
            type: 'warning', 
            message: `Missing value at row ${i + 1}, column ${j + 1} (${headers[j] || 'unnamed'})`,
            rowIndex: i,
            colIndex: j
          });
          hasMissingValues = true;
        }
      }
    }
    
    hasInconsistentColumns = inconsistentRowFound;
    
    // Check for duplicate rows (skip header)
    const uniqueRows = new Set<string>();
    const duplicateIndexes: number[] = [];
    
    for (let i = 1; i < parsedData.length; i++) {
      const rowStr = JSON.stringify(parsedData[i]);
      if (uniqueRows.has(rowStr)) {
        duplicateIndexes.push(i);
        hasDuplicateRows = true;
      } else {
        uniqueRows.add(rowStr);
      }
    }
    
    if (hasDuplicateRows) {
      issues.push({ 
        type: 'warning', 
        message: `Found ${duplicateIndexes.length} duplicate rows. Consider removing them.` 
      });
    }
    
    return { 
      isValid: !inconsistentRowFound, 
      issues, 
      hasDuplicateRows, 
      hasMissingValues,
      hasInconsistentColumns
    };
  };

  // Process a file
  const processFile = async (file: File): Promise<DataFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string;
          const parsedData = parseCSV(csvContent);
          const headers = parsedData[0];
          
          // Validate the CSV data
          const validation = validateCsvFile(parsedData);
          
          const fileData: DataFile = {
            id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            name: file.name,
            content: csvContent,
            data: parsedData,
            headers: headers,
            parsed: true,
            fileSize: file.size,
            validation: validation,
            dateAdded: new Date().toISOString()
          };
          
          resolve(fileData);
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

  // Save file to Supabase
  const saveFileToDatabase = async (file: DataFile) => {
    if (!user) {
      toast.error("You must be logged in to upload files");
      return null;
    }

    try {
      // Convert the validation issues to a plain JSON object that Supabase can store
      const validationIssuesJson = file.validation?.issues.map(issue => ({
        type: issue.type,
        message: issue.message,
        rowIndex: issue.rowIndex,
        colIndex: issue.colIndex
      })) || [];

      const { data, error } = await supabase
        .from('datasets')
        .insert({
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          original_name: file.name,
          file_size: file.fileSize || 0,
          column_count: file.headers.length,
          row_count: file.data.length - 1, // Subtract header row
          content: file.content,
          validation_status: file.validation?.isValid ? 'valid' : 'has_issues',
          validation_issues: validationIssuesJson,
          metadata: {
            headers: file.headers,
            hasDuplicates: file.validation?.hasDuplicateRows,
            hasMissingValues: file.validation?.hasMissingValues
          },
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error("Error saving file to database:", error);
      toast.error(`Failed to save file: ${error.message || error}`);
      return null;
    }
  };

  // Handle dropped or selected files
  const handleFiles = useCallback(async (fileList: FileList) => {
    if (!user) {
      toast.error("You must be logged in to upload files");
      return;
    }

    setProcessing(true);
    setProgress(10);
    
    try {
      const csvFiles = Array.from(fileList).filter(file => 
        file.type === 'text/csv' || file.name.endsWith('.csv')
      );
      
      if (csvFiles.length === 0) {
        toast.error("Please upload valid CSV files.");
        setProcessing(false);
        setProgress(0);
        return;
      }
      
      // Process all new files
      const processedFiles: DataFile[] = [];
      
      for (let i = 0; i < csvFiles.length; i++) {
        const file = csvFiles[i];
        setProgress(10 + Math.round((i / csvFiles.length) * 40));
        
        // Process the file to get the parsed data
        const processedFile = await processFile(file);
        processedFiles.push(processedFile);
      }
      
      // Merge with existing files, checking for duplicates by filename
      const mergedFiles = [...files];
      setProgress(50);
      
      setUploadingToDb(true);
      for (let i = 0; i < processedFiles.length; i++) {
        const newFile = processedFiles[i];
        setProgress(50 + Math.round((i / processedFiles.length) * 40));
        
        // Check if a file with this name already exists
        const existingIndex = mergedFiles.findIndex(f => f.name === newFile.name);
        
        // Save to database first
        await saveFileToDatabase(newFile);
        
        if (existingIndex >= 0) {
          // Replace existing file with new one
          mergedFiles[existingIndex] = newFile;
          toast.info(`Updated existing file: ${newFile.name}`);
        } else {
          // Add new file
          mergedFiles.push(newFile);
        }
      }
      setUploadingToDb(false);
      setProgress(95);
      
      setFiles(mergedFiles);
      onFilesProcessed(mergedFiles); // Notify parent component of all files
      
      toast.success(`Successfully processed ${csvFiles.length} CSV file(s)`);
      setProgress(100);
      
      // Show validation warnings if necessary
      const filesWithIssues = processedFiles.filter(file => 
        file.validation && file.validation.issues.length > 0
      );
      
      if (filesWithIssues.length > 0) {
        setTimeout(() => {
          toast.warning(`${filesWithIssues.length} file(s) have validation issues. Check the validation report for details.`);
        }, 1000);
      }
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error("Error processing CSV files. Please check their format.");
    } finally {
      setTimeout(() => {
        setProcessing(false);
        setProgress(0);
      }, 500);
    }
  }, [files, onFilesProcessed, user]);

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
  const removeFile = async (fileId: string) => {
    try {
      const fileToRemove = files.find(file => file.id === fileId);
      if (!fileToRemove) return;

      // First check if this file is being used anywhere
      const { count, error: countError } = await supabase
        .from('processed_datasets')
        .select('id', { count: 'exact', head: true })
        .eq('original_dataset_id', fileId);
        
      if (countError) throw countError;
      
      if (count && count > 0) {
        toast.error(`This file cannot be deleted as it's being used by ${count} processed datasets.`);
        return;
      }

      // Delete from database
      const { error } = await supabase
        .from('datasets')
        .delete()
        .eq('id', fileId);
        
      if (error) throw error;

      // Update state
      setFiles(prevFiles => {
        const newFiles = prevFiles.filter(file => file.id !== fileId);
        onFilesProcessed(newFiles); // Notify parent component
        return newFiles;
      });

      setConfirmDelete(null);
      toast.success("File removed successfully");
    } catch (error: any) {
      console.error("Error removing file:", error);
      toast.error(`Failed to remove file: ${error.message || error}`);
    }
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
            Supports multiple CSV files
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
          <Button disabled={processing || uploadingToDb}>
            {processing ? 'Processing...' : uploadingToDb ? 'Uploading...' : 'Select Files'}
          </Button>
          
          {(processing || uploadingToDb) && (
            <div className="w-full mt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-500 mt-1">
                {uploadingToDb ? 'Saving to database...' : 'Processing files...'}
              </p>
            </div>
          )}
        </div>
        
        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Uploaded Files</h3>
            <div className="space-y-2">
              {files.map((file) => (
                <div 
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-data-blue mr-2 flex-shrink-0" />
                      <span className="text-sm font-medium truncate max-w-[280px]">{file.name}</span>
                      
                      {file.validation && !file.validation.isValid && (
                        <Badge variant="destructive" className="ml-2">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Issues
                        </Badge>
                      )}
                      
                      {file.validation && file.validation.isValid && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 ml-2">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Valid
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <span>{file.data.length - 1} rows</span>
                      <span className="mx-2">•</span>
                      <span>{file.headers.length} columns</span>
                      <span className="mx-2">•</span>
                      <span>{formatFileSize(file.fileSize || 0)}</span>
                      <span className="mx-2">•</span>
                      <span>Added {new Date(file.dateAdded || Date.now()).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-8"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        // Preview logic would go here
                        toast.info("Preview feature coming soon");
                      }}
                    >
                      Preview
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setConfirmDelete(file.id);
                      }}
                      className="h-8 w-8 ml-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!confirmDelete}
          onOpenChange={(open) => {
            if (!open) setConfirmDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected file.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => confirmDelete && removeFile(confirmDelete)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

// Format file size in bytes to human-readable format
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FileUpload;

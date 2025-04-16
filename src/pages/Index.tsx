
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataFile } from '@/utils/dataUtils';
import FileUpload from '@/components/FileUpload';
import DataAnalysis from '@/components/DataAnalysis';
import { ChartBar, FileCsv, LayoutDashboard } from 'lucide-react';

const Index = () => {
  const [files, setFiles] = useState<DataFile[]>([]);

  const handleFilesProcessed = (processedFiles: DataFile[]) => {
    setFiles(processedFiles);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-data-purple">Batch Visual Insights</h1>
              <p className="mt-1 text-gray-500">
                Upload, analyze, and visualize multiple CSV datasets at once
              </p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="upload" className="space-y-8">
          <div className="bg-white rounded-lg shadow p-4">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="upload" className="flex items-center space-x-2">
                <FileCsv className="h-4 w-4" />
                <span>Upload Files</span>
              </TabsTrigger>
              <TabsTrigger value="analyze" className="flex items-center space-x-2">
                <ChartBar className="h-4 w-4" />
                <span>Analyze Data</span>
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="upload" className="space-y-8">
            <FileUpload onFilesProcessed={handleFilesProcessed} />
            
            {files.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
                <div className="bg-blue-100 rounded-full p-2 mr-4">
                  <FileCsv className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Files Ready for Analysis</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    {files.length} file{files.length !== 1 ? 's' : ''} uploaded successfully. 
                    Go to the "Analyze Data" tab to start analyzing your data.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="analyze" className="space-y-8">
            {files.length > 0 ? (
              <DataAnalysis files={files} />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileCsv className="h-8 w-8 text-gray-400" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Files Uploaded</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Please upload CSV files in the "Upload Files" tab to start analyzing your data.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="dashboard" className="space-y-8">
            {files.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-4">Dataset Overview</h2>
                  <div className="space-y-4">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-md">
                        <FileCsv className="h-5 w-5 text-data-blue mt-1" />
                        <div>
                          <h3 className="font-medium">{file.name}</h3>
                          <p className="text-sm text-gray-500">
                            {file.data.length} rows × {file.headers.length} columns
                          </p>
                          {file.headers.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">Columns: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {file.headers.slice(0, 5).map((header, index) => (
                                  <span 
                                    key={index}
                                    className="inline-block bg-gray-200 rounded px-2 py-1 text-xs"
                                  >
                                    {header}
                                  </span>
                                ))}
                                {file.headers.length > 5 && (
                                  <span className="inline-block bg-gray-200 rounded px-2 py-1 text-xs">
                                    +{file.headers.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-4">Quick Tips</h2>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mr-3">1</span>
                      <p className="text-gray-600">Select columns from the dropdown in the "Analyze Data" tab</p>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mr-3">2</span>
                      <p className="text-gray-600">Click "Analyze Data" to generate statistics and basic visualizations</p>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mr-3">3</span>
                      <p className="text-gray-600">Explore different chart types (bar charts, pie charts, histograms)</p>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mr-3">4</span>
                      <p className="text-gray-600">For scatter plots, select both X and Y axis columns (must be from the same file)</p>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mr-3">5</span>
                      <p className="text-gray-600">Use the Export button to save your analysis results as JSON</p>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LayoutDashboard className="h-8 w-8 text-gray-400" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Upload CSV files to view your data dashboard.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Batch Visual Insights | A Data Analysis Tool
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

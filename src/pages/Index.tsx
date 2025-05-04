
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataFile } from '@/utils/dataUtils';
import FileUpload from '@/components/FileUpload';
import DataAnalysis from '@/components/DataAnalysis';
import { BarChart3, FileText, LayoutDashboard, Upload, ChevronRight, LogOut, Database } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import DatasetList from '@/components/DatasetList';

const Index = () => {
  const [files, setFiles] = useState<DataFile[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const { toast: toastHook } = useToast();
  const { session, user, loading } = useSession();
  const navigate = useNavigate();

  const handleFilesProcessed = (processedFiles: DataFile[]) => {
    setFiles(processedFiles);
    toastHook({
      title: "Files Processed Successfully",
      description: `${processedFiles.length} file${processedFiles.length !== 1 ? 's' : ''} ready for analysis`,
    });
    setActiveTab('analyze');
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      toast.success("Logged out successfully");
      // Explicitly navigate to the auth page after successful logout
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Error logging out");
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-data-purple to-data-blue bg-clip-text text-transparent">
                Batch Visual Insights
              </h1>
              <p className="mt-2 text-gray-600 text-lg">
                Upload, analyze, and visualize multiple CSV datasets at once
              </p>
            </div>
            <div className="flex items-center gap-4">
              {loading ? null : session ? (
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 font-medium">
                    Welcome back{user?.email ? `, ${user.email}` : ""}!
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="flex items-center gap-1"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="inline-flex items-center px-4 py-2 border border-data-purple text-data-purple rounded-md hover:bg-data-purple hover:text-white transition-colors font-medium"
                >
                  Login / Sign up
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <Card className="border-none shadow-md">
            <CardContent className="p-2">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto lg:inline-grid gap-2 p-2">
                <TabsTrigger 
                  value="upload" 
                  className="flex items-center space-x-2 data-[state=active]:bg-data-purple data-[state=active]:text-white"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Files</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="datasets"
                  className="flex items-center space-x-2 data-[state=active]:bg-data-light-blue data-[state=active]:text-white"
                >
                  <Database className="h-4 w-4" />
                  <span>Your Datasets</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="analyze"
                  className="flex items-center space-x-2 data-[state=active]:bg-data-blue data-[state=active]:text-white"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analyze Data</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="dashboard"
                  className="flex items-center space-x-2 data-[state=active]:bg-data-violet data-[state=active]:text-white"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>
          
          <TabsContent value="upload" className="space-y-8">
            <div className="grid gap-8">
              <FileUpload onFilesProcessed={handleFilesProcessed} />
              
              {files.length > 0 && (
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-white rounded-full p-2 shadow-sm">
                        <FileText className="h-6 w-6 text-data-blue" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">Files Ready for Analysis</h3>
                        <p className="text-gray-600 mt-1">
                          {files.length} file{files.length !== 1 ? 's' : ''} uploaded successfully
                        </p>
                        <Button 
                          onClick={() => setActiveTab('analyze')}
                          className="mt-4 bg-data-blue hover:bg-data-blue/90"
                        >
                          Start Analysis
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="datasets" className="space-y-8">
            <DatasetList />
          </TabsContent>
          
          <TabsContent value="analyze" className="space-y-8">
            {files.length > 0 ? (
              <DataAnalysis files={files} />
            ) : (
              <Card className="border-none shadow-sm bg-gradient-to-r from-gray-50 to-white">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <FileText className="h-8 w-8 text-gray-400" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Files Uploaded</h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    Please upload CSV files to start analyzing your data
                  </p>
                  <Button 
                    onClick={() => setActiveTab('upload')}
                    variant="outline"
                    className="border-data-purple text-data-purple hover:bg-data-purple hover:text-white"
                  >
                    Go to Upload
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="dashboard" className="space-y-8">
            {files.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">Dataset Overview</h2>
                    <div className="space-y-4">
                      {files.map((file) => (
                        <div 
                          key={file.id} 
                          className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-sm transition-all duration-200"
                        >
                          <FileText className="h-5 w-5 text-data-blue mt-1" />
                          <div>
                            <h3 className="font-medium text-gray-900">{file.name}</h3>
                            <p className="text-sm text-gray-600">
                              {file.data.length - 1} rows × {file.headers.length} columns
                            </p>
                            {file.headers.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-500">Columns: </span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {file.headers.slice(0, 5).map((header, index) => (
                                    <span 
                                      key={index}
                                      className="inline-block bg-white shadow-sm rounded-full px-3 py-1 text-xs text-gray-600"
                                    >
                                      {header}
                                    </span>
                                  ))}
                                  {file.headers.length > 5 && (
                                    <span className="inline-block bg-data-blue/10 text-data-blue rounded-full px-3 py-1 text-xs">
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
                  </CardContent>
                </Card>
                
                <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Tips</h2>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-data-blue/10 text-data-blue text-sm font-medium mr-3">1</span>
                        <p className="text-gray-700">Select columns from the dropdown in the "Analyze Data" tab</p>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-data-purple/10 text-data-purple text-sm font-medium mr-3">2</span>
                        <p className="text-gray-700">Click "Analyze Data" to generate statistics and visualizations</p>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-data-violet/10 text-data-violet text-sm font-medium mr-3">3</span>
                        <p className="text-gray-700">Explore different chart types (bar charts, pie charts, histograms)</p>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-data-pink/10 text-data-pink text-sm font-medium mr-3">4</span>
                        <p className="text-gray-700">For scatter plots, select both X and Y axis columns (same file)</p>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-data-light-blue/10 text-data-light-blue text-sm font-medium mr-3">5</span>
                        <p className="text-gray-700">Use the Export button to save your analysis results as JSON</p>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-none shadow-sm bg-gradient-to-r from-gray-50 to-white">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <LayoutDashboard className="h-8 w-8 text-gray-400" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Data Available</h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    Upload CSV files to view your data dashboard
                  </p>
                  <Button 
                    onClick={() => setActiveTab('upload')}
                    variant="outline"
                    className="border-data-purple text-data-purple hover:bg-data-purple hover:text-white"
                  >
                    Go to Upload
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="mt-16 border-t bg-gradient-to-t from-gray-50 to-white">
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Batch Visual Insights | A Data Analysis Tool
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

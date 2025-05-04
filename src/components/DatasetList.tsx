
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, FileText, AlertCircle, CheckCircle, Edit2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useSession } from '@/hooks/useSession';

interface Dataset {
  id: string;
  name: string;
  original_name: string;
  file_size: number;
  column_count: number;
  row_count: number;
  created_at: string;
  updated_at: string;
  is_processed: boolean;
  validation_status: string;
  metadata: any;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DatasetList = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const { user } = useSession();

  const fetchDatasets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('datasets')
        .select('*');
        
      // Add sorting
      if (sortField && sortOrder) {
        query = query.order(sortField, { ascending: sortOrder === 'asc' });
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setDatasets(data || []);
    } catch (error: any) {
      console.error('Error fetching datasets:', error);
      toast.error(`Failed to load datasets: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchDatasets();
  }, [sortField, sortOrder, user]);

  const handleDelete = async (id: string) => {
    try {
      // First check if this dataset is being used anywhere
      const { count, error: countError } = await supabase
        .from('processed_datasets')
        .select('id', { count: 'exact', head: true })
        .eq('original_dataset_id', id);
        
      if (countError) throw countError;
      
      if (count && count > 0) {
        toast.error(`This dataset cannot be deleted as it's being used by ${count} processed datasets.`);
        setConfirmDelete(null);
        return;
      }

      const { error } = await supabase
        .from('datasets')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setConfirmDelete(null);
      toast.success('Dataset deleted successfully');
      
      // Refresh the list
      fetchDatasets();
    } catch (error: any) {
      console.error('Error deleting dataset:', error);
      toast.error(`Failed to delete dataset: ${error.message}`);
    }
  };

  const handlePreview = async (dataset: Dataset) => {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('content')
        .eq('id', dataset.id)
        .single();
        
      if (error) throw error;
      
      if (data && data.content) {
        // Parse CSV content
        const lines = data.content.trim().split('\n');
        const parsedData = lines.slice(0, 10).map(line => {
          // Split by comma but respect quotes
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
        
        setPreviewData(parsedData);
        setSelectedDataset(dataset);
        setPreviewOpen(true);
      }
    } catch (error: any) {
      console.error('Error fetching dataset preview:', error);
      toast.error(`Failed to load preview: ${error.message}`);
    }
  };

  const handleRename = async () => {
    if (!selectedDataset || !newName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('datasets')
        .update({ name: newName.trim() })
        .eq('id', selectedDataset.id);
        
      if (error) throw error;
      
      toast.success('Dataset renamed successfully');
      setRenameOpen(false);
      setNewName('');
      
      // Refresh the list
      fetchDatasets();
    } catch (error: any) {
      console.error('Error renaming dataset:', error);
      toast.error(`Failed to rename dataset: ${error.message}`);
    }
  };

  const openRenameDialog = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setNewName(dataset.name);
    setRenameOpen(true);
  };

  // Filter datasets based on search query
  const filteredDatasets = datasets.filter(dataset => {
    const searchLower = searchQuery.toLowerCase();
    return (
      dataset.name.toLowerCase().includes(searchLower) ||
      dataset.original_name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Datasets</CardTitle>
        <CardDescription>Manage your uploaded datasets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Input 
            placeholder="Search datasets..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex items-center space-x-2">
            <Select
              value={sortField}
              onValueChange={setSortField}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="created_at">Date Added</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="file_size">File Size</SelectItem>
                  <SelectItem value="row_count">Row Count</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading datasets...</div>
        ) : filteredDatasets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'No datasets match your search' : 'No datasets found. Upload some CSV files to get started!'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Rows</TableHead>
                <TableHead>Columns</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDatasets.map((dataset) => (
                <TableRow key={dataset.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-data-blue" />
                      <span>{dataset.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{dataset.original_name}</div>
                  </TableCell>
                  <TableCell>{formatFileSize(dataset.file_size)}</TableCell>
                  <TableCell>{dataset.row_count}</TableCell>
                  <TableCell>{dataset.column_count}</TableCell>
                  <TableCell>
                    {dataset.validation_status === 'valid' ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valid
                      </Badge>
                    ) : dataset.validation_status === 'has_issues' ? (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Has Issues
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(dataset.created_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePreview(dataset)}
                        title="Preview Dataset"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openRenameDialog(dataset)}
                        title="Rename Dataset"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setConfirmDelete(dataset.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete Dataset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                This action cannot be undone. This will permanently delete the selected dataset
                and remove it from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => confirmDelete && handleDelete(confirmDelete)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Preview Dialog */}
        <AlertDialog 
          open={previewOpen} 
          onOpenChange={setPreviewOpen}
        >
          <AlertDialogContent className="max-w-4xl">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedDataset?.name}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Preview - First 10 rows)
                </span>
              </AlertDialogTitle>
            </AlertDialogHeader>
            
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewData[0]?.map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(1).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogAction>Close</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Rename Dialog */}
        <AlertDialog 
          open={renameOpen} 
          onOpenChange={setRenameOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rename Dataset</AlertDialogTitle>
              <AlertDialogDescription>
                Enter a new name for this dataset.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New dataset name"
            />
            
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRename}>
                Save
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default DatasetList;

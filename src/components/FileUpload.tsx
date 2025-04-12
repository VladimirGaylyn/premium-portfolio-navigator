
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileType, AlertCircle, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { validateExcelFile } from '@/utils/excel-parser';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileAccepted: (file: File) => void;
}

const FileUpload = ({ onFileAccepted }: FileUploadProps) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (file && validateExcelFile(file)) {
      setSelectedFile(file);
      onFileAccepted(file);
      toast({
        title: "File Uploaded",
        description: `${file.name} has been successfully uploaded.`,
        variant: "default",
      });
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a valid Excel file (.xlsx or .xls).",
        variant: "destructive",
      });
    }
  }, [onFileAccepted, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Upload size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium">Drag & drop an Excel file here</p>
              <p className="text-sm text-muted-foreground mt-1">
                The file must include "Returns" and "Correlation" sheets
              </p>
            </div>
            <Button type="button" variant="outline" className="mt-4">
              <FileType className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
          </div>
        </div>
        
        {selectedFile && (
          <div className="mt-4 p-3 bg-muted rounded-md flex items-center">
            <div className="p-2 rounded-full bg-green-100 mr-3">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        )}
        
        <div className="mt-4">
          <p className="text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-1 text-insurance-teal" />
            <span>Required Excel file structure:</span>
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground ml-5 mt-1 space-y-1">
            <li>Returns Sheet: "Property" and "Expected Return" columns</li>
            <li>Correlation Sheet: Square matrix with property names as headers</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Play, RefreshCw, Upload } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import AlgorithmToggle from '@/components/AlgorithmToggle';
import PortfolioResults from '@/components/PortfolioResults';
import { ExcelData, parseExcelFile } from '@/utils/excel-parser';
import { PortfolioResult, classicalOptimization, quantumOptimization } from '@/utils/portfolio-optimizer';
const Index = () => {
  const {
    toast
  } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [algorithm, setAlgorithm] = useState<'classical' | 'quantum'>('classical');
  const [isProcessing, setIsProcessing] = useState(false);
  const [portfolioResult, setPortfolioResult] = useState<PortfolioResult | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const handleFileAccepted = (file: File) => {
    setUploadedFile(file);
    setExcelData(null);
    setPortfolioResult(null);
  };
  const parseFile = async () => {
    if (!uploadedFile) {
      toast({
        title: "No File Selected",
        description: "Please upload an Excel file before processing.",
        variant: "destructive"
      });
      return;
    }
    setIsProcessing(true);
    try {
      const data = await parseExcelFile(uploadedFile);
      setExcelData(data);
      toast({
        title: "File Parsed Successfully",
        description: `Found ${data.properties.length} properties with returns and correlation data.`,
        variant: "default"
      });
      return data;
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: "Error Parsing File",
        description: error instanceof Error ? error.message : "Failed to parse the Excel file. Please check the format.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };
  const processPortfolio = async () => {
    let data = excelData;
    if (!data) {
      data = await parseFile();
      if (!data) return;
    }
    setIsProcessing(true);
    try {
      // Run the appropriate optimization algorithm
      const result = algorithm === 'classical' ? classicalOptimization(data) : quantumOptimization(data);
      setPortfolioResult(result);
      toast({
        title: "Portfolio Optimized",
        description: `Optimization completed in ${result.processingTimeMs}ms.`,
        variant: "default"
      });

      // Switch to the results tab
      setActiveTab('results');
    } catch (error) {
      console.error('Error optimizing portfolio:', error);
      toast({
        title: "Optimization Failed",
        description: error instanceof Error ? error.message : "An error occurred during portfolio optimization.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  return <div className="container mx-auto p-4 md:p-6 max-w-screen-xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-insurance-blue">YALE Hackathon 2025: Capgemini - Hartford</h1>
        <p className="text-muted-foreground mt-2">
          Upload your Excel file with property returns and correlations to calculate an optimal portfolio.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Controls</CardTitle>
              <CardDescription>Manage your optimization process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AlgorithmToggle algorithm={algorithm} setAlgorithm={setAlgorithm} />
              
              <Separator className="my-2" />
              
              <div className="space-y-2">
                <Button onClick={processPortfolio} disabled={isProcessing || !uploadedFile} className="w-full">
                  {isProcessing ? <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </> : <>
                      <Play className="mr-2 h-4 w-4" />
                      Process Data
                    </>}
                </Button>
                
                <Button variant="outline" onClick={() => setActiveTab('upload')} className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New File
                </Button>
              </div>
              
              {uploadedFile && <div className="text-sm space-y-1 mt-4">
                  <p className="font-medium">Current File:</p>
                  <p className="text-muted-foreground truncate">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">About</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-muted-foreground">
                This tool uses Markowitz portfolio theory to calculate the minimum variance portfolio based on your property returns and correlation data.
              </p>
              <p className="text-muted-foreground mt-2">
                The quantum option is a demonstration feature that currently falls back to classical methods.
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="upload">Upload Data</TabsTrigger>
              <TabsTrigger value="results" disabled={!portfolioResult}>Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-0">
              <FileUpload onFileAccepted={handleFileAccepted} />
            </TabsContent>
            
            <TabsContent value="results" className="mt-0">
              <PortfolioResults result={portfolioResult} algorithm={algorithm} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>;
};
export default Index;
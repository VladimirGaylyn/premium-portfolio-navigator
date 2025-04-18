import React, { useState } from 'react';
import { Shield, Upload, Calculator, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import FileUpload from '@/components/FileUpload';
import AlgorithmToggle from '@/components/AlgorithmToggle';
import PortfolioResults from '@/components/PortfolioResults';
import AvengersHeader from '@/components/AvengersHeader';
import { ExcelData, parseExcelFile } from '@/utils/excel-parser';
import { PortfolioResult, classicalOptimization, quantumOptimization, bruteForceOptimization } from '@/utils/portfolio-optimizer';
import { Link } from "react-router-dom";
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [algorithm, setAlgorithm] = useState<'classical' | 'quantum' | 'bruteForce'>('classical');
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const {
    toast: uiToast
  } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
  };

  const handleAlgorithmChange = (value: 'classical' | 'quantum' | 'bruteForce') => {
    setAlgorithm(value);
    setResult(null);
  };

  const handleProcess = async () => {
    if (!file) {
      toast.error('Please upload an Excel file first');
      return;
    }
    setIsProcessing(true);
    try {
      const data = await parseExcelFile(file);

      let portfolioResult: PortfolioResult;
      switch (algorithm) {
        case 'bruteForce':
          portfolioResult = bruteForceOptimization(data);
          break;
        case 'quantum':
          portfolioResult = quantumOptimization(data);
          break;
        case 'classical':
        default:
          portfolioResult = classicalOptimization(data);
          break;
      }
      setResult(portfolioResult);
      toast.success('Portfolio optimization completed successfully!');
    } catch (error) {
      console.error('Optimization error:', error);
      uiToast({
        variant: "destructive",
        title: "Optimization Failed",
        description: error instanceof Error ? error.message : "An error occurred during optimization"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <AvengersHeader />
      
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          onClick={() => navigate("/setup")}
          className="flex items-center gap-2"
        >
          <Settings size={16} /> Portfolio Settings
        </Button>
      </div>
      
      <div className="avengers-container">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="avengers-card overflow-visible shield-bg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-avengers-red" />
                  <CardTitle>Data Upload</CardTitle>
                </div>
                <CardDescription>
                  Upload your Excel file containing Returns and Correlation data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onFileAccepted={handleFileChange} />
              </CardContent>
            </Card>

            <Card className="avengers-card-alt overflow-visible">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-avengers-gold" />
                  <CardTitle>Optimization Settings</CardTitle>
                </div>
                <CardDescription>
                  Select algorithm type and processing options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Algorithm Selection</label>
                    <AlgorithmToggle algorithm={algorithm} setAlgorithm={handleAlgorithmChange} />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="avengers-button w-full" onClick={handleProcess} disabled={!file || isProcessing}>
                  {isProcessing ? <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div> : <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Run Optimization
                    </div>}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {result ? <PortfolioResults result={result} algorithm={algorithm} /> : <div className="h-full flex items-center justify-center p-10">
                <div className="text-center max-w-md">
                  <div className="mx-auto w-16 h-16 mb-4 relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-avengers-red via-avengers-blue to-avengers-gold p-[3px]">
                      <div className="h-full w-full rounded-full bg-card flex items-center justify-center" style={{
                    backgroundImage: `url(/lovable-uploads/d67a6a41-87ad-4ce2-939a-a1a30d52c695.png)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                        
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Avengers Portfolio Optimizer</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload your property data and run the optimization to generate the ideal portfolio allocation.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-center text-sm">
                    <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                      <div className="text-avengers-red font-semibold">Step 1</div>
                      <div className="text-muted-foreground">Upload Excel File</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                      <div className="text-avengers-blue font-semibold">Step 2</div>
                      <div className="text-muted-foreground">Run Optimization</div>
                    </div>
                  </div>
                </div>
              </div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

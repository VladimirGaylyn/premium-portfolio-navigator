
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import AvengersHeader from "@/components/AvengersHeader";

interface PortfolioSetupOptions {
  minAssets: number;
  maxAssetsPercentage: number;
}

// Get stored options or use defaults
const getStoredOptions = (): PortfolioSetupOptions => {
  const storedOptions = localStorage.getItem("portfolioOptions");
  if (storedOptions) {
    return JSON.parse(storedOptions);
  }
  return {
    minAssets: 2,
    maxAssetsPercentage: 20,
  };
};

export default function Setup() {
  const navigate = useNavigate();
  const [options, setOptions] = useState<PortfolioSetupOptions>(getStoredOptions);

  const handleMinAssetsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) return;
    
    setOptions((prev) => ({
      ...prev,
      minAssets: value,
    }));
  };

  const handleMaxPercentageChange = (value: number[]) => {
    setOptions((prev) => ({
      ...prev,
      maxAssetsPercentage: value[0],
    }));
  };

  const saveSettings = () => {
    localStorage.setItem("portfolioOptions", JSON.stringify(options));
    toast.success("Portfolio settings saved successfully!");
    navigate("/");
  };

  return (
    <div className="container mx-auto py-6">
      <AvengersHeader />
      
      <Card className="max-w-md mx-auto mt-8 p-6">
        <h2 className="text-2xl font-bold mb-6">Portfolio Optimization Settings</h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="minAssets">Minimum Number of Assets</Label>
            <Input
              id="minAssets"
              type="number"
              min={1}
              value={options.minAssets}
              onChange={handleMinAssetsChange}
            />
            <p className="text-sm text-muted-foreground">
              The minimum number of assets to include in optimized portfolios
            </p>
          </div>

          <div className="space-y-2">
            <Label>Maximum Assets (% of total)</Label>
            <Slider
              value={[options.maxAssetsPercentage]}
              onValueChange={handleMaxPercentageChange}
              min={5}
              max={50}
              step={5}
              className="py-4"
            />
            <p className="text-sm text-muted-foreground">
              {options.maxAssetsPercentage}% of total assets (limits portfolio size)
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              Cancel
            </Button>
            <Button onClick={saveSettings}>
              Save Settings
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

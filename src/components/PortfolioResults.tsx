
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PortfolioResult } from '@/utils/portfolio-optimizer';
import { Shield, Zap, Target } from 'lucide-react';

interface PortfolioResultsProps {
  result: PortfolioResult | null;
  algorithm: 'classical' | 'quantum' | 'bruteForce';
}

const PortfolioResults = ({ result, algorithm }: PortfolioResultsProps) => {
  if (!result) return null;

  const { weights, expectedReturn, variance, processingTimeMs } = result;
  
  // Sort weights from highest to lowest for better visualization
  const sortedWeights = [...weights].sort((a, b) => b.weight - a.weight);
  
  // Prepare data for chart - ONLY include properties with non-zero weights
  const chartData = sortedWeights
    .filter(({ weight }) => weight > 0)
    .map(({ property, weight }) => ({
      name: property,
      weight: weight * 100, // Convert to percentage
    }));

  // Get the algorithm display name and badge style
  const getAlgorithmDisplay = () => {
    switch (algorithm) {
      case 'bruteForce':
        return {
          label: 'Brute Force Algorithm',
          style: 'bg-avengers-green/10 text-avengers-green border-avengers-green/30'
        };
      case 'quantum':
        return {
          label: 'Quantum Algorithm (Fallback)',
          style: 'bg-avengers-purple/10 text-avengers-purple border-avengers-purple/30'
        };
      case 'classical':
      default:
        return {
          label: 'Classical Algorithm',
          style: 'bg-avengers-blue/10 text-avengers-blue border-avengers-blue/30'
        };
    }
  };

  const algorithmDisplay = getAlgorithmDisplay();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-avengers-red" />
          <h3 className="text-lg font-medium">Optimization Results</h3>
        </div>
        <Badge 
          variant="outline" 
          className={`font-medium ${algorithmDisplay.style}`}
        >
          {algorithmDisplay.label}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Portfolio Metrics Card */}
        <Card className="avengers-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-avengers-red" />
              <CardTitle className="text-base">Portfolio Metrics</CardTitle>
            </div>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-avengers-green" />
                  Expected Return
                </dt>
                <dd className="text-2xl font-bold text-avengers-green">{(expectedReturn * 100).toFixed(2)}%</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-avengers-blue" />
                  Portfolio Variance
                </dt>
                <dd className="text-2xl font-bold text-avengers-blue">{variance.toFixed(4)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Processing Time</dt>
                <dd className="text-xl font-medium">{processingTimeMs} ms</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        {/* Portfolio Weights Chart */}
        <Card className="md:col-span-2 avengers-card-alt tech-pattern">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-avengers-gold" />
              <CardTitle className="text-base">Portfolio Allocation</CardTitle>
            </div>
            <CardDescription>Optimal asset weights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 5, bottom: 35 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.7)' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 'dataMax + 5']}
                    tick={{ fill: 'rgba(255,255,255,0.7)' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Weight']} 
                    labelFormatter={(label) => `Property: ${label}`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(30, 30, 30, 0.9)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '4px'
                    }}
                  />
                  <Bar dataKey="weight" name="Weight">
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.weight > 50 
                          ? '#E23636' // red for high weights
                          : entry.weight > 20 
                            ? '#0D61F2' // blue for medium weights
                            : entry.weight > 0 
                              ? '#F2BD1B' // gold for low weights
                              : '#dc2626' // red for negative
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Portfolio Weights Table */}
      <Card className="avengers-border tech-pattern">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-avengers-gold" />
            <CardTitle className="text-base">Detailed Portfolio Weights</CardTitle>
          </div>
          <CardDescription>Property-by-property allocation breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 font-medium text-muted-foreground">Property</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Expected Return</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Weight</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Allocation %</th>
                </tr>
              </thead>
              <tbody>
                {sortedWeights.map(({ property, weight, expectedReturn }, index) => (
                  <tr key={property} className={`border-b border-border/30 hover:bg-muted/20 ${index % 2 === 0 ? 'bg-muted/10' : ''}`}>
                    <td className="py-2 text-left">{property}</td>
                    <td className="py-2 text-right font-mono text-avengers-green">
                      {(expectedReturn * 100).toFixed(2)}%
                    </td>
                    <td className="py-2 text-right font-mono text-avengers-blue">{weight.toFixed(4)}</td>
                    <td className={`py-2 text-right font-mono ${
                      weight > 0.5 ? 'text-avengers-red' : 
                      weight > 0.2 ? 'text-avengers-blue' : 
                      'text-avengers-gold'
                    }`}>
                      {(weight * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioResults;

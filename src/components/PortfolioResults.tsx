
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PortfolioResult } from '@/utils/portfolio-optimizer';

interface PortfolioResultsProps {
  result: PortfolioResult | null;
  algorithm: 'classical' | 'quantum';
}

const PortfolioResults = ({ result, algorithm }: PortfolioResultsProps) => {
  if (!result) return null;

  const { weights, expectedReturn, variance, processingTimeMs } = result;
  
  // Sort weights from highest to lowest for better visualization
  const sortedWeights = [...weights].sort((a, b) => b.weight - a.weight);
  
  // Prepare data for chart
  const chartData = sortedWeights.map(({ property, weight }) => ({
    name: property,
    weight: weight * 100, // Convert to percentage
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Optimization Results</h3>
        <Badge variant="outline" className="font-normal bg-primary/5">
          {algorithm === 'classical' ? 'Classical Algorithm' : 'Quantum Algorithm (Fallback)'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Portfolio Metrics Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Portfolio Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Expected Return</dt>
                <dd className="text-2xl font-bold text-insurance-blue">{(expectedReturn * 100).toFixed(2)}%</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Portfolio Variance</dt>
                <dd className="text-2xl font-bold text-insurance-teal">{variance.toFixed(4)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Processing Time</dt>
                <dd className="text-xl font-medium">{processingTimeMs} ms</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        {/* Portfolio Weights Chart */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Portfolio Allocation</CardTitle>
            <CardDescription>Optimal asset weights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 5, bottom: 35 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 'dataMax + 5']}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Weight']} 
                    labelFormatter={(label) => `Property: ${label}`}
                  />
                  <Bar dataKey="weight" name="Weight">
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.weight > 0 ? '#1a468a' : '#dc2626'}
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Detailed Portfolio Weights</CardTitle>
          <CardDescription>Property-by-property allocation breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Property</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Weight</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Allocation %</th>
                </tr>
              </thead>
              <tbody>
                {sortedWeights.map(({ property, weight }) => (
                  <tr key={property} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-2 text-left">{property}</td>
                    <td className="py-2 text-right font-mono">{weight.toFixed(4)}</td>
                    <td className="py-2 text-right font-mono">{(weight * 100).toFixed(2)}%</td>
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

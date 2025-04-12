
import * as math from 'mathjs';
import { ExcelData, Property } from './excel-parser';

export interface PortfolioResult {
  weights: { property: string; weight: number }[];
  expectedReturn: number;
  variance: number;
  processingTimeMs: number;
}

export const classicalOptimization = (data: ExcelData): PortfolioResult => {
  const startTime = performance.now();
  
  try {
    const { properties, correlationMatrix, propertyNames } = data;
    
    // Treat correlation matrix as covariance matrix (assume unit variances)
    const covarianceMatrix = correlationMatrix;
    
    // Calculate minimum variance portfolio weights
    // Formula: w = (Σ^-1 * 1) / (1^T * Σ^-1 * 1)
    const invCovMatrix = math.inv(covarianceMatrix);
    const ones = Array(properties.length).fill(1);
    
    // Calculate Σ^-1 * 1
    const numerator = math.multiply(invCovMatrix, ones);
    
    // Calculate 1^T * Σ^-1 * 1
    const denominator = math.sum(numerator);
    
    // Calculate weights
    const weights = math.divide(numerator, denominator);
    
    // Calculate expected portfolio return
    const returns = properties.map(p => p.expectedReturn);
    const expectedReturn = math.dot(weights, returns);
    
    // Calculate portfolio variance
    // Formula: Variance = w^T * Σ * w
    const variance = math.multiply(
      math.multiply(weights, covarianceMatrix),
      weights
    );
    
    const endTime = performance.now();
    
    // Format result
    return {
      weights: propertyNames.map((name, i) => ({
        property: name,
        weight: math.round(weights[i] * 100, 4) / 100, // Round to 2 decimal places
      })),
      expectedReturn: math.round(expectedReturn * 10000) / 10000, // Round to 4 decimal places
      variance: math.round(variance * 10000) / 10000, // Round to 4 decimal places
      processingTimeMs: math.round(endTime - startTime)
    };
  } catch (error) {
    console.error('Error in classical optimization:', error);
    throw new Error('Portfolio optimization failed. Please check your data.');
  }
};

export const quantumOptimization = (data: ExcelData): PortfolioResult => {
  // This is a placeholder that falls back to classical optimization
  // In a real implementation, this would use quantum algorithms
  return classicalOptimization(data);
};

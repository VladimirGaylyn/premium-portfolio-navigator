
import * as math from 'mathjs';
import { ExcelData, Property } from './excel-parser';

export interface PortfolioResult {
  weights: { property: string; weight: number; expectedReturn: number }[];
  expectedReturn: number;
  variance: number;
  processingTimeMs: number;
}

// Helper function to generate all combinations of indices
const generateCombinations = (n: number, k: number): number[][] => {
  const result: number[][] = [];
  
  // Recursive helper function to build combinations
  const backtrack = (start: number, current: number[]) => {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    
    for (let i = start; i < n; i++) {
      current.push(i);
      backtrack(i + 1, current);
      current.pop();
    }
  };
  
  backtrack(0, []);
  return result;
};

export const classicalOptimization = (data: ExcelData): PortfolioResult => {
  const startTime = performance.now();
  
  try {
    const { properties, correlationMatrix, propertyNames } = data;
    
    // Use correlation matrix as covariance matrix (assuming unit variances)
    const covarianceMatrix = correlationMatrix;
    const n = properties.length;
    
    // Define maximum number of assets to select (20% of total, minimum 1)
    let maxCount = Math.floor(n * 0.2);
    if (maxCount < 1) maxCount = 1;
    
    // Greedy selection to minimize risk
    const selectedIndices: number[] = [];
    const remainingIndices = Array.from({ length: n }, (_, i) => i);
    
    // Step 1: choose asset with the lowest individual variance (cov[i][i])
    let bestIndex = remainingIndices[0];
    let minVariance = covarianceMatrix[bestIndex][bestIndex];
    for (let i of remainingIndices) {
      if (covarianceMatrix[i][i] < minVariance) {
        minVariance = covarianceMatrix[i][i];
        bestIndex = i;
      }
    }
    selectedIndices.push(bestIndex);
    remainingIndices.splice(remainingIndices.indexOf(bestIndex), 1);
    
    // Step 2: iteratively add the asset that gives the lowest additional risk
    while (selectedIndices.length < maxCount && remainingIndices.length > 0) {
      let candidateIndex: number | null = null;
      let candidateAdditionalRisk = Infinity;
      
      for (let i of remainingIndices) {
        let additionalRisk = covarianceMatrix[i][i];
        for (let j of selectedIndices) {
          additionalRisk += 2 * covarianceMatrix[i][j];
        }
        if (additionalRisk < candidateAdditionalRisk) {
          candidateAdditionalRisk = additionalRisk;
          candidateIndex = i;
        }
      }
      
      if (candidateIndex !== null) {
        selectedIndices.push(candidateIndex);
        remainingIndices.splice(remainingIndices.indexOf(candidateIndex), 1);
      } else {
        break;
      }
    }
    
    // Create a binary weight vector of size n, but then normalize it
    const weights = new Array(n).fill(0);
    for (let idx of selectedIndices) {
      weights[idx] = 1;
    }

    const sumSelected = selectedIndices.length;
    if (sumSelected > 0) {
      // Normalize so that sum of weights = 1
      for (let i = 0; i < n; i++) {
        weights[i] = weights[i] / sumSelected;
      }
    }
    
    // Calculate expected return = sum(w_i * r_i)
    const returns = properties.map(p => p.expectedReturn);
    const expectedReturn = math.dot(weights, returns) as number;
    
    // Calculate portfolio variance = w^T * covarianceMatrix * w
    const tempMultiply = math.multiply(weights, covarianceMatrix) as number[];
    const variance = math.dot(tempMultiply, weights) as number;
    
    const endTime = performance.now();
    
    return {
      weights: propertyNames.map((name, i) => ({
        property: name,
        weight: math.round(weights[i] * 10000) / 10000,
        expectedReturn: properties[i].expectedReturn
      })),
      expectedReturn: math.round(expectedReturn * 10000) / 10000,
      variance: math.round(variance * 10000) / 10000,
      processingTimeMs: math.round(endTime - startTime)
    };
  } catch (error) {
    console.error('Error in classical optimization:', error);
    throw new Error('Portfolio optimization failed. Please check your data.');
  }
};

export const bruteForceOptimization = (data: ExcelData): PortfolioResult => {
  const startTime = performance.now();
  
  try {
    const { properties, correlationMatrix, propertyNames } = data;
    
    // Use correlation matrix as covariance matrix (assuming unit variances)
    const covarianceMatrix = correlationMatrix;
    const n = properties.length;
    
    // Define maximum number of assets to select (20% of total, minimum 1)
    let maxCount = Math.floor(n * 0.2);
    if (maxCount < 1) maxCount = 1;
    
    let bestVariance = Infinity;
    let bestWeights: number[] = [];
    let bestExpectedReturn = 0;
    
    // Iterate through all valid sizes (1 to maxCount)
    for (let size = 1; size <= maxCount; size++) {
      // Generate all combinations of 'size' assets out of n
      const combinations = generateCombinations(n, size);
      
      for (const combination of combinations) {
        // Create a binary weight vector
        const weights = new Array(n).fill(0);
        for (const idx of combination) {
          weights[idx] = 1;
        }
        
        // Normalize so the sum of weights = 1 (i.e., each selected asset weight = 1/size)
        for (let i = 0; i < n; i++) {
          weights[i] = weights[i] / size;
        }
        
        // Calculate portfolio variance
        const tempMultiply = math.multiply(weights, covarianceMatrix) as number[];
        const variance = math.dot(tempMultiply, weights) as number;
        
        // If this combination has lower variance, store it
        if (variance < bestVariance) {
          bestVariance = variance;
          bestWeights = [...weights];
          
          // Calculate expected return for this combination
          const returns = properties.map(p => p.expectedReturn);
          bestExpectedReturn = math.dot(weights, returns) as number;
        }
      }
    }
    
    const endTime = performance.now();
    
    return {
      weights: propertyNames.map((name, i) => ({
        property: name,
        weight: math.round(bestWeights[i] * 10000) / 10000,
        expectedReturn: properties[i].expectedReturn
      })),
      expectedReturn: math.round(bestExpectedReturn * 10000) / 10000,
      variance: math.round(bestVariance * 10000) / 10000,
      processingTimeMs: math.round(endTime - startTime)
    };
  } catch (error) {
    console.error('Error in brute force optimization:', error);
    throw new Error('Brute force optimization failed. Please check your data.');
  }
};

export const quantumOptimization = (data: ExcelData): PortfolioResult => {
  // This is a placeholder function that just calls the classical algorithm.
  // In a real-world scenario, quantum algorithms would be used here.
  return classicalOptimization(data);
};

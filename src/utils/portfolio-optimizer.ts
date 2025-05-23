import * as math from 'mathjs';
import { ExcelData, Property } from './excel-parser';

export interface PortfolioResult {
  weights: { property: string; weight: number; expectedReturn: number; risk: number }[];
  expectedReturn: number;
  variance: number;         // We'll keep variance for reference
  portfolioRisk: number;    // This is the portfolio standard deviation
  objectiveValue: number;   // 20 * portfolioRisk - expectedReturn
  processingTimeMs: number;
}

// Get stored options or use defaults
const getStoredOptions = () => {
  const storedOptions = localStorage.getItem("portfolioOptions");
  if (storedOptions) {
    return JSON.parse(storedOptions);
  }
  return {
    minAssets: 2,
    maxAssetsPercentage: 20,
  };
};

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

// =============================================================================
//  COMMON HELPER: Calculate objective = 20 * stdDev - expectedReturn
//  stdDev is the square root of portfolio variance: sqrt(w^T * Cov * w)
// =============================================================================
const calculateObjective = (weights: number[], covarianceMatrix: number[][], properties: Property[]) => {
  // 1) Portfolio variance
  const tempMultiply = math.multiply(weights, covarianceMatrix) as number[];
  const variance = math.dot(tempMultiply, weights) as number;

  // 2) Portfolio standard deviation
  const stdDev = Math.sqrt(variance);

  // 3) Portfolio expected return
  const returns = properties.map(p => p.expectedReturn);
  const expectedReturn = math.dot(weights, returns) as number;

  // 4) Objective = 20 * stdDev - expectedReturn
  const objectiveValue = 20 * stdDev - expectedReturn;

  return { variance, stdDev, expectedReturn, objectiveValue };
};

// =============================================================================
//  CLASSICAL (Greedy) OPTIMIZATION
// =============================================================================
export const classicalOptimization = (data: ExcelData): PortfolioResult => {
  const startTime = performance.now();
  
  try {
    const { properties, covarianceMatrix, propertyNames } = data;
    const options = getStoredOptions();
    
    const n = properties.length;
    
    // Define maximum number of assets to select (using stored preferences)
    let maxCount = Math.floor(n * (options.maxAssetsPercentage / 100));
    // Ensure we have at least minAssets
    if (maxCount < options.minAssets) {
      maxCount = options.minAssets;
    }
    // Ensure we don't select more assets than available
    if (maxCount > n) {
      maxCount = n;
    }
    
    // Step 1: Pick the asset with the lowest "individual objective"
    // We treat each asset alone: objective = 20 * sqrt(cov[i][i]) - return[i]
    const remainingIndices = Array.from({ length: n }, (_, i) => i);
    let selectedIndices: number[] = [];

    // Start by selecting the single asset with lowest objective alone
    let bestIndex = remainingIndices[0];
    let bestObjVal = 20 * Math.sqrt(covarianceMatrix[bestIndex][bestIndex]) - properties[bestIndex].expectedReturn;
    
    for (const i of remainingIndices) {
      const candidateObjVal = 20 * Math.sqrt(covarianceMatrix[i][i]) - properties[i].expectedReturn;
      if (candidateObjVal < bestObjVal) {
        bestIndex = i;
        bestObjVal = candidateObjVal;
      }
    }
    
    selectedIndices.push(bestIndex);
    remainingIndices.splice(remainingIndices.indexOf(bestIndex), 1);
    
    // Step 2: Iteratively add the asset that yields the best improvement in the objective
    // The approach is: we tentatively add each remaining asset and see how the
    // new objective changes. We pick the asset that *minimizes* the new objective.
    while (selectedIndices.length < maxCount && remainingIndices.length > 0) {
      let candidateIndex: number | null = null;
      let candidateObjective = Infinity;

      // Evaluate adding each "i" from the remainingIndices to the set "selectedIndices"
      for (let i of remainingIndices) {
        const tentativeSelection = [...selectedIndices, i];

        // Build weights: equally distributed among the selected
        const weights = new Array(n).fill(0);
        for (const idx of tentativeSelection) {
          weights[idx] = 1 / tentativeSelection.length;
        }

        // Calculate objective
        const { objectiveValue } = calculateObjective(weights, covarianceMatrix, properties);

        if (objectiveValue < candidateObjective) {
          candidateObjective = objectiveValue;
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
    
    // Build final weights (equally among selected)
    const weights = new Array(n).fill(0);
    for (let idx of selectedIndices) {
      weights[idx] = 1;
    }
    if (selectedIndices.length > 0) {
      for (let i = 0; i < n; i++) {
        weights[i] = weights[i] / selectedIndices.length;
      }
    }

    // Final objective for the chosen set
    const { variance, stdDev, expectedReturn, objectiveValue } =
      calculateObjective(weights, covarianceMatrix, properties);

    // Calculate individual property risks (standard deviation from covariance matrix diagonal)
    const propertyRisks = covarianceMatrix.map((row, i) => Math.sqrt(row[i]));

    const endTime = performance.now();

    return {
      weights: propertyNames.map((name, i) => ({
        property: name,
        weight: math.round(weights[i] * 10000) / 10000,
        expectedReturn: properties[i].expectedReturn,
        risk: math.round(propertyRisks[i] * 10000) / 10000
      })),
      expectedReturn: math.round(expectedReturn * 10000) / 10000,
      variance: math.round(variance * 10000) / 10000,
      portfolioRisk: math.round(stdDev * 10000) / 10000,
      objectiveValue: math.round(objectiveValue * 10000) / 10000,
      processingTimeMs: math.round(endTime - startTime),
    };
  } catch (error) {
    console.error('Error in classical optimization:', error);
    throw new Error('Portfolio optimization failed. Please check your data.');
  }
};

// =============================================================================
//  BRUTE FORCE OPTIMIZATION
// =============================================================================
export const bruteForceOptimization = (data: ExcelData): PortfolioResult => {
  const startTime = performance.now();
  
  try {
    const { properties, covarianceMatrix, propertyNames } = data;
    const options = getStoredOptions();
    
    const n = properties.length;

    // Define maximum number of assets to select (using stored preferences)
    let maxCount = Math.floor(n * (options.maxAssetsPercentage / 100));
    if (maxCount < options.minAssets) {
      maxCount = options.minAssets;
    }
    if (maxCount > n) {
      maxCount = n;
    }

    let bestObjective = Infinity;
    let bestWeights: number[] = [];
    let bestVariance = 0;
    let bestReturn = 0;
    let bestStdDev = 0;

    // Iterate through all valid sizes (minAssets to maxCount)
    for (let size = options.minAssets; size <= maxCount; size++) {
      // Generate all combinations of 'size' assets out of n
      const combinations = generateCombinations(n, size);

      for (const combination of combinations) {
        // Build weights: 1 for each selected asset, then normalize
        const weights = new Array(n).fill(0);
        for (const idx of combination) {
          weights[idx] = 1;
        }
        for (let i = 0; i < n; i++) {
          weights[i] = weights[i] / size;
        }

        // Calculate objective
        const { variance, stdDev, expectedReturn, objectiveValue } =
          calculateObjective(weights, covarianceMatrix, properties);

        // Keep track of the best (lowest) objective
        if (objectiveValue < bestObjective) {
          bestObjective = objectiveValue;
          bestWeights = [...weights];
          bestVariance = variance;
          bestReturn = expectedReturn;
          bestStdDev = stdDev;
        }
      }
    }

    // Calculate individual property risks
    const propertyRisks = covarianceMatrix.map((row, i) => Math.sqrt(row[i]));

    const endTime = performance.now();

    return {
      weights: propertyNames.map((name, i) => ({
        property: name,
        weight: math.round(bestWeights[i] * 10000) / 10000,
        expectedReturn: properties[i].expectedReturn,
        risk: math.round(propertyRisks[i] * 10000) / 10000
      })),
      expectedReturn: math.round(bestReturn * 10000) / 10000,
      variance: math.round(bestVariance * 10000) / 10000,
      portfolioRisk: math.round(bestStdDev * 10000) / 10000,
      objectiveValue: math.round(bestObjective * 10000) / 10000,
      processingTimeMs: math.round(endTime - startTime),
    };
  } catch (error) {
    console.error('Error in brute force optimization:', error);
    throw new Error('Brute force optimization failed. Please check your data.');
  }
};

// =============================================================================
//  QUANTUM OPTIMIZATION
//  For now, this is just a placeholder that calls classicalOptimization.
// =============================================================================
export const quantumOptimization = (data: ExcelData): PortfolioResult => {
  // This is a placeholder function that uses classical optimization
  return classicalOptimization(data);
};

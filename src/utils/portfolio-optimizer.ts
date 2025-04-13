import * as math from 'mathjs';
import { ExcelData, Property } from './excel-parser';

export interface PortfolioResult {
  weights: { property: string; weight: number; expectedReturn: number; risk: number }[];
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

/**
 * Compute portfolio statistics (variance & expected return) for a given subset of assets.
 *
 * @param indices   The array of selected asset indices.
 * @param data      The ExcelData with covarianceMatrix, properties, etc.
 * @returns         Object with `variance` and `expectedReturn`.
 */
const computePortfolioStats = (indices: number[], data: ExcelData) => {
  const { properties, covarianceMatrix } = data;
  const n = properties.length;

  // If no assets are selected, return zero stats
  if (indices.length === 0) {
    return { variance: 0, expectedReturn: 0 };
  }

  // Construct the weights array and normalize by the number of selected assets
  const weights = new Array(n).fill(0);
  for (const idx of indices) {
    weights[idx] = 1;
  }
  for (let i = 0; i < n; i++) {
    weights[i] = weights[i] / indices.length;
  }

  // Expected return
  const returns = properties.map(p => p.expectedReturn);
  const expectedReturn = math.dot(weights, returns) as number;

  // Variance = w^T * Cov * w
  const tempMultiply = math.multiply(weights, covarianceMatrix) as number[];
  const variance = math.dot(tempMultiply, weights) as number;

  return { variance, expectedReturn };
};

export const classicalOptimization = (data: ExcelData): PortfolioResult => {
  const startTime = performance.now();

  try {
    const { properties, covarianceMatrix, propertyNames } = data;
    const n = properties.length;

    // Determine the maximum number of assets to select (20% of total, minimum 2)
    const maxCount = Math.max(2, Math.floor(n * 0.2));

    // We'll build our selected set greedily based on the combined score = variance - expectedReturn.
    let selectedIndices: number[] = [];
    let bestScore = Infinity;

    // Step 1: Pick the SINGLE asset that has the best (lowest) "variance - return"
    for (let i = 0; i < n; i++) {
      const singleStats = computePortfolioStats([i], data);
      const score = singleStats.variance - singleStats.expectedReturn;
      if (score < bestScore) {
        bestScore = score;
        selectedIndices = [i];
      }
    }

    // Step 2: Iteratively add assets until we reach maxCount or run out of assets
    const remainingIndices = Array.from({ length: n }, (_, i) => i).filter(i => !selectedIndices.includes(i));

    while (selectedIndices.length < maxCount && remainingIndices.length > 0) {
      let candidateIndex: number | null = null;
      let candidateScore = Infinity;

      // For each possible next asset, compute the new portfolio's "variance - return"
      for (const i of remainingIndices) {
        const newCombo = [...selectedIndices, i];
        const { variance, expectedReturn } = computePortfolioStats(newCombo, data);
        const score = variance - expectedReturn;
        if (score < candidateScore) {
          candidateScore = score;
          candidateIndex = i;
        }
      }

      if (candidateIndex !== null) {
        selectedIndices.push(candidateIndex);
        remainingIndices.splice(remainingIndices.indexOf(candidateIndex), 1);
        bestScore = candidateScore;
      } else {
        break;
      }
    }

    // Now we have our selectedIndices. Compute final stats.
    const { variance, expectedReturn } = computePortfolioStats(selectedIndices, data);

    // Final weights (normalized so sum = 1)
    const finalWeights = new Array(n).fill(0);
    for (const idx of selectedIndices) {
      finalWeights[idx] = 1;
    }
    for (let i = 0; i < n; i++) {
      finalWeights[i] = finalWeights[i] / selectedIndices.length;
    }

    // Calculate individual property risks (std dev from covariance matrix diagonal)
    const propertyRisks = covarianceMatrix.map((row, i) => Math.sqrt(row[i]));

    const endTime = performance.now();

    return {
      weights: propertyNames.map((name, i) => ({
        property: name,
        weight: math.round(finalWeights[i] * 10000) / 10000,
        expectedReturn: properties[i].expectedReturn,
        risk: math.round(propertyRisks[i] * 10000) / 10000
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
    const { properties, covarianceMatrix, propertyNames } = data;
    const n = properties.length;

    // Determine the maximum number of assets to select (20% of total, minimum 2)
    const maxCount = Math.max(2, Math.floor(n * 0.2));

    let bestScore = Infinity;
    let bestVariance = Infinity;
    let bestReturn = 0;
    let bestWeights: number[] = [];

    // Iterate over all valid combination sizes (from 2 to maxCount)
    for (let size = 2; size <= maxCount; size++) {
      const combos = generateCombinations(n, size);

      for (const combo of combos) {
        // Compute portfolio stats for this combo
        const { variance, expectedReturn } = computePortfolioStats(combo, data);
        const score = variance - expectedReturn; // Minimizing this

        if (score < bestScore) {
          bestScore = score;
          bestVariance = variance;
          bestReturn = expectedReturn;

          // Build the weight vector
          const weights = new Array(n).fill(0);
          for (const idx of combo) {
            weights[idx] = 1;
          }
          // Normalize
          for (let i = 0; i < n; i++) {
            weights[i] = weights[i] / size;
          }
          bestWeights = weights;
        }
      }
    }

    // Calculate individual property risks (std dev from covariance matrix diagonal)
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
      processingTimeMs: math.round(endTime - startTime)
    };
  } catch (error) {
    console.error('Error in brute force optimization:', error);
    throw new Error('Brute force optimization failed. Please check your data.');
  }
};

/**
 * Placeholder for quantumOptimization. 
 * For demonstration, this just calls the new classical approach 
 * that balances both risk and return in a single score.
 */
export const quantumOptimization = (data: ExcelData): PortfolioResult => {
  return classicalOptimization(data);
};

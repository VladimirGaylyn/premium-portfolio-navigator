
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

export const classicalOptimization = (data: ExcelData): PortfolioResult => {
  const startTime = performance.now();
  
  try {
    // Извлекаем свойства, матрицу ковариаций и имена свойств
    const { properties, covarianceMatrix, propertyNames } = data;
    const n = properties.length;
    
    // Определяем максимальное число активов для выбора (20% от общего количества, минимум 1)
    let maxCount = Math.floor(n * 0.2);
    if (maxCount < 1) maxCount = 1;
    
    // Жадный алгоритм для минимизации риска
    const selectedIndices: number[] = [];
    const remainingIndices = Array.from({ length: n }, (_, i) => i);
    
    // Шаг 1: выбираем актив с наименьшей дисперсией (cov[i][i])
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
    
    // Шаг 2: итеративно добавляем актив, который минимизирует дополнительный риск
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
    
    // Создаем бинарный вектор весов размером n, затем нормализуем его
    const weights = new Array(n).fill(0);
    for (let idx of selectedIndices) {
      weights[idx] = 1;
    }

    const sumSelected = selectedIndices.length;
    if (sumSelected > 0) {
      // Нормировка так, чтобы сумма весов была равна 1
      for (let i = 0; i < n; i++) {
        weights[i] = weights[i] / sumSelected;
      }
    }
    
    // Вычисляем ожидаемую доходность = сумма(w_i * r_i)
    const returns = properties.map(p => p.expectedReturn);
    const expectedReturn = math.dot(weights, returns) as number;
    
    // Вычисляем дисперсию портфеля = w^T * covarianceMatrix * w
    const tempMultiply = math.multiply(weights, covarianceMatrix) as number[];
    const variance = math.dot(tempMultiply, weights) as number;
    
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
    // Извлекаем свойства, матрицу ковариаций и имена свойств
    const { properties, covarianceMatrix, propertyNames } = data;
    const n = properties.length;
    
    // Определяем максимальное число активов для выбора (20% от общего количества, минимум 1)
    let maxCount = Math.floor(n * 0.2);
    if (maxCount < 1) maxCount = 1;
    
    let bestVariance = Infinity;
    let bestWeights: number[] = [];
    let bestExpectedReturn = 0;
    
    // Перебираем все допустимые размеры комбинаций (от 1 до maxCount)
    for (let size = 1; size <= maxCount; size++) {
      // Генерируем все комбинации из 'size' активов из n
      const combinations = generateCombinations(n, size);
      
      for (const combination of combinations) {
        // Создаем бинарный вектор весов
        const weights = new Array(n).fill(0);
        for (const idx of combination) {
          weights[idx] = 1;
        }
        
        // Нормируем так, чтобы сумма весов = 1 (каждому выбранному активу назначается вес 1/size)
        for (let i = 0; i < n; i++) {
          weights[i] = weights[i] / size;
        }
        
        // Вычисляем дисперсию портфеля
        const tempMultiply = math.multiply(weights, covarianceMatrix) as number[];
        const variance = math.dot(tempMultiply, weights) as number;
        
        // Если эта комбинация имеет меньшую дисперсию, сохраняем её
        if (variance < bestVariance) {
          bestVariance = variance;
          bestWeights = [...weights];
          
          // Вычисляем ожидаемую доходность для этой комбинации
          const returns = properties.map(p => p.expectedReturn);
          bestExpectedReturn = math.dot(weights, returns) as number;
        }
      }
    }
    
    // Calculate individual property risks (standard deviation from covariance matrix diagonal)
    const propertyRisks = covarianceMatrix.map((row, i) => Math.sqrt(row[i]));
    
    const endTime = performance.now();
    
    return {
      weights: propertyNames.map((name, i) => ({
        property: name,
        weight: math.round(bestWeights[i] * 10000) / 10000,
        expectedReturn: properties[i].expectedReturn,
        risk: math.round(propertyRisks[i] * 10000) / 10000
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
  // Заглушка – здесь вызывается классическая оптимизация.
  // В реальных сценариях можно внедрить квантовые алгоритмы.
  return classicalOptimization(data);
};

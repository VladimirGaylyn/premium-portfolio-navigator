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
    
    // Используем матрицу корреляций как ковариационную (при предположении единичных дисперсий)
    const covarianceMatrix = correlationMatrix;
    const n = properties.length;
    
    // Определяем максимальное количество выбираемых активов (не более 10% от общего количества, минимум 1)
    let maxCount = Math.floor(n * 0.1);
    if (maxCount < 1) maxCount = 1;
    
    // Жадный алгоритм выбора активов для минимизации риска
    const selectedIndices: number[] = [];
    const remainingIndices = Array.from({ length: n }, (_, i) => i);
    
    // Шаг 1: Выбираем актив с минимальной индивидуальной дисперсией (cov[i][i])
    let bestIndex = remainingIndices[0];
    let minVariance = covarianceMatrix[bestIndex][bestIndex];
    for (let i of remainingIndices) {
      if (covarianceMatrix[i][i] < minVariance) {
        minVariance = covarianceMatrix[i][i];
        bestIndex = i;
      }
    }
    selectedIndices.push(bestIndex);
    // Удаляем выбранный индекс из оставшихся
    const indexToRemove = remainingIndices.indexOf(bestIndex);
    if (indexToRemove > -1) {
      remainingIndices.splice(indexToRemove, 1);
    }
    
    // Шаг 2: Итеративно добавляем актив, минимизирующий прирост риска
    // Прирост риска для добавления актива i = covarianceMatrix[i][i] + 2 * сумма(covarianceMatrix[i][j]) для всех j в выбранном наборе
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
        const idx = remainingIndices.indexOf(candidateIndex);
        if (idx > -1) {
          remainingIndices.splice(idx, 1);
        }
      } else {
        break;
      }
    }
    
    // Формируем бинарный вектор весов: 1 для выбранных активов, 0 для остальных
    const weights = new Array(n).fill(0);
    for (let idx of selectedIndices) {
      weights[idx] = 1;
    }
    
    // Рассчитываем ожидаемую доходность = сумма(weight * expectedReturn) для каждого актива
    const returns = properties.map(p => p.expectedReturn);
    const expectedReturn = math.dot(weights, returns) as number;
    
    // Рассчитываем риск портфеля = w^T * covarianceMatrix * w
    const tempMultiply = math.multiply(weights, covarianceMatrix) as number[];
    const variance = math.dot(tempMultiply, weights) as number;
    
    const endTime = performance.now();
    
    return {
      weights: propertyNames.map((name, i) => ({
        property: name,
        weight: weights[i], // Бинарное значение: 0 или 1
      })),
      expectedReturn: math.round(expectedReturn * 10000) / 10000, // Округление до 4 знаков
      variance: math.round(variance * 10000) / 10000, // Округление до 4 знаков
      processingTimeMs: math.round(endTime - startTime)
    };
  } catch (error) {
    console.error('Error in classical optimization:', error);
    throw new Error('Portfolio optimization failed. Please check your data.');
  }
};

export const quantumOptimization = (data: ExcelData): PortfolioResult => {
  // Это заглушка, которая использует классический алгоритм.
  // В реальной реализации здесь применялись бы квантовые алгоритмы.
  return classicalOptimization(data);
};


import * as math from 'mathjs';
import { ExcelData } from './excel-parser';

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

    // Используем матрицу корреляций как ковариационную (при условии единичных дисперсий)
    const covarianceMatrix = correlationMatrix;

    const n = properties.length;
    // Максимальное количество выбранных активов – не более 10% (хотя бы 1, если активов мало)
    const maxAssets = Math.max(1, Math.floor(n * 0.1));

    // Инициализируем бинарный вектор для выбора активов (0 – не выбран, 1 – выбран)
    const selection: number[] = Array(n).fill(0);
    // Массив для хранения индексов выбранных активов (для удобства вычислений)
    const selectedIndices: number[] = [];
    // Текущий риск портфеля (суммарное значение ковариаций по выбранным активам)
    let currentRisk = 0;

    // Жадный алгоритм: пошагово добавляем актив, минимизирующий прирост риска
    while (selectedIndices.length < maxAssets) {
      let bestAsset = -1;
      let bestMarginalRisk = Infinity;

      for (let i = 0; i < n; i++) {
        if (selection[i] === 0) { // актив ещё не выбран
          // Расчитываем прирост риска при добавлении актива i:
          // Новый риск при S U {i} = текущий риск + 2*сумма(ковариаций актив i с уже выбранными) + ковариация самого актива (диагональный элемент)
          let marginalRisk = covarianceMatrix[i][i]; // ковариация актива с самим собой (обычно равна 1)
          for (const j of selectedIndices) {
            marginalRisk += 2 * covarianceMatrix[i][j];
          }

          if (marginalRisk < bestMarginalRisk) {
            bestMarginalRisk = marginalRisk;
            bestAsset = i;
          }
        }
      }

      // Если актив найден, добавляем его
      if (bestAsset !== -1) {
        selection[bestAsset] = 1;
        selectedIndices.push(bestAsset);
        // Обновляем совокупный риск выбранного портфеля:
        // При добавлении активa i риск увеличивается на bestMarginalRisk
        currentRisk += bestMarginalRisk;
      } else {
        // Если никакой актив не найден (неожиданный случай), выходим из цикла
        break;
      }
    }

    // Расчёт ожидаемой доходности портфеля:
    // Суммируем ожидаемые доходности для всех выбранных активов.
    // (При бинарном выборе можно трактовать это как суммарную доходность; если нужно усреднить, можно поделить на количество выбранных активов.)
    const returns = properties.map(p => p.expectedReturn);
    let expectedReturn = 0;
    for (let i = 0; i < n; i++) {
      if (selection[i] === 1) {
        expectedReturn += returns[i];
      }
    }

    const endTime = performance.now();

    return {
      weights: propertyNames.map((name, i) => ({
        property: name,
        weight: selection[i] // значение 1 или 0
      })),
      expectedReturn: math.round(expectedReturn * 10000) / 10000, // округление до 4 знаков после запятой
      variance: math.round(currentRisk * 10000) / 10000,         // округление до 4 знаков после запятой
      processingTimeMs: math.round(endTime - startTime)
    };

  } catch (error) {
    console.error('Error in binary optimization:', error);
    throw new Error('Portfolio optimization failed. Please check your data.');
  }
};

// Add the missing quantumOptimization function
export const quantumOptimization = (data: ExcelData): PortfolioResult => {
  // This is a fallback implementation that uses the classical algorithm
  // In a real implementation, this would use quantum algorithms
  return classicalOptimization(data);
};

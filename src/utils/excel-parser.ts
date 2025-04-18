import * as XLSX from 'xlsx';

export interface Property {
  name: string;
  expectedReturn: number;
}

export interface ExcelData {
  properties: Property[];
  covarianceMatrix: number[][];  // Изменено название поля на covarianceMatrix
  propertyNames: string[];
}

export const parseExcelFile = (file: File): Promise<ExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Проверяем наличие требуемых листов: "Returns" и "Covariance"
        if (!workbook.SheetNames.includes('Returns') || !workbook.SheetNames.includes('Covariance')) {
          reject(new Error('Excel file must contain both "Returns" and "Covariance" sheets'));
          return;
        }
        
        // Парсим лист Returns
        const returnsSheet = workbook.Sheets['Returns'];
        const returnsData = XLSX.utils.sheet_to_json<{ Property: string; 'Expected Return': number }>(returnsSheet);
        
        if (returnsData.length === 0) {
          reject(new Error('Returns sheet is empty or improperly formatted'));
          return;
        }
        
        const properties: Property[] = returnsData.map(row => ({
          name: row.Property,
          expectedReturn: row['Expected Return']
        }));
        
        const propertyNames = properties.map(p => p.name);
        
        // Парсим лист Covariance
        const covarianceSheet = workbook.Sheets['Covariance'];
        const covarianceData = XLSX.utils.sheet_to_json(covarianceSheet);
        
        if (covarianceData.length === 0 || covarianceData.length !== properties.length) {
          reject(new Error('Covariance matrix is empty or does not match the number of properties'));
          return;
        }
        
        // Извлекаем матрицу ковариаций (предполагается, что первый столбец содержит имена активов)
        const covarianceMatrix = covarianceData.map(row => {
          const rowData = Object.values(row).slice(1); // Пропускаем первый столбец (имя активa)
          if (rowData.length !== properties.length) {
            throw new Error('Covariance matrix is not square or does not match the number of properties');
          }
          return rowData.map(value => Number(value));
        });
        
        resolve({
          properties,
          covarianceMatrix,
          propertyNames
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading the file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export const validateExcelFile = (file: File): boolean => {
  const allowedExtensions = ['.xlsx', '.xls'];
  const fileName = file.name.toLowerCase();
  return allowedExtensions.some(ext => fileName.endsWith(ext));
};


import * as XLSX from 'xlsx';

export interface Property {
  name: string;
  expectedReturn: number;
}

export interface ExcelData {
  properties: Property[];
  correlationMatrix: number[][];
  propertyNames: string[];
}

export const parseExcelFile = (file: File): Promise<ExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Check if required sheets exist
        if (!workbook.SheetNames.includes('Returns') || !workbook.SheetNames.includes('Correlation')) {
          reject(new Error('Excel file must contain both "Returns" and "Correlation" sheets'));
          return;
        }
        
        // Parse Returns sheet
        const returnsSheet = workbook.Sheets['Returns'];
        const returnsData = XLSX.utils.sheet_to_json<{Property: string; 'Expected Return': number}>(returnsSheet);
        
        if (returnsData.length === 0) {
          reject(new Error('Returns sheet is empty or improperly formatted'));
          return;
        }
        
        const properties: Property[] = returnsData.map(row => ({
          name: row.Property,
          expectedReturn: row['Expected Return']
        }));
        
        const propertyNames = properties.map(p => p.name);
        
        // Parse Correlation sheet
        const correlationSheet = workbook.Sheets['Correlation'];
        const correlationData = XLSX.utils.sheet_to_json(correlationSheet);
        
        if (correlationData.length === 0 || correlationData.length !== properties.length) {
          reject(new Error('Correlation matrix is empty or does not match the number of properties'));
          return;
        }
        
        // Extract correlation matrix, assuming first column contains property names
        const correlationMatrix = correlationData.map(row => {
          const rowData = Object.values(row).slice(1); // Skip first column (property name)
          if (rowData.length !== properties.length) {
            throw new Error('Correlation matrix is not square or does not match the number of properties');
          }
          return rowData.map(value => Number(value));
        });
        
        resolve({
          properties,
          correlationMatrix,
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

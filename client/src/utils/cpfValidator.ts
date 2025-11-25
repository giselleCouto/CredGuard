/**
 * Validação de CPF no frontend
 * Mesma lógica do backend para consistência
 */

/**
 * Remove caracteres não numéricos do CPF
 */
function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Verifica se o CPF tem apenas dígitos repetidos
 */
function hasRepeatedDigits(cpf: string): boolean {
  const firstDigit = cpf[0];
  return cpf.split('').every(digit => digit === firstDigit);
}

/**
 * Calcula dígito verificador do CPF
 */
function calculateDigit(cpf: string, position: number): number {
  let sum = 0;
  let multiplier = position + 1;
  
  for (let i = 0; i < position; i++) {
    sum += parseInt(cpf[i]) * multiplier;
    multiplier--;
  }
  
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Valida CPF completo
 */
export function validateCPF(cpf: string): boolean {
  if (!cpf || typeof cpf !== 'string') {
    return false;
  }
  
  const cleanedCPF = cleanCPF(cpf);
  
  if (cleanedCPF.length !== 11) {
    return false;
  }
  
  if (hasRepeatedDigits(cleanedCPF)) {
    return false;
  }
  
  const firstDigit = calculateDigit(cleanedCPF, 9);
  if (firstDigit !== parseInt(cleanedCPF[9])) {
    return false;
  }
  
  const secondDigit = calculateDigit(cleanedCPF, 10);
  if (secondDigit !== parseInt(cleanedCPF[10])) {
    return false;
  }
  
  return true;
}

/**
 * Formata CPF para o padrão XXX.XXX.XXX-XX
 */
export function formatCPF(cpf: string): string {
  const cleanedCPF = cleanCPF(cpf);
  
  if (cleanedCPF.length !== 11) {
    return cpf; // Retorna original se não tiver 11 dígitos
  }
  
  return cleanedCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CPF enquanto o usuário digita
 * Adiciona pontos e traço automaticamente
 */
export function formatCPFOnInput(value: string): string {
  const cleaned = cleanCPF(value);
  
  // Limita a 11 dígitos
  const limited = cleaned.substring(0, 11);
  
  // Formata progressivamente
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.substring(0, 3)}.${limited.substring(3)}`;
  } else if (limited.length <= 9) {
    return `${limited.substring(0, 3)}.${limited.substring(3, 6)}.${limited.substring(6)}`;
  } else {
    return `${limited.substring(0, 3)}.${limited.substring(3, 6)}.${limited.substring(6, 9)}-${limited.substring(9)}`;
  }
}

/**
 * Valida e retorna mensagem de erro se inválido
 */
export function validateCPFWithMessage(cpf: string): { valid: boolean; message?: string } {
  if (!cpf || cpf.trim() === '') {
    return { valid: false, message: 'CPF é obrigatório' };
  }
  
  const cleanedCPF = cleanCPF(cpf);
  
  if (cleanedCPF.length !== 11) {
    return { valid: false, message: 'CPF deve ter 11 dígitos' };
  }
  
  if (hasRepeatedDigits(cleanedCPF)) {
    return { valid: false, message: 'CPF com dígitos repetidos é inválido' };
  }
  
  const firstDigit = calculateDigit(cleanedCPF, 9);
  if (firstDigit !== parseInt(cleanedCPF[9])) {
    return { valid: false, message: 'Dígito verificador inválido' };
  }
  
  const secondDigit = calculateDigit(cleanedCPF, 10);
  if (secondDigit !== parseInt(cleanedCPF[10])) {
    return { valid: false, message: 'Dígito verificador inválido' };
  }
  
  return { valid: true };
}

/**
 * Valida lista de CPFs de um CSV
 * Retorna CPFs inválidos com linha e motivo
 */
export function validateCPFsInCSV(csvContent: string): {
  valid: boolean;
  invalidCPFs: Array<{ line: number; cpf: string; reason: string }>;
  totalRows: number;
  validRows: number;
} {
  const lines = csvContent.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const cpfIndex = headers.findIndex(h => h === 'cpf');
  
  if (cpfIndex === -1) {
    return {
      valid: false,
      invalidCPFs: [{ line: 0, cpf: '', reason: 'Coluna "cpf" não encontrada no CSV' }],
      totalRows: 0,
      validRows: 0,
    };
  }
  
  const invalidCPFs: Array<{ line: number; cpf: string; reason: string }> = [];
  let validRows = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const cpf = values[cpfIndex];
    
    if (!cpf) {
      invalidCPFs.push({
        line: i + 1,
        cpf: '',
        reason: 'CPF vazio',
      });
      continue;
    }
    
    const validation = validateCPFWithMessage(cpf);
    
    if (!validation.valid) {
      invalidCPFs.push({
        line: i + 1,
        cpf,
        reason: validation.message || 'CPF inválido',
      });
    } else {
      validRows++;
    }
  }
  
  return {
    valid: invalidCPFs.length === 0,
    invalidCPFs,
    totalRows: lines.length - 1,
    validRows,
  };
}

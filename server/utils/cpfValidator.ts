/**
 * Validação robusta de CPF
 * Implementa verificação de formato, dígitos verificadores e CPFs inválidos conhecidos
 */

/**
 * Remove caracteres não numéricos do CPF
 */
function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Verifica se o CPF tem apenas dígitos repetidos
 * Ex: 000.000.000-00, 111.111.111-11, etc.
 */
function hasRepeatedDigits(cpf: string): boolean {
  const firstDigit = cpf[0];
  return cpf.split('').every(digit => digit === firstDigit);
}

/**
 * Calcula dígito verificador do CPF usando algoritmo módulo 11
 */
function calculateDigit(cpf: string, position: number): number {
  let sum = 0;
  let multiplier = position + 1;
  
  for (let i = 0; i < position; i++) {
    sum += parseInt(cpf[i]) * multiplier;
    multiplier--;
  }
  
  const remainder = sum % 11;
  
  // Se resto < 2, dígito é 0, senão é 11 - resto
  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Valida CPF completo
 * 
 * Regras de validação:
 * 1. Deve ter exatamente 11 dígitos após limpeza
 * 2. Não pode ter todos os dígitos iguais (000.000.000-00, 111.111.111-11, etc.)
 * 3. Dígitos verificadores devem estar corretos (algoritmo módulo 11)
 * 
 * @param cpf - CPF com ou sem formatação (ex: "123.456.789-09" ou "12345678909")
 * @returns true se CPF é válido, false caso contrário
 */
export function validateCPF(cpf: string): boolean {
  // Validação básica: CPF deve existir
  if (!cpf || typeof cpf !== 'string') {
    return false;
  }
  
  // Limpar CPF (remover pontos, traços, espaços)
  const cleanedCPF = cleanCPF(cpf);
  
  // Validação de tamanho: deve ter exatamente 11 dígitos
  if (cleanedCPF.length !== 11) {
    return false;
  }
  
  // Validação de dígitos repetidos
  if (hasRepeatedDigits(cleanedCPF)) {
    return false;
  }
  
  // Validação dos dígitos verificadores
  
  // Primeiro dígito verificador (10ª posição)
  const firstDigit = calculateDigit(cleanedCPF, 9);
  if (firstDigit !== parseInt(cleanedCPF[9])) {
    return false;
  }
  
  // Segundo dígito verificador (11ª posição)
  const secondDigit = calculateDigit(cleanedCPF, 10);
  if (secondDigit !== parseInt(cleanedCPF[10])) {
    return false;
  }
  
  return true;
}

/**
 * Formata CPF para o padrão XXX.XXX.XXX-XX
 * 
 * @param cpf - CPF sem formatação (apenas números)
 * @returns CPF formatado ou string vazia se inválido
 */
export function formatCPF(cpf: string): string {
  const cleanedCPF = cleanCPF(cpf);
  
  if (cleanedCPF.length !== 11) {
    return '';
  }
  
  return cleanedCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Valida e formata CPF
 * 
 * @param cpf - CPF com ou sem formatação
 * @returns CPF formatado se válido, null se inválido
 */
export function validateAndFormatCPF(cpf: string): string | null {
  if (!validateCPF(cpf)) {
    return null;
  }
  
  return formatCPF(cpf);
}

/**
 * Ofusca CPF para exibição segura
 * Ex: 123.456.789-09 → ***.***.789-09
 * 
 * @param cpf - CPF com ou sem formatação
 * @returns CPF ofuscado
 */
export function maskCPF(cpf: string): string {
  const cleanedCPF = cleanCPF(cpf);
  
  if (cleanedCPF.length !== 11) {
    return '***.***.***-**';
  }
  
  // Mostra apenas os 3 últimos dígitos antes do hífen e os 2 dígitos verificadores
  return `***.***.${ cleanedCPF.substring(6, 9)}-${cleanedCPF.substring(9, 11)}`;
}

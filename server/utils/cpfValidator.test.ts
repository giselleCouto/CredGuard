import { describe, it, expect } from 'vitest';
import { validateCPF, formatCPF, validateAndFormatCPF, maskCPF } from './cpfValidator';

describe('CPF Validator', () => {
  describe('validateCPF', () => {
    it('deve validar CPFs válidos', () => {
      // CPFs válidos reais
      expect(validateCPF('123.456.789-09')).toBe(true);
      expect(validateCPF('12345678909')).toBe(true);
      expect(validateCPF('111.444.777-35')).toBe(true);
      expect(validateCPF('11144477735')).toBe(true);
    });
    
    it('deve rejeitar CPFs com dígitos repetidos', () => {
      expect(validateCPF('000.000.000-00')).toBe(false);
      expect(validateCPF('111.111.111-11')).toBe(false);
      expect(validateCPF('222.222.222-22')).toBe(false);
      expect(validateCPF('333.333.333-33')).toBe(false);
      expect(validateCPF('444.444.444-44')).toBe(false);
      expect(validateCPF('555.555.555-55')).toBe(false);
      expect(validateCPF('666.666.666-66')).toBe(false);
      expect(validateCPF('777.777.777-77')).toBe(false);
      expect(validateCPF('888.888.888-88')).toBe(false);
      expect(validateCPF('999.999.999-99')).toBe(false);
    });
    
    it('deve rejeitar CPFs com dígitos verificadores incorretos', () => {
      expect(validateCPF('123.456.789-00')).toBe(false); // Dígito correto é 09
      expect(validateCPF('123.456.789-99')).toBe(false);
      expect(validateCPF('111.444.777-00')).toBe(false); // Dígito correto é 35
    });
    
    it('deve rejeitar CPFs com tamanho incorreto', () => {
      expect(validateCPF('123.456.789')).toBe(false); // Faltam dígitos
      expect(validateCPF('123.456.789-0')).toBe(false); // Falta 1 dígito
      expect(validateCPF('123.456.789-099')).toBe(false); // Dígito extra
      expect(validateCPF('')).toBe(false);
    });
    
    it('deve rejeitar valores inválidos', () => {
      expect(validateCPF(null as any)).toBe(false);
      expect(validateCPF(undefined as any)).toBe(false);
      expect(validateCPF(123 as any)).toBe(false);
    });
    
    it('deve aceitar CPF com ou sem formatação', () => {
      expect(validateCPF('123.456.789-09')).toBe(true);
      expect(validateCPF('12345678909')).toBe(true);
      expect(validateCPF('123 456 789 09')).toBe(true);
      expect(validateCPF('123-456-789-09')).toBe(true);
    });
  });
  
  describe('formatCPF', () => {
    it('deve formatar CPF corretamente', () => {
      expect(formatCPF('12345678909')).toBe('123.456.789-09');
      expect(formatCPF('11144477735')).toBe('111.444.777-35');
    });
    
    it('deve retornar string vazia para CPF inválido', () => {
      expect(formatCPF('123')).toBe('');
      expect(formatCPF('123456789099')).toBe('');
    });
    
    it('deve remover formatação existente antes de formatar', () => {
      expect(formatCPF('123.456.789-09')).toBe('123.456.789-09');
      expect(formatCPF('123 456 789 09')).toBe('123.456.789-09');
    });
  });
  
  describe('validateAndFormatCPF', () => {
    it('deve validar e formatar CPF válido', () => {
      expect(validateAndFormatCPF('12345678909')).toBe('123.456.789-09');
      expect(validateAndFormatCPF('123.456.789-09')).toBe('123.456.789-09');
    });
    
    it('deve retornar null para CPF inválido', () => {
      expect(validateAndFormatCPF('000.000.000-00')).toBe(null);
      expect(validateAndFormatCPF('123.456.789-00')).toBe(null);
      expect(validateAndFormatCPF('123')).toBe(null);
    });
  });
  
  describe('maskCPF', () => {
    it('deve ofuscar CPF corretamente', () => {
      expect(maskCPF('123.456.789-09')).toBe('***.***.789-09');
      expect(maskCPF('12345678909')).toBe('***.***.789-09');
    });
    
    it('deve retornar máscara padrão para CPF inválido', () => {
      expect(maskCPF('123')).toBe('***.***.***-**');
      expect(maskCPF('')).toBe('***.***.***-**');
    });
  });
});

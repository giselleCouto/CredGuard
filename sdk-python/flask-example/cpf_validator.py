"""
Validador de CPF para Python
Implementa o algoritmo oficial da Receita Federal do Brasil
Validação completa com dígitos verificadores usando módulo 11
"""

import re
from typing import Tuple


class CPFValidator:
    """
    Validador de CPF brasileiro com verificação de dígitos verificadores.
    
    Implementa o algoritmo oficial da Receita Federal:
    - Primeiro dígito: soma dos 9 primeiros dígitos × pesos 10-2, módulo 11
    - Segundo dígito: soma dos 9 primeiros dígitos × pesos 11-3 + primeiro dígito × 2, módulo 11
    """
    
    def __init__(self):
        """Inicializa o validador de CPF."""
        pass
    
    def validate(self, cpf: str) -> Tuple[bool, str]:
        """
        Valida um CPF completo.
        
        Args:
            cpf: CPF a ser validado (com ou sem formatação)
            
        Returns:
            Tupla (válido, mensagem_erro)
            - válido: True se CPF válido, False caso contrário
            - mensagem_erro: Descrição do erro (vazio se válido)
            
        Examples:
            >>> validator = CPFValidator()
            >>> validator.validate('12345678909')
            (True, '')
            >>> validator.validate('12345678900')
            (False, 'CPF inválido: dígitos verificadores incorretos')
        """
        # Verificar se CPF não está vazio
        if not cpf or not cpf.strip():
            return False, 'CPF não pode estar vazio'
        
        # Remover formatação (.-/)
        clean_cpf = self._clean_cpf(cpf)
        
        # Validar comprimento
        if len(clean_cpf) != 11:
            return False, f'CPF deve ter 11 dígitos (encontrado: {len(clean_cpf)})'
        
        # Verificar se todos são dígitos
        if not clean_cpf.isdigit():
            return False, 'CPF deve conter apenas números'
        
        # Verificar sequência de números iguais
        if self._is_sequence(clean_cpf):
            return False, 'CPF inválido: sequência de números iguais'
        
        # Validar dígitos verificadores
        if not self._validate_digits(clean_cpf):
            return False, 'CPF inválido: dígitos verificadores incorretos'
        
        return True, ''
    
    def _clean_cpf(self, cpf: str) -> str:
        """
        Remove formatação do CPF.
        
        Args:
            cpf: CPF com ou sem formatação
            
        Returns:
            CPF apenas com dígitos
            
        Examples:
            >>> validator = CPFValidator()
            >>> validator._clean_cpf('123.456.789-09')
            '12345678909'
        """
        return re.sub(r'\D', '', cpf)
    
    def _is_sequence(self, cpf: str) -> bool:
        """
        Verifica se o CPF é uma sequência de números iguais.
        
        Args:
            cpf: CPF limpo (apenas dígitos)
            
        Returns:
            True se for sequência, False caso contrário
            
        Examples:
            >>> validator = CPFValidator()
            >>> validator._is_sequence('11111111111')
            True
            >>> validator._is_sequence('12345678909')
            False
        """
        return len(set(cpf)) == 1
    
    def _validate_digits(self, cpf: str) -> bool:
        """
        Valida os dígitos verificadores do CPF.
        
        Implementa o algoritmo oficial da Receita Federal usando módulo 11.
        
        Args:
            cpf: CPF limpo com 11 dígitos
            
        Returns:
            True se dígitos verificadores corretos, False caso contrário
            
        Algorithm:
            Primeiro dígito verificador:
            1. Multiplicar cada um dos 9 primeiros dígitos por pesos 10-2
            2. Somar todos os resultados
            3. Calcular resto da divisão por 11
            4. Se resto < 2: dígito = 0, senão: dígito = 11 - resto
            
            Segundo dígito verificador:
            1. Multiplicar cada um dos 9 primeiros dígitos por pesos 11-3
            2. Multiplicar o primeiro dígito verificador por 2
            3. Somar todos os resultados
            4. Calcular resto da divisão por 11
            5. Se resto < 2: dígito = 0, senão: dígito = 11 - resto
            
        Examples:
            >>> validator = CPFValidator()
            >>> validator._validate_digits('12345678909')
            True
            >>> validator._validate_digits('12345678900')
            False
        """
        # Extrair os 9 primeiros dígitos
        digits = [int(d) for d in cpf[:9]]
        
        # Calcular primeiro dígito verificador
        sum_first = sum(digits[i] * (10 - i) for i in range(9))
        remainder_first = sum_first % 11
        digit_first = 0 if remainder_first < 2 else 11 - remainder_first
        
        # Verificar primeiro dígito
        if digit_first != int(cpf[9]):
            return False
        
        # Calcular segundo dígito verificador
        sum_second = sum(digits[i] * (11 - i) for i in range(9)) + digit_first * 2
        remainder_second = sum_second % 11
        digit_second = 0 if remainder_second < 2 else 11 - remainder_second
        
        # Verificar segundo dígito
        if digit_second != int(cpf[10]):
            return False
        
        return True
    
    def format_cpf(self, cpf: str) -> str:
        """
        Formata um CPF no padrão brasileiro (XXX.XXX.XXX-XX).
        
        Args:
            cpf: CPF com ou sem formatação
            
        Returns:
            CPF formatado ou string vazia se inválido
            
        Examples:
            >>> validator = CPFValidator()
            >>> validator.format_cpf('12345678909')
            '123.456.789-09'
        """
        clean_cpf = self._clean_cpf(cpf)
        
        if len(clean_cpf) != 11:
            return ''
        
        return f'{clean_cpf[:3]}.{clean_cpf[3:6]}.{clean_cpf[6:9]}-{clean_cpf[9:]}'


def validate_cpf(cpf: str) -> Tuple[bool, str]:
    """
    Função helper para validar CPF.
    
    Args:
        cpf: CPF a ser validado (com ou sem formatação)
        
    Returns:
        Tupla (válido, mensagem_erro)
        
    Examples:
        >>> validate_cpf('12345678909')
        (True, '')
        >>> validate_cpf('12345678900')
        (False, 'CPF inválido: dígitos verificadores incorretos')
    """
    validator = CPFValidator()
    return validator.validate(cpf)


def format_cpf(cpf: str) -> str:
    """
    Função helper para formatar CPF.
    
    Args:
        cpf: CPF com ou sem formatação
        
    Returns:
        CPF formatado (XXX.XXX.XXX-XX)
        
    Examples:
        >>> format_cpf('12345678909')
        '123.456.789-09'
    """
    validator = CPFValidator()
    return validator.format_cpf(cpf)


# Exemplos de uso
if __name__ == '__main__':
    validator = CPFValidator()
    
    # Testes
    test_cases = [
        ('12345678909', True, 'CPF válido (sem formatação)'),
        ('123.456.789-09', True, 'CPF válido (com formatação)'),
        ('11144477735', True, 'CPF válido (outro exemplo)'),
        ('12345678900', False, 'Dígito verificador incorreto'),
        ('11111111111', False, 'Sequência de números iguais'),
        ('123456789', False, 'Apenas 9 dígitos'),
        ('', False, 'CPF vazio'),
    ]
    
    print('🧪 Testando validador de CPF\n')
    print('=' * 70)
    
    passed = 0
    failed = 0
    
    for cpf, expected, description in test_cases:
        is_valid, error = validator.validate(cpf)
        status = '✅' if is_valid == expected else '❌'
        
        if is_valid == expected:
            passed += 1
        else:
            failed += 1
        
        print(f'{status} {description}')
        print(f'   CPF: {cpf or "(vazio)"}')
        print(f'   Esperado: {"Válido" if expected else "Inválido"}')
        print(f'   Obtido: {"Válido" if is_valid else f"Inválido ({error})"}')
        
        if is_valid and cpf:
            formatted = validator.format_cpf(cpf)
            print(f'   Formatado: {formatted}')
        
        print()
    
    print('=' * 70)
    print(f'📊 Resumo: {passed} passou, {failed} falhou')
    print(f'Taxa de sucesso: {(passed / len(test_cases) * 100):.1f}%')

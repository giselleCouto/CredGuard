# 🛡️ Validação de CSV no Frontend

Documentação completa sobre o sistema de validação de CSV implementado no frontend.

## 📋 Visão Geral

A validação de CSV no frontend permite que os usuários identifiquem erros no arquivo **antes** de fazer upload para o servidor, economizando tempo e evitando uploads desnecessários.

## ✨ Funcionalidades

### Validações Implementadas

1. **Tamanho do Arquivo**
   - Máximo: 16 MB
   - Feedback imediato se arquivo exceder limite

2. **Extensão do Arquivo**
   - Apenas arquivos `.csv` são aceitos
   - Validação case-insensitive

3. **Estrutura do CSV**
   - Header obrigatório na primeira linha
   - 8 colunas obrigatórias
   - Separador: vírgula (`,`)

4. **Validação de Colunas**
   - Verifica presença de todas as colunas obrigatórias
   - Lista colunas faltantes se houver

5. **Validação de Dados**
   - **CPF:** 11 dígitos, sem formatação, não pode ser sequência
   - **Nome:** Não pode estar vazio
   - **Renda Mensal:** Número decimal positivo
   - **Idade:** Inteiro entre 18 e 100
   - **Score Bureau:** Inteiro entre 300 e 850
   - **Histórico Pagamentos:** excelente, bom, regular ou ruim
   - **Dívida Total:** Número decimal não-negativo
   - **Tempo Emprego:** Inteiro não-negativo (meses)

6. **Feedback Visual**
   - ✅ Verde: Arquivo válido
   - ❌ Vermelho: Arquivo inválido
   - ⏳ Azul: Validando...
   - Animações suaves

7. **Estatísticas**
   - Total de registros
   - Registros válidos
   - Registros inválidos
   - Tamanho do arquivo

## 🚀 Como Usar

### Para Usuários

1. **Acesse a página de upload:**
   ```
   http://localhost:5000/upload
   ```

2. **Selecione um arquivo CSV:**
   - Clique em "Selecione o arquivo CSV"
   - Escolha seu arquivo `.csv`

3. **Aguarde a validação:**
   - Validação acontece automaticamente
   - Veja o resultado em tempo real

4. **Corrija erros (se houver):**
   - Leia os erros listados
   - Corrija o arquivo CSV
   - Selecione novamente

5. **Envie o arquivo:**
   - Botão "Enviar" só funciona se arquivo for válido
   - Escolha o tipo de produto
   - Clique em "Enviar e Processar"

### Para Desenvolvedores

**Incluir o validador em uma página:**

```html
<!-- Incluir o script -->
<script src="/static/csv-validator.js"></script>

<!-- Usar o validador -->
<script>
const validator = new CSVValidator();
const fileInput = document.getElementById('file');

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const result = await validator.validateFile(file);
    
    if (result.valid) {
        console.log('✅ Arquivo válido!');
        console.log('Estatísticas:', result.stats);
    } else {
        console.log('❌ Erros:', result.errors);
    }
});
</script>
```

## 📊 Estrutura do Resultado

```javascript
{
    valid: true/false,
    errors: [
        "Linha 2: CPF deve ter 11 dígitos (encontrado: 8)",
        "Linha 3: Score bureau deve estar entre 300 e 850 (encontrado: 900)"
    ],
    warnings: [
        "Arquivo contém 15000 linhas. Recomendado: máximo 10000 linhas"
    ],
    stats: {
        rows: 10,
        validRows: 8,
        invalidRows: 2
    }
}
```

## 🎨 Feedback Visual

### Estados de Validação

**1. Loading (Validando...)**
```
⏳ Validando arquivo...
```
- Fundo azul claro
- Borda azul
- Ícone animado

**2. Success (Válido)**
```
✅ Arquivo válido!

Estatísticas:
• Total de registros: 10
• Registros válidos: 10
• Tamanho: 2.5 KB

✨ Pronto para enviar!
```
- Fundo verde claro
- Borda verde
- Mensagem de sucesso

**3. Error (Inválido)**
```
❌ Arquivo inválido

Erros encontrados:
• Linha 2: CPF deve ter 11 dígitos (encontrado: 8)
• Linha 3: Score bureau deve estar entre 300 e 850 (encontrado: 900)

💡 Dica: Use o CSV de exemplo como referência
```
- Fundo vermelho claro
- Borda vermelha
- Lista de erros
- Link para documentação

## 🔍 Exemplos de Erros

### CPF Inválido

**Erro:**
```
Linha 2: CPF deve ter 11 dígitos (encontrado: 10)
```

**Causa:**
```csv
cpf,nome,...
1234567890,João Silva,...  ← Apenas 10 dígitos
```

**Correção:**
```csv
cpf,nome,...
12345678901,João Silva,...  ← 11 dígitos
```

### Score Fora da Faixa

**Erro:**
```
Linha 3: Score bureau deve estar entre 300 e 850 (encontrado: 900)
```

**Causa:**
```csv
cpf,nome,renda_mensal,idade,score_bureau,...
12345678901,João Silva,5000.00,35,900,...  ← Acima de 850
```

**Correção:**
```csv
cpf,nome,renda_mensal,idade,score_bureau,...
12345678901,João Silva,5000.00,35,750,...  ← Entre 300-850
```

### Histórico Inválido

**Erro:**
```
Linha 2: Histórico de pagamentos inválido. Valores permitidos: excelente, bom, regular, ruim
```

**Causa:**
```csv
...,historico_pagamentos,...
...,ótimo,...  ← Valor não permitido
```

**Correção:**
```csv
...,historico_pagamentos,...
...,excelente,...  ← Valor permitido
```

## ⚙️ Configuração

### Limites Padrão

```javascript
const validator = new CSVValidator();

// Limites configurados:
validator.maxFileSize = 16 * 1024 * 1024;  // 16 MB
validator.maxRows = 10000;                  // 10.000 linhas
```

### Colunas Obrigatórias

```javascript
validator.requiredColumns = [
    'cpf',
    'nome',
    'renda_mensal',
    'idade',
    'score_bureau',
    'historico_pagamentos',
    'divida_total',
    'tempo_emprego_meses'
];
```

### Valores Permitidos

```javascript
validator.historicoValidos = [
    'excelente',
    'bom',
    'regular',
    'ruim'
];
```

## 🧪 Testes

### Testar Manualmente

1. **CSV Válido:**
   - Use `clientes_exemplo.csv`
   - Deve mostrar ✅ verde

2. **CSV Inválido:**
   - Use `test_invalid.csv`
   - Deve mostrar ❌ vermelho com erros

3. **Arquivo Grande:**
   - Crie arquivo > 16 MB
   - Deve rejeitar imediatamente

4. **Extensão Errada:**
   - Renomeie para `.txt`
   - Deve rejeitar extensão

### Casos de Teste

| Teste | Entrada | Resultado Esperado |
|-------|---------|-------------------|
| CSV válido | clientes_exemplo.csv | ✅ Válido |
| CSV inválido | test_invalid.csv | ❌ Múltiplos erros |
| Arquivo vazio | empty.csv | ❌ Arquivo vazio |
| Arquivo grande | large.csv (>16MB) | ❌ Muito grande |
| Extensão errada | data.txt | ❌ Extensão inválida |
| Header incompleto | missing_columns.csv | ❌ Colunas faltando |
| CPF com formatação | 123.456.789-01 | ❌ CPF inválido |
| Score 900 | score_bureau=900 | ❌ Fora da faixa |
| Idade 17 | idade=17 | ❌ Menor que 18 |
| Renda negativa | renda_mensal=-1000 | ❌ Deve ser positiva |

## 🚀 Performance

- **Validação rápida:** < 1 segundo para 1.000 linhas
- **Assíncrona:** Não bloqueia a UI
- **Limite de erros:** Mostra no máximo 10 erros por vez
- **Feedback imediato:** Validação ao selecionar arquivo

## 🔒 Segurança

- **Client-side only:** Validação não substitui validação no servidor
- **Sem envio de dados:** Arquivo é lido localmente
- **Sem armazenamento:** Dados não são salvos no navegador

## 📱 Responsividade

- **Desktop:** Layout completo com detalhes
- **Tablet:** Layout adaptado
- **Mobile:** Layout compacto, fácil de ler

## 🆘 Troubleshooting

### Validação não funciona

**Problema:** Nada acontece ao selecionar arquivo

**Solução:**
1. Verificar se `csv-validator.js` está carregado
2. Abrir console do navegador (F12)
3. Verificar erros JavaScript

### Arquivo válido marcado como inválido

**Problema:** CSV correto é rejeitado

**Solução:**
1. Verificar encoding (deve ser UTF-8)
2. Verificar separador (deve ser vírgula)
3. Verificar nomes das colunas (case-sensitive)
4. Comparar com `clientes_exemplo.csv`

### Validação muito lenta

**Problema:** Demora muito para validar

**Solução:**
1. Reduzir tamanho do arquivo (< 10.000 linhas)
2. Dividir em múltiplos arquivos
3. Verificar performance do navegador

## 📚 Referências

- **CSV Format:** `CSV_FORMAT.md`
- **Flask Integration:** `FLASK_INTEGRATION_GUIDE.md`
- **Example CSV:** `clientes_exemplo.csv`

---

**Desenvolvido com ❤️ para melhorar a experiência do usuário**

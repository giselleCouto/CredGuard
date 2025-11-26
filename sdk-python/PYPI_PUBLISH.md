# Guia de Publicação no PyPI

Este documento descreve o processo completo para publicar o `credguard-sdk` no PyPI.

## 📋 Pré-requisitos

1. **Conta no PyPI**: Crie uma conta em https://pypi.org/account/register/
2. **Token de API**: Gere um token em https://pypi.org/manage/account/token/
3. **Ferramentas instaladas**:
   ```bash
   pip install build twine
   ```

## 🔧 Preparação

### 1. Verificar estrutura do pacote

```bash
cd sdk-python
tree -L 2
```

Estrutura esperada:
```
sdk-python/
├── credguard/
│   ├── __init__.py
│   ├── client.py
│   ├── models.py
│   └── exceptions.py
├── examples/
│   ├── basic_usage.py
│   └── advanced_usage.py
├── setup.py
├── README.md
├── LICENSE
├── MANIFEST.in
└── requirements.txt
```

### 2. Atualizar versão

Edite `setup.py` e `credguard/__init__.py`:
```python
version="1.0.0"  # Incrementar conforme necessário
```

### 3. Validar setup.py

```bash
python setup.py check
```

## 🏗️ Build do Pacote

### 1. Limpar builds anteriores

```bash
rm -rf build/ dist/ *.egg-info
```

### 2. Criar distribuições

```bash
python -m build
```

Isso gera:
- `dist/credguard-sdk-1.0.0.tar.gz` (source distribution)
- `dist/credguard_sdk-1.0.0-py3-none-any.whl` (wheel)

### 3. Verificar conteúdo do pacote

```bash
tar -tzf dist/credguard-sdk-1.0.0.tar.gz
```

## 🧪 Testes Locais

### 1. Instalar localmente

```bash
pip install dist/credguard_sdk-1.0.0-py3-none-any.whl
```

### 2. Testar importação

```python
from credguard import CredGuardClient
print(CredGuardClient.__doc__)
```

### 3. Desinstalar

```bash
pip uninstall credguard-sdk
```

## 📦 Publicação no TestPyPI (Recomendado)

Antes de publicar no PyPI oficial, teste no TestPyPI.

### 1. Criar conta no TestPyPI

https://test.pypi.org/account/register/

### 2. Gerar token de API

https://test.pypi.org/manage/account/token/

### 3. Configurar credenciais

Crie `~/.pypirc`:
```ini
[testpypi]
username = __token__
password = pypi-AgEIcHlwaS5vcmcC...  # Seu token do TestPyPI
```

### 4. Upload para TestPyPI

```bash
python -m twine upload --repository testpypi dist/*
```

### 5. Testar instalação do TestPyPI

```bash
pip install --index-url https://test.pypi.org/simple/ credguard-sdk
```

## 🚀 Publicação no PyPI Oficial

### 1. Gerar token de API

https://pypi.org/manage/account/token/

### 2. Configurar credenciais

Adicione ao `~/.pypirc`:
```ini
[pypi]
username = __token__
password = pypi-AgEIcHlwaS5vcmcC...  # Seu token do PyPI
```

### 3. Upload para PyPI

```bash
python -m twine upload dist/*
```

### 4. Verificar publicação

Acesse: https://pypi.org/project/credguard-sdk/

### 5. Testar instalação

```bash
pip install credguard-sdk
```

## 📝 Checklist de Publicação

- [ ] Versão atualizada em `setup.py` e `__init__.py`
- [ ] README.md completo e atualizado
- [ ] LICENSE incluído
- [ ] Exemplos de uso funcionando
- [ ] Dependências corretas em `requirements.txt`
- [ ] Build limpo sem warnings
- [ ] Testado localmente
- [ ] Publicado no TestPyPI
- [ ] Testado do TestPyPI
- [ ] Publicado no PyPI oficial
- [ ] Tag criada no Git (`git tag v1.0.0`)
- [ ] Release criado no GitHub

## 🔄 Atualizações Futuras

Para publicar uma nova versão:

1. **Incrementar versão**:
   - `setup.py`: `version="1.1.0"`
   - `credguard/__init__.py`: `__version__ = "1.1.0"`

2. **Limpar e rebuild**:
   ```bash
   rm -rf build/ dist/ *.egg-info
   python -m build
   ```

3. **Upload**:
   ```bash
   python -m twine upload dist/*
   ```

4. **Tag no Git**:
   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   ```

## 🛡️ Segurança

- **NUNCA** commite tokens de API no Git
- Use variáveis de ambiente para tokens:
  ```bash
  export TWINE_USERNAME=__token__
  export TWINE_PASSWORD=pypi-AgEIcHlwaS5vcmcC...
  twine upload dist/*
  ```

## 📞 Suporte

- PyPI Help: https://pypi.org/help/
- Twine Docs: https://twine.readthedocs.io/
- Packaging Guide: https://packaging.python.org/

## 🎉 Após Publicação

1. **Atualizar README do projeto principal** com instruções de instalação:
   ```bash
   pip install credguard-sdk
   ```

2. **Criar release no GitHub** com changelog

3. **Anunciar nas redes sociais** e documentação oficial

4. **Monitorar downloads** em https://pypistats.org/packages/credguard-sdk

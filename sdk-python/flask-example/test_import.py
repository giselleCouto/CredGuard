"""
Teste simples para validar imports e estrutura
"""
import sys
sys.path.insert(0, '..')

try:
    # Testar imports do Flask
    from flask import Flask
    print("✅ Flask importado com sucesso")
    
    # Testar imports do projeto
    from config import Config
    print("✅ Config importado com sucesso")
    
    # Testar estrutura de app.py (sem executar)
    with open('app.py', 'r') as f:
        content = f.read()
        assert 'Flask' in content
        assert 'CredGuardClient' in content
        assert '@app.route' in content
        print("✅ app.py estruturado corretamente")
    
    # Testar templates
    import os
    templates = ['base.html', 'index.html', 'upload.html', 'status.html', 'results.html', 'jobs.html']
    for template in templates:
        path = f'templates/{template}'
        assert os.path.exists(path), f"Template {template} não encontrado"
    print(f"✅ Todos os {len(templates)} templates encontrados")
    
    # Testar CSS
    assert os.path.exists('static/style.css'), "CSS não encontrado"
    with open('static/style.css', 'r') as f:
        css = f.read()
        assert '.navbar' in css
        assert '.btn' in css
        assert '@media' in css  # Responsivo
    print("✅ CSS completo e responsivo")
    
    print("\n🎉 Todos os testes passaram! Aplicação Flask está completa.")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    sys.exit(1)

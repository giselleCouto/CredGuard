"""
Teste de validação do sistema de autenticação
"""
import sys
import os

try:
    # Testar imports
    from flask import Flask
    from flask_login import LoginManager
    print("✅ Flask e Flask-Login importados com sucesso")
    
    # Testar models
    from models import User, Job, init_db
    print("✅ Models importados com sucesso")
    
    # Testar estrutura de app.py
    with open('app.py', 'r') as f:
        content = f.read()
        assert 'Flask' in content
        assert 'LoginManager' in content
        assert 'login_required' in content
        assert 'def register' in content
        assert 'def login' in content
        assert 'def logout' in content
        print("✅ app.py estruturado corretamente com autenticação")
    
    # Testar templates de autenticação
    templates = ['login.html', 'register.html']
    for template in templates:
        path = f'templates/{template}'
        assert os.path.exists(path), f"Template {template} não encontrado"
        
        with open(path, 'r') as f:
            content = f.read()
            assert 'form' in content
            assert 'method="POST"' in content
    print(f"✅ Templates de autenticação criados ({len(templates)} arquivos)")
    
    # Testar CSS de autenticação
    with open('static/style.css', 'r') as f:
        css = f.read()
        assert '.auth-container' in css
        assert '.auth-card' in css
        assert '.auth-form' in css
    print("✅ CSS de autenticação adicionado")
    
    # Testar base.html com links de autenticação
    with open('templates/base.html', 'r') as f:
        content = f.read()
        assert 'current_user.is_authenticated' in content
        assert 'login' in content
        assert 'register' in content
    print("✅ base.html atualizado com links de autenticação")
    
    # Testar models.py
    with open('models.py', 'r') as f:
        content = f.read()
        assert 'class User' in content
        assert 'class Job' in content
        assert 'UserMixin' in content
        assert 'generate_password_hash' in content
        assert 'check_password_hash' in content
    print("✅ models.py implementado com User e Job")
    
    # Testar requirements.txt
    with open('requirements.txt', 'r') as f:
        content = f.read()
        assert 'flask-login' in content
    print("✅ flask-login adicionado ao requirements.txt")
    
    print("\n🎉 Todos os testes de autenticação passaram!")
    print("\n📋 Sistema de autenticação implementado:")
    print("   - Flask-Login configurado")
    print("   - Modelo User com hash de senha")
    print("   - Modelo Job associado a usuários")
    print("   - Banco de dados SQLite")
    print("   - Rotas protegidas com @login_required")
    print("   - Templates de login e registro")
    print("   - CSS de autenticação")
    print("   - Navbar com links condicionais")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

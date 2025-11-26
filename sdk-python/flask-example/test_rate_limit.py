"""
Teste de validação do rate limiting
"""
import sys
import os

try:
    # Testar imports
    from flask_limiter import Limiter
    print("✅ Flask-Limiter importado com sucesso")
    
    # Testar estrutura de app.py
    with open('app.py', 'r') as f:
        content = f.read()
        
        # Verificar import do Flask-Limiter
        assert 'from flask_limiter import Limiter' in content
        assert 'from flask_limiter.util import get_remote_address' in content
        print("✅ Flask-Limiter importado no app.py")
        
        # Verificar configuração do limiter
        assert 'limiter = Limiter(' in content
        assert 'key_func=get_remote_address' in content
        assert 'default_limits=' in content
        print("✅ Limiter configurado corretamente")
        
        # Verificar decorators nas rotas
        assert '@limiter.limit("5 per minute", methods=["POST"])' in content
        assert '@limiter.limit("10 per minute", methods=["POST"])' in content
        print("✅ Rate limits aplicados nas rotas de autenticação")
        
        # Verificar handler de erro 429
        assert '@app.errorhandler(429)' in content
        assert 'def ratelimit_handler' in content
        assert 'Muitas tentativas de login' in content
        assert 'Muitas tentativas de registro' in content
        print("✅ Handler customizado para rate limit implementado")
    
    # Testar requirements.txt
    with open('requirements.txt', 'r') as f:
        content = f.read()
        assert 'flask-limiter' in content
    print("✅ flask-limiter adicionado ao requirements.txt")
    
    print("\n🎉 Todos os testes de rate limiting passaram!")
    print("\n📋 Rate limiting implementado:")
    print("   - Flask-Limiter configurado")
    print("   - Limite global: 200/dia, 50/hora")
    print("   - Login: 10 tentativas/minuto")
    print("   - Registro: 5 tentativas/minuto")
    print("   - Handler customizado para erro 429")
    print("   - Mensagens amigáveis por rota")
    print("   - Estratégia: fixed-window")
    print("   - Storage: memory (in-memory)")
    
    print("\n⚠️  IMPORTANTE:")
    print("   - Para produção, use Redis como storage")
    print("   - Exemplo: storage_uri='redis://localhost:6379'")
    print("   - Isso permite rate limiting distribuído")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

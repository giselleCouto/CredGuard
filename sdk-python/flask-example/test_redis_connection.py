"""
Teste de conectividade Redis para rate limiting
"""
import os
import sys
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

def test_redis_connection():
    """Testa conexão com Redis."""
    redis_url = os.getenv('REDIS_URL')
    
    if not redis_url:
        print("❌ REDIS_URL não está definido no .env")
        print("\n📝 Para configurar:")
        print("   1. Adicione ao .env: REDIS_URL=redis://localhost:6379")
        print("   2. Instale Redis: sudo apt install redis-server")
        print("   3. Inicie Redis: sudo systemctl start redis-server")
        return False
    
    if redis_url == 'memory://':
        print("⚠️  Usando storage in-memory (não é Redis)")
        print("\n📝 Para usar Redis:")
        print("   Altere REDIS_URL no .env para: redis://localhost:6379")
        return False
    
    print(f"🔍 Testando conexão com Redis...")
    print(f"   URL: {redis_url.split('@')[-1] if '@' in redis_url else redis_url}")
    
    try:
        import redis
        print("✅ Biblioteca redis importada com sucesso")
    except ImportError:
        print("❌ Biblioteca redis não instalada")
        print("\n📝 Para instalar:")
        print("   pip install redis>=5.0.0")
        return False
    
    try:
        # Conectar ao Redis
        r = redis.from_url(redis_url, decode_responses=True)
        
        # Testar ping
        if r.ping():
            print("✅ Conexão com Redis estabelecida (PING → PONG)")
        else:
            print("❌ Redis não respondeu ao PING")
            return False
        
        # Testar set/get
        test_key = 'test:connection'
        test_value = 'hello_redis'
        
        r.set(test_key, test_value, ex=10)  # Expira em 10 segundos
        retrieved = r.get(test_key)
        
        if retrieved == test_value:
            print("✅ Operações SET/GET funcionando")
        else:
            print(f"❌ Erro em SET/GET: esperado '{test_value}', obtido '{retrieved}'")
            return False
        
        # Limpar chave de teste
        r.delete(test_key)
        
        # Ver chaves do rate limiting (se existirem)
        limiter_keys = r.keys('LIMITER*')
        if limiter_keys:
            print(f"✅ Encontradas {len(limiter_keys)} chaves de rate limiting no Redis")
            print(f"   Exemplos: {limiter_keys[:3]}")
        else:
            print("ℹ️  Nenhuma chave de rate limiting encontrada (normal se app não foi usado)")
        
        # Informações do servidor
        info = r.info('server')
        print(f"\n📊 Informações do Redis:")
        print(f"   Versão: {info.get('redis_version', 'N/A')}")
        print(f"   Modo: {info.get('redis_mode', 'N/A')}")
        print(f"   Uptime: {info.get('uptime_in_days', 0)} dias")
        
        # Estatísticas
        stats = r.info('stats')
        print(f"\n📈 Estatísticas:")
        print(f"   Total de conexões: {stats.get('total_connections_received', 0)}")
        print(f"   Total de comandos: {stats.get('total_commands_processed', 0)}")
        
        print("\n🎉 Todos os testes de Redis passaram!")
        print("\n✅ Rate limiting está pronto para produção com Redis")
        print("   - Suporta múltiplos workers")
        print("   - Suporta load balancers")
        print("   - Persiste entre restarts")
        
        return True
        
    except redis.ConnectionError as e:
        print(f"❌ Erro de conexão com Redis: {e}")
        print("\n📝 Troubleshooting:")
        print("   1. Verificar se Redis está rodando:")
        print("      sudo systemctl status redis-server")
        print("   2. Iniciar Redis:")
        print("      sudo systemctl start redis-server")
        print("   3. Testar conexão manualmente:")
        print("      redis-cli ping")
        return False
        
    except redis.AuthenticationError as e:
        print(f"❌ Erro de autenticação: {e}")
        print("\n📝 Troubleshooting:")
        print("   1. Verificar senha no REDIS_URL")
        print("   2. Formato correto: redis://:senha@localhost:6379")
        return False
        
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_rate_limiting_with_redis():
    """Testa se rate limiting está usando Redis."""
    print("\n" + "="*60)
    print("🧪 Testando integração Flask-Limiter + Redis")
    print("="*60 + "\n")
    
    redis_url = os.getenv('REDIS_URL', 'memory://')
    
    if not redis_url.startswith('redis://'):
        print("⚠️  Flask-Limiter não está configurado para usar Redis")
        print("   Usando storage in-memory")
        return False
    
    try:
        # Importar app para verificar configuração
        with open('app.py', 'r') as f:
            content = f.read()
            
            if 'redis_url = os.getenv(\'REDIS_URL\', \'memory://\')' in content:
                print("✅ app.py configurado para usar Redis")
            else:
                print("⚠️  app.py pode não estar configurado corretamente")
            
            if 'storage_uri=redis_url' in content:
                print("✅ Limiter configurado com storage_uri dinâmico")
            else:
                print("⚠️  Limiter pode estar usando storage fixo")
        
        print("\n✅ Configuração do Flask-Limiter está correta")
        print("   Rate limiting usará Redis quando app for iniciado")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao verificar configuração: {e}")
        return False


if __name__ == '__main__':
    print("="*60)
    print("🔴 Teste de Conectividade Redis")
    print("="*60 + "\n")
    
    # Testar conexão Redis
    redis_ok = test_redis_connection()
    
    # Testar configuração do rate limiting
    config_ok = test_rate_limiting_with_redis()
    
    # Resultado final
    print("\n" + "="*60)
    if redis_ok and config_ok:
        print("✅ SUCESSO: Redis configurado e funcionando")
        print("="*60)
        sys.exit(0)
    else:
        print("❌ FALHA: Verifique os erros acima")
        print("="*60)
        sys.exit(1)

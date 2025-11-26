"""
Exemplo avançado do CredGuard SDK

Demonstra:
- Tratamento de erros
- Retry automático
- Consulta de modelos ML
- Detecção de drift
- Métricas de bureau
"""

from credguard import (
    CredGuardClient,
    AuthenticationError,
    RateLimitError,
    CredGuardAPIError
)
import time

API_KEY = "seu_token_jwt_aqui"

def upload_with_retry(client, file_path, product, max_retries=3):
    """Upload com retry automático em caso de erro."""
    for attempt in range(max_retries):
        try:
            print(f"📤 Tentativa {attempt + 1}/{max_retries}...")
            job = client.batch.upload(
                file_path=file_path,
                product=product,
                wait_for_completion=True  # Aguarda automaticamente
            )
            return job
        except RateLimitError:
            if attempt < max_retries - 1:
                print("⚠️ Rate limit excedido. Aguardando 60 segundos...")
                time.sleep(60)
            else:
                raise
        except CredGuardAPIError as e:
            if attempt < max_retries - 1:
                print(f"⚠️ Erro: {e}. Tentando novamente em 10 segundos...")
                time.sleep(10)
            else:
                raise

def check_models(client, product):
    """Lista modelos disponíveis e suas métricas."""
    print(f"\n📊 Modelos disponíveis para {product}:")
    models = client.models.list(product=product)
    
    for model in models:
        status = "🟢 PRODUÇÃO" if model.is_production else "🔵 Desenvolvimento"
        print(f"\n{status} - {model.version}")
        print(f"  Accuracy:  {model.accuracy:.2%}")
        print(f"  Precision: {model.precision:.2%}")
        print(f"  Recall:    {model.recall:.2%}")
        print(f"  F1-Score:  {model.f1_score:.2%}")
    
    return models

def check_drift(client, model_id, job_id):
    """Verifica drift no modelo."""
    print(f"\n🔍 Verificando drift no modelo {model_id}...")
    drift = client.drift.detect(model_id=model_id, job_id=job_id)
    
    print(f"Drift detectado: {'Sim' if drift.drift_detected else 'Não'}")
    print(f"PSI: {drift.psi:.4f}")
    print(f"Status: {drift.status}")
    
    if drift.is_critical:
        print("⚠️ CRÍTICO: Retreinamento urgente recomendado!")
    elif drift.needs_attention:
        print("⚠️ ATENÇÃO: Monitorar modelo de perto")
    else:
        print("✅ Modelo estável")
    
    if drift.recommendation:
        print(f"Recomendação: {drift.recommendation}")
    
    return drift

def check_bureau_metrics(client):
    """Consulta métricas de uso do bureau."""
    print("\n💳 Métricas de Bureau:")
    
    # Configuração
    config = client.bureau.get_config()
    print(f"Bureau ativo: {'Sim' if config.get('isActive') else 'Não'}")
    
    # Métricas
    metrics = client.bureau.get_metrics()
    print(f"Total de consultas: {metrics.get('totalQueries', 0)}")
    print(f"Cache hit rate: {metrics.get('cacheHitRate', 0):.1%}")
    print(f"Custo mensal: R$ {metrics.get('monthlyCost', 0):.2f}")

def main():
    print("🚀 CredGuard SDK - Exemplo Avançado\n")
    
    try:
        # Inicializar cliente
        client = CredGuardClient(
            api_key=API_KEY,
            base_url="https://credguard.manus.space"
        )
        
        # 1. Listar modelos disponíveis
        models = check_models(client, product="CARTAO")
        
        # 2. Upload com retry automático
        job = upload_with_retry(
            client,
            file_path="clientes.csv",
            product="CARTAO",
            max_retries=3
        )
        
        print(f"\n✅ Upload concluído!")
        print(f"Job ID: {job.job_id}")
        print(f"Processados: {job.processed_rows}")
        print(f"Excluídos: {job.excluded_rows}")
        
        # 3. Verificar drift (se houver modelo em produção)
        production_model = next((m for m in models if m.is_production), None)
        if production_model:
            check_drift(client, production_model.model_id, job.job_id)
        
        # 4. Consultar métricas de bureau
        check_bureau_metrics(client)
        
        # 5. Download de resultados
        print(f"\n📥 Baixando resultados...")
        output_path = client.batch.download_results(
            job_id=job.job_id,
            output_path="resultados_avancado.csv"
        )
        print(f"✅ Resultados salvos em: {output_path}")
        
    except AuthenticationError:
        print("❌ Erro de autenticação. Verifique seu token JWT.")
    except RateLimitError:
        print("❌ Rate limit excedido após múltiplas tentativas.")
    except CredGuardAPIError as e:
        print(f"❌ Erro na API: {e}")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")

if __name__ == "__main__":
    main()

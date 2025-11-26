"""
Exemplo básico de uso do CredGuard SDK

Este exemplo demonstra o fluxo completo:
1. Inicializar cliente
2. Upload de arquivo CSV
3. Aguardar processamento
4. Download de resultados
"""

from credguard import CredGuardClient
import time

# Configuração
API_KEY = "seu_token_jwt_aqui"  # Substitua pelo seu token
CSV_FILE = "clientes.csv"  # Arquivo CSV com dados dos clientes
OUTPUT_FILE = "resultados_scores.csv"  # Arquivo de saída

def main():
    # 1. Inicializar cliente
    print("🔐 Inicializando cliente CredGuard...")
    client = CredGuardClient(
        api_key=API_KEY,
        base_url="https://credguard.manus.space"
    )
    
    # 2. Upload de arquivo
    print(f"\n📤 Enviando arquivo {CSV_FILE}...")
    job = client.batch.upload(
        file_path=CSV_FILE,
        product="CARTAO"  # Opções: CARTAO, CARNE, EMPRESTIMO
    )
    
    print(f"✅ Job criado com sucesso!")
    print(f"   Job ID: {job.job_id}")
    print(f"   Status: {job.status}")
    print(f"   Arquivo: {job.file_name}")
    
    # 3. Aguardar processamento (polling)
    print(f"\n⏳ Aguardando processamento...")
    while job.is_processing:
        time.sleep(5)  # Aguarda 5 segundos
        job = client.batch.get_status(job.job_id)
        
        if job.total_rows:
            progress = (job.processed_rows or 0) / job.total_rows * 100
            print(f"   Progresso: {progress:.1f}% ({job.processed_rows}/{job.total_rows})")
    
    # 4. Verificar resultado
    if job.is_complete:
        print(f"\n✅ Processamento concluído!")
        print(f"   Total processado: {job.processed_rows}")
        print(f"   Excluídos: {job.excluded_rows}")
        
        # 5. Download de resultados
        print(f"\n📥 Baixando resultados...")
        output_path = client.batch.download_results(
            job_id=job.job_id,
            output_path=OUTPUT_FILE
        )
        print(f"✅ Resultados salvos em: {output_path}")
        
    elif job.is_failed:
        print(f"\n❌ Processamento falhou!")
        print(f"   Erro: {job.error_message}")
    
    print("\n🎉 Processo finalizado!")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Erro: {e}")

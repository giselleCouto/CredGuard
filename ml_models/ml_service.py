#!/usr/bin/env python3
"""
CredGuard ML Service
Serviço de predição usando modelos treinados para credit scoring
"""

import os
import sys
import json
import pickle
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Any

# Diretório base dos modelos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class MLService:
    """Serviço de Machine Learning para scoring de crédito"""
    
    def __init__(self):
        """Inicializa o serviço carregando todos os modelos"""
        self.models = {}
        self.scaler = None
        self.odds_threshold_bins = None
        self.resultados_limites = None
        self.load_models()
    
    def load_models(self):
        """Carrega todos os modelos .pkl do diretório"""
        try:
            # Carregar modelos FA (Feature Analysis)
            model_files = ['fa_8.pkl', 'fa_11.pkl', 'fa_12.pkl', 'fa_15.pkl']
            for model_file in model_files:
                model_path = os.path.join(BASE_DIR, model_file)
                if os.path.exists(model_path):
                    with open(model_path, 'rb') as f:
                        model_name = model_file.replace('.pkl', '')
                        self.models[model_name] = pickle.load(f)
                        print(f"✓ Modelo {model_name} carregado com sucesso", file=sys.stderr)
            
            # Carregar scaler
            scaler_path = os.path.join(BASE_DIR, 'scaler_num.pkl')
            if os.path.exists(scaler_path):
                with open(scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                    print(f"✓ Scaler carregado com sucesso", file=sys.stderr)
            
            # Carregar odds_threshold_bins
            odds_path = os.path.join(BASE_DIR, 'odds_threshold_bins.pkl')
            if os.path.exists(odds_path):
                with open(odds_path, 'rb') as f:
                    self.odds_threshold_bins = pickle.load(f)
                    print(f"✓ Odds threshold bins carregado com sucesso", file=sys.stderr)
            
            # Carregar resultados_limites.csv
            limites_path = os.path.join(BASE_DIR, 'resultados_limites.csv')
            if os.path.exists(limites_path):
                self.resultados_limites = pd.read_csv(limites_path)
                print(f"✓ Resultados limites carregado com sucesso", file=sys.stderr)
            
            if not self.models:
                raise Exception("Nenhum modelo foi carregado")
                
        except Exception as e:
            print(f"✗ Erro ao carregar modelos: {str(e)}", file=sys.stderr)
            raise
    
    def extract_features(self, customer_data: Dict[str, Any]) -> pd.DataFrame:
        """
        Extrai features do histórico do cliente para predição
        
        Args:
            customer_data: Dicionário com dados do cliente
        
        Returns:
            DataFrame com features extraídas
        """
        # Calcular features baseadas no histórico
        data_primeira_compra = pd.to_datetime(customer_data.get('data_primeira_compra'))
        data_ultima_compra = pd.to_datetime(customer_data.get('data_ultima_compra'))
        data_atual = pd.to_datetime('today')
        
        # Tempo de relacionamento em meses
        meses_relacionamento = max((data_ultima_compra - data_primeira_compra).days / 30, 1)
        
        # Recência em dias
        recencia_dias = (data_atual - data_ultima_compra).days
        
        # Total de compras
        total_compras = customer_data.get('total_compras', 0)
        
        # Valor total
        valor_total = customer_data.get('valor_total_compras', 0)
        
        # Ticket médio
        ticket_medio = valor_total / total_compras if total_compras > 0 else 0
        
        # Taxa de adimplência
        pagamentos_em_dia = customer_data.get('total_pagamentos_em_dia', 0)
        total_atrasos = customer_data.get('total_atrasos', 0)
        total_pagamentos = pagamentos_em_dia + total_atrasos
        taxa_adimplencia = pagamentos_em_dia / total_pagamentos if total_pagamentos > 0 else 0
        
        # Maior atraso
        maior_atraso = customer_data.get('maior_atraso', 0)
        
        # Frequência de compras (compras por mês)
        frequencia_compras = total_compras / meses_relacionamento
        
        # Criar DataFrame com features
        features = pd.DataFrame({
            'meses_relacionamento': [meses_relacionamento],
            'recencia_dias': [recencia_dias],
            'total_compras': [total_compras],
            'valor_total': [valor_total],
            'ticket_medio': [ticket_medio],
            'taxa_adimplencia': [taxa_adimplencia],
            'maior_atraso': [maior_atraso],
            'frequencia_compras': [frequencia_compras],
            'total_pagamentos_em_dia': [pagamentos_em_dia],
            'total_atrasos': [total_atrasos]
        })
        
        return features
    
    def select_model_by_product(self, produto: str) -> str:
        """
        Seleciona o modelo adequado baseado no produto
        
        Args:
            produto: Tipo de produto (CARTAO, CARNE, EMPRESTIMO_PESSOAL)
        
        Returns:
            Nome do modelo a usar
        """
        # Mapear produtos para modelos
        # fa_8, fa_11, fa_12, fa_15 representam diferentes configurações de features
        # Aqui usamos uma heurística simples - você pode ajustar conforme necessário
        product_model_map = {
            'CARTAO': 'fa_12',  # Modelo com 12 features para cartão
            'CARNE': 'fa_11',   # Modelo com 11 features para carnê
            'EMPRESTIMO_PESSOAL': 'fa_15'  # Modelo com 15 features para empréstimo
        }
        
        return product_model_map.get(produto, 'fa_12')  # Default: fa_12
    
    def predict(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Gera predição de score de crédito para um cliente
        
        Args:
            customer_data: Dicionário com dados do cliente
        
        Returns:
            Dicionário com score e informações adicionais
        """
        try:
            # Extrair features
            features = self.extract_features(customer_data)
            
            # Selecionar modelo baseado no produto
            produto = customer_data.get('produto', 'CARTAO')
            model_name = self.select_model_by_product(produto)
            
            if model_name not in self.models:
                raise Exception(f"Modelo {model_name} não encontrado")
            
            model = self.models[model_name]
            
            # Normalizar features se scaler disponível
            if self.scaler is not None:
                # Selecionar apenas colunas numéricas que o scaler espera
                numeric_cols = ['meses_relacionamento', 'recencia_dias', 'total_compras', 
                              'valor_total', 'ticket_medio', 'maior_atraso', 'frequencia_compras']
                features_to_scale = features[numeric_cols].values
                features_scaled = self.scaler.transform(features_to_scale)
                
                # Reconstruir DataFrame
                features_final = pd.DataFrame(features_scaled, columns=numeric_cols)
                # Adicionar colunas não escaladas
                features_final['taxa_adimplencia'] = features['taxa_adimplencia'].values
            else:
                features_final = features
            
            # Fazer predição
            # Assumindo que o modelo retorna probabilidade de inadimplência
            prob_inadimplencia = model.predict_proba(features_final)[:, 1][0]
            
            # Classificar em faixa de risco
            if prob_inadimplencia < 0.25:
                faixa_score = 'BAIXO'
            elif prob_inadimplencia < 0.50:
                faixa_score = 'MÉDIO'
            elif prob_inadimplencia < 0.75:
                faixa_score = 'ALTO'
            else:
                faixa_score = 'CRÍTICO'
            
            return {
                'score_prob_inadimplencia': float(prob_inadimplencia),
                'faixa_score': faixa_score,
                'modelo_utilizado': model_name,
                'features_extraidas': features.to_dict('records')[0]
            }
            
        except Exception as e:
            print(f"✗ Erro na predição: {str(e)}", file=sys.stderr)
            # Retornar score neutro em caso de erro
            return {
                'score_prob_inadimplencia': 0.5,
                'faixa_score': 'MÉDIO',
                'modelo_utilizado': 'fallback',
                'erro': str(e)
            }
    
    def predict_batch(self, customers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Gera predições para múltiplos clientes
        
        Args:
            customers: Lista de dicionários com dados dos clientes
        
        Returns:
            Lista de dicionários com scores
        """
        results = []
        for customer in customers:
            result = self.predict(customer)
            result['cpf'] = customer.get('cpf')
            result['nome'] = customer.get('nome')
            result['produto'] = customer.get('produto')
            results.append(result)
        
        return results


def main():
    """Função principal para uso via CLI"""
    if len(sys.argv) < 2:
        print("Uso: python ml_service.py <input_json>")
        print("Exemplo: python ml_service.py '{\"cpf\": \"123\", \"nome\": \"João\", ...}'")
        sys.exit(1)
    
    # Inicializar serviço
    service = MLService()
    
    # Ler input JSON
    input_data = json.loads(sys.argv[1])
    
    # Fazer predição
    if isinstance(input_data, list):
        # Batch prediction
        results = service.predict_batch(input_data)
    else:
        # Single prediction
        results = service.predict(input_data)
    
    # Retornar resultado como JSON
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

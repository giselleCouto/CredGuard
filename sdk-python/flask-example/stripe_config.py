"""
Configuração do Stripe para pagamentos e assinaturas
"""
import os
import stripe
from typing import Dict, List, Optional


class StripeConfig:
    """Configuração centralizada do Stripe."""
    
    def __init__(self):
        """Inicializa configuração do Stripe."""
        self.secret_key = os.getenv('STRIPE_SECRET_KEY', '')
        self.publishable_key = os.getenv('STRIPE_PUBLISHABLE_KEY', '')
        self.webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET', '')
        
        # Configurar chave secreta do Stripe
        if self.secret_key:
            stripe.api_key = self.secret_key
    
    def is_configured(self) -> bool:
        """Verifica se o Stripe está configurado."""
        return bool(self.secret_key and self.publishable_key)
    
    def get_publishable_key(self) -> str:
        """Retorna chave publicável do Stripe."""
        return self.publishable_key


class StripeProducts:
    """Gerenciamento de produtos e preços do Stripe."""
    
    # Produtos disponíveis (em produção, buscar do Stripe)
    PRODUCTS = {
        'basic': {
            'name': 'Plano Básico',
            'description': 'Análise de até 1.000 CPFs por mês',
            'price': 4900,  # R$ 49,00 em centavos
            'currency': 'brl',
            'features': [
                '1.000 análises de CPF/mês',
                'Validação com dígitos verificadores',
                'Dashboard de estatísticas',
                'Suporte por email'
            ]
        },
        'professional': {
            'name': 'Plano Profissional',
            'description': 'Análise de até 10.000 CPFs por mês',
            'price': 14900,  # R$ 149,00 em centavos
            'currency': 'brl',
            'features': [
                '10.000 análises de CPF/mês',
                'Validação com dígitos verificadores',
                'Dashboard avançado',
                'API de estatísticas',
                'Suporte prioritário',
                'Webhooks personalizados'
            ]
        },
        'enterprise': {
            'name': 'Plano Enterprise',
            'description': 'Análise ilimitada de CPFs',
            'price': 49900,  # R$ 499,00 em centavos
            'currency': 'brl',
            'features': [
                'Análises ilimitadas',
                'Validação com dígitos verificadores',
                'Dashboard personalizado',
                'API completa',
                'Suporte 24/7',
                'Webhooks personalizados',
                'Integração dedicada',
                'SLA garantido'
            ]
        }
    }
    
    @classmethod
    def get_product(cls, product_id: str) -> Optional[Dict]:
        """
        Retorna informações de um produto.
        
        Args:
            product_id: ID do produto (basic, professional, enterprise)
            
        Returns:
            Dicionário com informações do produto ou None
        """
        return cls.PRODUCTS.get(product_id)
    
    @classmethod
    def get_all_products(cls) -> Dict[str, Dict]:
        """Retorna todos os produtos disponíveis."""
        return cls.PRODUCTS
    
    @classmethod
    def format_price(cls, price_cents: int, currency: str = 'brl') -> str:
        """
        Formata preço para exibição.
        
        Args:
            price_cents: Preço em centavos
            currency: Moeda (brl, usd, etc.)
            
        Returns:
            Preço formatado (ex: R$ 49,00)
        """
        price = price_cents / 100
        
        if currency == 'brl':
            return f'R$ {price:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
        elif currency == 'usd':
            return f'$ {price:,.2f}'
        else:
            return f'{price:,.2f} {currency.upper()}'


class StripePayments:
    """Gerenciamento de pagamentos com Stripe."""
    
    @staticmethod
    def create_checkout_session(
        product_id: str,
        success_url: str,
        cancel_url: str,
        customer_email: Optional[str] = None
    ) -> Dict:
        """
        Cria sessão de checkout do Stripe.
        
        Args:
            product_id: ID do produto (basic, professional, enterprise)
            success_url: URL de redirecionamento em caso de sucesso
            cancel_url: URL de redirecionamento em caso de cancelamento
            customer_email: Email do cliente (opcional)
            
        Returns:
            Dicionário com informações da sessão de checkout
            
        Raises:
            ValueError: Se produto não existir
            stripe.error.StripeError: Em caso de erro na API do Stripe
        """
        product = StripeProducts.get_product(product_id)
        
        if not product:
            raise ValueError(f'Produto não encontrado: {product_id}')
        
        # Parâmetros da sessão
        session_params = {
            'payment_method_types': ['card'],
            'line_items': [{
                'price_data': {
                    'currency': product['currency'],
                    'product_data': {
                        'name': product['name'],
                        'description': product['description'],
                    },
                    'unit_amount': product['price'],
                },
                'quantity': 1,
            }],
            'mode': 'payment',
            'success_url': success_url,
            'cancel_url': cancel_url,
        }
        
        # Adicionar email do cliente se fornecido
        if customer_email:
            session_params['customer_email'] = customer_email
        
        # Criar sessão no Stripe
        session = stripe.checkout.Session.create(**session_params)
        
        return {
            'session_id': session.id,
            'url': session.url
        }
    
    @staticmethod
    def create_subscription_session(
        product_id: str,
        success_url: str,
        cancel_url: str,
        customer_email: Optional[str] = None,
        trial_days: int = 0
    ) -> Dict:
        """
        Cria sessão de assinatura do Stripe.
        
        Args:
            product_id: ID do produto (basic, professional, enterprise)
            success_url: URL de redirecionamento em caso de sucesso
            cancel_url: URL de redirecionamento em caso de cancelamento
            customer_email: Email do cliente (opcional)
            trial_days: Dias de trial gratuito (opcional)
            
        Returns:
            Dicionário com informações da sessão de assinatura
            
        Raises:
            ValueError: Se produto não existir
            stripe.error.StripeError: Em caso de erro na API do Stripe
        """
        product = StripeProducts.get_product(product_id)
        
        if not product:
            raise ValueError(f'Produto não encontrado: {product_id}')
        
        # Parâmetros da sessão
        session_params = {
            'payment_method_types': ['card'],
            'line_items': [{
                'price_data': {
                    'currency': product['currency'],
                    'product_data': {
                        'name': product['name'],
                        'description': product['description'],
                    },
                    'unit_amount': product['price'],
                    'recurring': {
                        'interval': 'month',
                    },
                },
                'quantity': 1,
            }],
            'mode': 'subscription',
            'success_url': success_url,
            'cancel_url': cancel_url,
        }
        
        # Adicionar email do cliente se fornecido
        if customer_email:
            session_params['customer_email'] = customer_email
        
        # Adicionar trial se especificado
        if trial_days > 0:
            session_params['subscription_data'] = {
                'trial_period_days': trial_days
            }
        
        # Criar sessão no Stripe
        session = stripe.checkout.Session.create(**session_params)
        
        return {
            'session_id': session.id,
            'url': session.url
        }
    
    @staticmethod
    def retrieve_session(session_id: str) -> Dict:
        """
        Recupera informações de uma sessão de checkout.
        
        Args:
            session_id: ID da sessão
            
        Returns:
            Dicionário com informações da sessão
        """
        session = stripe.checkout.Session.retrieve(session_id)
        
        return {
            'id': session.id,
            'payment_status': session.payment_status,
            'customer_email': session.customer_email,
            'amount_total': session.amount_total,
            'currency': session.currency,
        }


class StripeWebhooks:
    """Gerenciamento de webhooks do Stripe."""
    
    @staticmethod
    def construct_event(payload: bytes, sig_header: str, webhook_secret: str):
        """
        Constrói evento do webhook do Stripe.
        
        Args:
            payload: Payload da requisição (bytes)
            sig_header: Header de assinatura (Stripe-Signature)
            webhook_secret: Secret do webhook
            
        Returns:
            Evento do Stripe
            
        Raises:
            stripe.error.SignatureVerificationError: Se assinatura inválida
        """
        return stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    
    @staticmethod
    def handle_checkout_completed(event: Dict) -> Dict:
        """
        Processa evento de checkout completado.
        
        Args:
            event: Evento do Stripe
            
        Returns:
            Dicionário com informações processadas
        """
        session = event['data']['object']
        
        return {
            'session_id': session['id'],
            'customer_email': session.get('customer_email'),
            'amount_total': session.get('amount_total'),
            'currency': session.get('currency'),
            'payment_status': session.get('payment_status'),
        }
    
    @staticmethod
    def handle_payment_succeeded(event: Dict) -> Dict:
        """
        Processa evento de pagamento bem-sucedido.
        
        Args:
            event: Evento do Stripe
            
        Returns:
            Dicionário com informações processadas
        """
        payment_intent = event['data']['object']
        
        return {
            'payment_intent_id': payment_intent['id'],
            'amount': payment_intent['amount'],
            'currency': payment_intent['currency'],
            'status': payment_intent['status'],
        }
    
    @staticmethod
    def handle_subscription_created(event: Dict) -> Dict:
        """
        Processa evento de assinatura criada.
        
        Args:
            event: Evento do Stripe
            
        Returns:
            Dicionário com informações processadas
        """
        subscription = event['data']['object']
        
        return {
            'subscription_id': subscription['id'],
            'customer': subscription['customer'],
            'status': subscription['status'],
            'current_period_start': subscription['current_period_start'],
            'current_period_end': subscription['current_period_end'],
        }


# Exemplo de uso
if __name__ == '__main__':
    # Configurar Stripe
    config = StripeConfig()
    
    print('🔐 Configuração do Stripe')
    print('=' * 50)
    print(f'Configurado: {config.is_configured()}')
    print(f'Chave publicável: {config.get_publishable_key()[:20]}...' if config.is_configured() else 'Não configurado')
    print()
    
    # Listar produtos
    print('📦 Produtos Disponíveis')
    print('=' * 50)
    
    for product_id, product in StripeProducts.get_all_products().items():
        print(f'\n{product["name"]} ({product_id})')
        print(f'Preço: {StripeProducts.format_price(product["price"], product["currency"])}')
        print(f'Descrição: {product["description"]}')
        print('Recursos:')
        for feature in product['features']:
            print(f'  ✓ {feature}')

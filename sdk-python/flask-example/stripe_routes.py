"""
Rotas do Stripe para pagamentos e assinaturas
"""
from flask import request, render_template, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
import stripe
from stripe_config import StripeConfig, StripeProducts, StripePayments, StripeWebhooks


def register_stripe_routes(app):
    """
    Registra rotas do Stripe na aplicação Flask.
    
    Args:
        app: Instância do Flask
    """
    # Inicializar configuração do Stripe
    stripe_config = StripeConfig()
    
    @app.route('/pricing')
    def pricing():
        """Página de preços com planos disponíveis."""
        products = {}
        
        # Formatar produtos para exibição
        for product_id, product in StripeProducts.get_all_products().items():
            products[product_id] = {
                **product,
                'price_formatted': StripeProducts.format_price(
                    product['price'], 
                    product['currency']
                )
            }
        
        return render_template(
            'pricing.html',
            products=products,
            stripe_configured=stripe_config.is_configured()
        )
    
    @app.route('/create-checkout', methods=['POST'])
    @login_required
    def create_checkout():
        """Cria sessão de checkout do Stripe."""
        if not stripe_config.is_configured():
            flash('Stripe não configurado. Configure as chaves no arquivo .env', 'error')
            return redirect(url_for('pricing'))
        
        try:
            # Obter dados do formulário
            product_id = request.form.get('product_id')
            mode = request.form.get('mode', 'subscription')  # payment ou subscription
            
            # Validar produto
            product = StripeProducts.get_product(product_id)
            if not product:
                flash('Produto inválido', 'error')
                return redirect(url_for('pricing'))
            
            # URLs de sucesso e cancelamento
            success_url = url_for('payment_success', _external=True) + '?session_id={CHECKOUT_SESSION_ID}'
            cancel_url = url_for('payment_cancel', _external=True)
            
            # Criar sessão de checkout
            if mode == 'subscription':
                session = StripePayments.create_subscription_session(
                    product_id=product_id,
                    success_url=success_url,
                    cancel_url=cancel_url,
                    customer_email=current_user.email,
                    trial_days=0  # Sem trial por padrão
                )
            else:
                session = StripePayments.create_checkout_session(
                    product_id=product_id,
                    success_url=success_url,
                    cancel_url=cancel_url,
                    customer_email=current_user.email
                )
            
            # Redirecionar para checkout do Stripe
            return redirect(session['url'])
            
        except ValueError as e:
            flash(f'Erro: {str(e)}', 'error')
            return redirect(url_for('pricing'))
        except stripe.error.StripeError as e:
            flash(f'Erro no Stripe: {str(e)}', 'error')
            return redirect(url_for('pricing'))
        except Exception as e:
            flash(f'Erro inesperado: {str(e)}', 'error')
            return redirect(url_for('pricing'))
    
    @app.route('/payment/success')
    @login_required
    def payment_success():
        """Página de sucesso após pagamento."""
        session_id = request.args.get('session_id')
        
        if not session_id:
            flash('Sessão de pagamento não encontrada', 'warning')
            return redirect(url_for('pricing'))
        
        try:
            # Recuperar informações da sessão
            session_data = StripePayments.retrieve_session(session_id)
            
            # Formatar dados para exibição
            session_display = {
                'id': session_data['id'],
                'customer_email': session_data.get('customer_email', 'Não informado'),
                'amount_formatted': StripeProducts.format_price(
                    session_data.get('amount_total', 0),
                    session_data.get('currency', 'brl')
                ),
                'payment_status': session_data.get('payment_status', 'unknown'),
                'payment_status_text': {
                    'paid': 'Pago',
                    'unpaid': 'Não pago',
                    'no_payment_required': 'Sem pagamento necessário'
                }.get(session_data.get('payment_status', 'unknown'), 'Desconhecido')
            }
            
            return render_template('payment_success.html', session=session_display)
            
        except stripe.error.StripeError as e:
            flash(f'Erro ao recuperar sessão: {str(e)}', 'error')
            return redirect(url_for('pricing'))
    
    @app.route('/payment/cancel')
    @login_required
    def payment_cancel():
        """Página de cancelamento de pagamento."""
        return render_template('payment_cancel.html')
    
    @app.route('/webhook/stripe', methods=['POST'])
    def stripe_webhook():
        """
        Webhook do Stripe para processar eventos.
        
        Eventos suportados:
        - checkout.session.completed: Checkout completado
        - payment_intent.succeeded: Pagamento bem-sucedido
        - customer.subscription.created: Assinatura criada
        - customer.subscription.updated: Assinatura atualizada
        - customer.subscription.deleted: Assinatura cancelada
        """
        if not stripe_config.is_configured():
            return jsonify({'error': 'Stripe not configured'}), 400
        
        # Obter payload e assinatura
        payload = request.data
        sig_header = request.headers.get('Stripe-Signature')
        
        if not sig_header:
            return jsonify({'error': 'Missing signature'}), 400
        
        try:
            # Construir evento do webhook
            event = StripeWebhooks.construct_event(
                payload,
                sig_header,
                stripe_config.webhook_secret
            )
            
            # Log do evento recebido
            app.logger.info(f'[STRIPE] Evento recebido: {event["type"]}')
            
            # Processar evento
            if event['type'] == 'checkout.session.completed':
                session_data = StripeWebhooks.handle_checkout_completed(event)
                app.logger.info(f'[STRIPE] Checkout completado: {session_data["session_id"]}')
                
                # TODO: Ativar plano do usuário no banco de dados
                # user = User.get_by_email(session_data['customer_email'])
                # user.activate_subscription(...)
                
            elif event['type'] == 'payment_intent.succeeded':
                payment_data = StripeWebhooks.handle_payment_succeeded(event)
                app.logger.info(f'[STRIPE] Pagamento bem-sucedido: {payment_data["payment_intent_id"]}')
                
                # TODO: Registrar pagamento no banco de dados
                
            elif event['type'] == 'customer.subscription.created':
                subscription_data = StripeWebhooks.handle_subscription_created(event)
                app.logger.info(f'[STRIPE] Assinatura criada: {subscription_data["subscription_id"]}')
                
                # TODO: Ativar assinatura do usuário
                
            elif event['type'] == 'customer.subscription.updated':
                subscription = event['data']['object']
                app.logger.info(f'[STRIPE] Assinatura atualizada: {subscription["id"]}')
                
                # TODO: Atualizar status da assinatura
                
            elif event['type'] == 'customer.subscription.deleted':
                subscription = event['data']['object']
                app.logger.info(f'[STRIPE] Assinatura cancelada: {subscription["id"]}')
                
                # TODO: Desativar assinatura do usuário
            
            else:
                app.logger.warning(f'[STRIPE] Evento não tratado: {event["type"]}')
            
            return jsonify({'status': 'success'}), 200
            
        except stripe.error.SignatureVerificationError as e:
            app.logger.error(f'[STRIPE] Erro de verificação de assinatura: {str(e)}')
            return jsonify({'error': 'Invalid signature'}), 400
        except Exception as e:
            app.logger.error(f'[STRIPE] Erro ao processar webhook: {str(e)}')
            return jsonify({'error': 'Internal error'}), 500
    
    @app.route('/api/stripe/config')
    def stripe_config_api():
        """Retorna configuração pública do Stripe (chave publicável)."""
        return jsonify({
            'publishable_key': stripe_config.get_publishable_key(),
            'configured': stripe_config.is_configured()
        })

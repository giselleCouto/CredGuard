import rateLimit from 'express-rate-limit';

/**
 * Rate limiter global para todas as requisições
 * Limite: 100 requisições por minuto por IP
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requisições por janela
  message: {
    error: 'Muitas requisições deste IP, tente novamente em 1 minuto.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true, // Retorna info de rate limit nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
  // keyGenerator padrão usa req.ip com suporte a IPv6
  // Pular rate limit para health checks
  skip: (req) => {
    return req.path === '/api/health' || req.path === '/health';
  },
});

/**
 * Rate limiter estrito para endpoints de autenticação
 * Limite: 5 tentativas por minuto por IP
 * Proteção contra ataques de força bruta
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // 5 tentativas por janela
  message: {
    error: 'Muitas tentativas de login, tente novamente em 1 minuto.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // keyGenerator padrão usa req.ip com suporte a IPv6
  // Após atingir limite, bloquear por 5 minutos
  skipSuccessfulRequests: true, // Não contar requisições bem-sucedidas
});

/**
 * Rate limiter para uploads de arquivos
 * Limite: 10 uploads por minuto por IP
 * Proteção contra abuso de recursos (storage, processamento)
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 uploads por janela
  message: {
    error: 'Muitos uploads, tente novamente em 1 minuto.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // keyGenerator padrão usa req.ip com suporte a IPv6
});

/**
 * Rate limiter para operações de ML (predições, drift detection)
 * Limite: 30 operações por minuto por IP
 * Proteção contra abuso de recursos computacionais
 */
export const mlLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 operações por janela
  message: {
    error: 'Muitas operações de ML, tente novamente em 1 minuto.',
    code: 'ML_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // keyGenerator padrão usa req.ip com suporte a IPv6
});

/**
 * Rate limiter para consultas de bureau
 * Limite: 20 consultas por minuto por IP
 * Proteção contra custos excessivos de API externa
 */
export const bureauLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // 20 consultas por janela
  message: {
    error: 'Muitas consultas de bureau, tente novamente em 1 minuto.',
    code: 'BUREAU_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // keyGenerator padrão usa req.ip com suporte a IPv6
});

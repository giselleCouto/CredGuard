import winston from 'winston';
import { ENV } from './env';

/**
 * Configuração do logger Winston com níveis estruturados
 * Logs são escritos em console (desenvolvimento) e arquivo (produção)
 */

// Formato customizado para logs estruturados
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  winston.format.json()
);

// Formato legível para console em desenvolvimento
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Criar logger
export const logger = winston.createLogger({
  level: ENV.isProduction ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'credguard-api' },
  transports: [
    // Console transport (sempre ativo)
    new winston.transports.Console({
      format: ENV.isProduction ? logFormat : consoleFormat,
    }),
    // File transport para erros (produção)
    ...(ENV.isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
});

/**
 * Helper functions para logging de eventos específicos
 */

export const logAuth = {
  loginSuccess: (userId: number, email: string, ip: string) => {
    logger.info('Login bem-sucedido', {
      event: 'auth.login.success',
      userId,
      email,
      ip,
    });
  },

  loginFailed: (email: string, ip: string, reason: string) => {
    logger.warn('Tentativa de login falhada', {
      event: 'auth.login.failed',
      email,
      ip,
      reason,
    });
  },

  logout: (userId: number, email: string) => {
    logger.info('Logout', {
      event: 'auth.logout',
      userId,
      email,
    });
  },

  rateLimitExceeded: (ip: string, endpoint: string) => {
    logger.warn('Rate limit excedido em autenticação', {
      event: 'auth.rate_limit_exceeded',
      ip,
      endpoint,
    });
  },
};

export const logRateLimit = {
  exceeded: (ip: string, endpoint: string, limiter: string) => {
    logger.warn('Rate limit excedido', {
      event: 'rate_limit.exceeded',
      ip,
      endpoint,
      limiter,
    });
  },
};

export const logUpload = {
  started: (userId: number, fileName: string, fileSize: number) => {
    logger.info('Upload iniciado', {
      event: 'upload.started',
      userId,
      fileName,
      fileSize,
    });
  },

  completed: (userId: number, fileName: string, rowsProcessed: number, duration: number) => {
    logger.info('Upload concluído', {
      event: 'upload.completed',
      userId,
      fileName,
      rowsProcessed,
      duration,
    });
  },

  failed: (userId: number, fileName: string, error: string) => {
    logger.error('Upload falhou', {
      event: 'upload.failed',
      userId,
      fileName,
      error,
    });
  },
};

export const logML = {
  predictionStarted: (userId: number, tenantId: number, creditType: string) => {
    logger.info('Predição ML iniciada', {
      event: 'ml.prediction.started',
      userId,
      tenantId,
      creditType,
    });
  },

  predictionCompleted: (userId: number, tenantId: number, creditType: string, score: string, duration: number) => {
    logger.info('Predição ML concluída', {
      event: 'ml.prediction.completed',
      userId,
      tenantId,
      creditType,
      score,
      duration,
    });
  },

  driftDetected: (tenantId: number, product: string, psi: number, status: string) => {
    logger.warn('Drift detectado em modelo', {
      event: 'ml.drift.detected',
      tenantId,
      product,
      psi,
      status,
    });
  },

  modelDeployed: (userId: number, modelId: number, product: string) => {
    logger.info('Modelo ML deployado', {
      event: 'ml.model.deployed',
      userId,
      modelId,
      product,
    });
  },
};

export const logBureau = {
  queryStarted: (userId: number, cpf: string) => {
    logger.info('Consulta bureau iniciada', {
      event: 'bureau.query.started',
      userId,
      cpf: cpf.substring(0, 3) + '***', // Ofuscar CPF
    });
  },

  queryCached: (userId: number, cpf: string) => {
    logger.info('Consulta bureau em cache', {
      event: 'bureau.query.cached',
      userId,
      cpf: cpf.substring(0, 3) + '***',
    });
  },

  queryFailed: (userId: number, cpf: string, error: string) => {
    logger.error('Consulta bureau falhou', {
      event: 'bureau.query.failed',
      userId,
      cpf: cpf.substring(0, 3) + '***',
      error,
    });
  },
};

export const logSecurity = {
  unauthorizedAccess: (ip: string, endpoint: string, userId?: number) => {
    logger.warn('Tentativa de acesso não autorizado', {
      event: 'security.unauthorized_access',
      ip,
      endpoint,
      userId,
    });
  },

  forbiddenAccess: (userId: number, endpoint: string, tenantId: number) => {
    logger.warn('Tentativa de acesso a dados de outro tenant', {
      event: 'security.forbidden_access',
      userId,
      endpoint,
      tenantId,
    });
  },

  suspiciousActivity: (ip: string, description: string) => {
    logger.warn('Atividade suspeita detectada', {
      event: 'security.suspicious_activity',
      ip,
      description,
    });
  },
};

export const logError = {
  database: (operation: string, error: string) => {
    logger.error('Erro de banco de dados', {
      event: 'error.database',
      operation,
      error,
    });
  },

  api: (endpoint: string, error: string, userId?: number) => {
    logger.error('Erro em API', {
      event: 'error.api',
      endpoint,
      error,
      userId,
    });
  },

  unhandled: (error: Error) => {
    logger.error('Erro não tratado', {
      event: 'error.unhandled',
      error: error.message,
      stack: error.stack,
    });
  },
};

// Log de inicialização
logger.info('Logger inicializado', {
  environment: ENV.isProduction ? 'production' : 'development',
  level: logger.level,
});

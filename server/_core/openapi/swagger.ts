import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './spec';

/**
 * Configura Swagger UI na rota /api/docs
 * 
 * Permite visualizar e testar todos os endpoints da API
 * diretamente no navegador.
 */
export function setupSwaggerUI(app: Express) {
  // Serve spec JSON
  app.get('/api/openapi.json', (req, res) => {
    res.json(openApiSpec);
  });

  // Swagger UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'CredGuard API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
    })
  );

  console.log('[OpenAPI] Swagger UI disponível em /api/docs');
  console.log('[OpenAPI] Spec JSON disponível em /api/openapi.json');
}

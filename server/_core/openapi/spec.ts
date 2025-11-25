/**
 * OpenAPI 3.0 Specification for CredGuard API
 * 
 * Gerado manualmente a partir dos schemas tRPC.
 * Compatível com Swagger UI e ferramentas OpenAPI.
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'CredGuard API',
    version: '1.0.0',
    description: `
# CredGuard - API de Credit Scoring B2B

API REST para análise de crédito em lote com modelos de Machine Learning.

---

## 🚀 Getting Started (Tutorial Interativo)

### Passo 1: Obter Token de Autenticação

Todas as rotas (exceto \`/health\`) requerem **Bearer Token** (JWT).

**cURL:**
\`\`\`bash
curl -X POST https://api.credguard.com/api/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{"client_id": "YOUR_CLIENT_ID", "client_secret": "YOUR_SECRET"}'
\`\`\`

**Python:**
\`\`\`python
import requests

response = requests.post(
    'https://api.credguard.com/api/oauth/token',
    json={'client_id': 'YOUR_CLIENT_ID', 'client_secret': 'YOUR_SECRET'}
)
token = response.json()['access_token']
print(f"Token: {token}")
\`\`\`

**JavaScript:**
\`\`\`javascript
const response = await fetch('https://api.credguard.com/api/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ client_id: 'YOUR_CLIENT_ID', client_secret: 'YOUR_SECRET' })
});
const { access_token } = await response.json();
console.log('Token:', access_token);
\`\`\`

---

### Passo 2: Fazer Upload de CSV

Envie arquivo CSV com dados de clientes para análise.

**cURL:**
\`\`\`bash
curl -X POST https://api.credguard.com/api/trpc/batch.upload \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fileName": "clientes_nov_2025.csv",
    "fileSize": 1024000,
    "product": "CARTAO",
    "csvData": "cpf,nome,renda,idade\\n12345678901,João Silva,5000,35\\n"
  }'
\`\`\`

**Python:**
\`\`\`python
import requests
import base64

with open('clientes.csv', 'rb') as f:
    csv_content = f.read().decode('utf-8')

response = requests.post(
    'https://api.credguard.com/api/trpc/batch.upload',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'fileName': 'clientes_nov_2025.csv',
        'fileSize': len(csv_content),
        'product': 'CARTAO',
        'csvData': csv_content
    }
)
job_id = response.json()['result']['data']['jobId']
print(f"Job ID: {job_id}")
\`\`\`

**JavaScript:**
\`\`\`javascript
const csvContent = 'cpf,nome,renda,idade\\n12345678901,João Silva,5000,35';

const response = await fetch('https://api.credguard.com/api/trpc/batch.upload', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${access_token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileName: 'clientes_nov_2025.csv',
    fileSize: csvContent.length,
    product: 'CARTAO',
    csvData: csvContent
  })
});
const { result } = await response.json();
console.log('Job ID:', result.data.jobId);
\`\`\`

---

### Passo 3: Consultar Status do Processamento

Verifique o progresso do job (polling a cada 5-10 segundos).

**cURL:**
\`\`\`bash
curl -X GET "https://api.credguard.com/api/trpc/batch.getJob?jobId=550e8400-e29b-41d4-a716-446655440000" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
\`\`\`

**Python:**
\`\`\`python
import time

while True:
    response = requests.get(
        f'https://api.credguard.com/api/trpc/batch.getJob?jobId={job_id}',
        headers={'Authorization': f'Bearer {token}'}
    )
    job = response.json()['result']['data']
    
    print(f"Status: {job['status']} - Progresso: {job['progress']}%")
    
    if job['status'] == 'completed':
        print("✅ Processamento concluído!")
        break
    elif job['status'] == 'failed':
        print("❌ Processamento falhou")
        break
    
    time.sleep(5)  # Aguardar 5 segundos antes de consultar novamente
\`\`\`

**JavaScript:**
\`\`\`javascript
const pollJobStatus = async (jobId) => {
  while (true) {
    const response = await fetch(
      \`https://api.credguard.com/api/trpc/batch.getJob?jobId=\${jobId}\`,
      { headers: { 'Authorization': \`Bearer \${access_token}\` } }
    );
    const { result } = await response.json();
    
    console.log(\`Status: \${result.data.status} - Progresso: \${result.data.progress}%\`);
    
    if (result.data.status === 'completed') {
      console.log('✅ Processamento concluído!');
      return result.data;
    } else if (result.data.status === 'failed') {
      console.log('❌ Processamento falhou');
      throw new Error('Job failed');
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000)); // Aguardar 5s
  }
};

await pollJobStatus(jobId);
\`\`\`

---

### Passo 4: Baixar Resultados (CSV)

Após conclusão, faça download do CSV com scores.

**cURL:**
\`\`\`bash
curl -X GET "https://api.credguard.com/api/trpc/batch.downloadCsv?jobId=550e8400-e29b-41d4-a716-446655440000" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -o resultados.csv
\`\`\`

**Python:**
\`\`\`python
response = requests.get(
    f'https://api.credguard.com/api/trpc/batch.downloadCsv?jobId={job_id}',
    headers={'Authorization': f'Bearer {token}'}
)

with open('resultados.csv', 'wb') as f:
    f.write(response.content)

print("✅ Resultados salvos em resultados.csv")
\`\`\`

**JavaScript:**
\`\`\`javascript
const response = await fetch(
  \`https://api.credguard.com/api/trpc/batch.downloadCsv?jobId=\${jobId}\`,
  { headers: { 'Authorization': \`Bearer \${access_token}\` } }
);
const csvBlob = await response.blob();

// Salvar arquivo no navegador
const url = URL.createObjectURL(csvBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'resultados.csv';
a.click();

console.log('✅ Download iniciado!');
\`\`\`

---

## ⚠️ Troubleshooting Comum

### Erro 401 Unauthorized
**Causa:** Token inválido ou expirado.  
**Solução:** Gere novo token via \`/api/oauth/token\`.

### Erro 429 Too Many Requests
**Causa:** Rate limit excedido.  
**Solução:** Aguarde 60 segundos ou implemente exponential backoff.

### Erro 400 Bad Request - CPF inválido
**Causa:** CPF com formato incorreto ou dígitos verificadores inválidos.  
**Solução:** Valide CPFs antes do upload (11 dígitos, algoritmo módulo 11).

### Job com status \`failed\`
**Causa:** CSV com formato incorreto ou campos obrigatórios faltando.  
**Solução:** Verifique que CSV tem colunas: \`cpf,nome,renda,idade\` (mínimo).

---

## 📊 Rate Limits

- **Global:** 100 requisições/minuto
- **Upload:** 10 requisições/minuto
- **Auth:** 5 requisições/minuto

## 📞 Suporte

- **Email:** api@credguard.com
- **Docs:** https://docs.credguard.com
- **Status:** https://status.credguard.com
    `,
    contact: {
      name: 'CredGuard API Support',
      email: 'api@credguard.com',
      url: 'https://credguard.com/support'
    },
    license: {
      name: 'Proprietary',
      url: 'https://credguard.com/terms'
    }
  },
  servers: [
    {
      url: 'https://credguard.com',
      description: 'Produção'
    },
    {
      url: 'https://staging.credguard.com',
      description: 'Staging'
    },
    {
      url: 'http://localhost:3000',
      description: 'Desenvolvimento Local'
    }
  ],
  tags: [
    { name: 'Health', description: 'Endpoints de monitoramento' },
    { name: 'Auth', description: 'Autenticação e autorização' },
    { name: 'Batch', description: 'Upload e processamento em lote' },
    { name: 'Bureau', description: 'Integração com bureaus de crédito' },
    { name: 'Models', description: 'Gestão de modelos ML' },
    { name: 'Drift', description: 'Monitoramento de drift' },
    { name: 'Sustentation', description: 'Planos de sustentação' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health Check',
        description: 'Verifica status do servidor, banco de dados e memória',
        operationId: 'healthCheck',
        responses: {
          '200': {
            description: 'Servidor saudável',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                    uptime: { type: 'number', description: 'Uptime em segundos' },
                    memory: {
                      type: 'object',
                      properties: {
                        used: { type: 'number' },
                        total: { type: 'number' },
                        percentage: { type: 'number' }
                      }
                    },
                    database: {
                      type: 'object',
                      properties: {
                        connected: { type: 'boolean' },
                        responseTime: { type: 'number', description: 'Tempo de resposta em ms' }
                      }
                    }
                  }
                },
                example: {
                  status: 'healthy',
                  uptime: 86400,
                  memory: { used: 512, total: 2048, percentage: 25 },
                  database: { connected: true, responseTime: 5 }
                }
              }
            }
          }
        }
      }
    },
    '/api/trpc/batch.upload': {
      post: {
        tags: ['Batch'],
        summary: 'Upload de arquivo CSV/Excel',
        description: 'Faz upload de arquivo com dados de clientes para processamento em lote',
        operationId: 'batchUpload',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Arquivo CSV ou Excel'
                  },
                  product: {
                    type: 'string',
                    enum: ['CARTAO', 'CARNE', 'EMPRESTIMO'],
                    description: 'Tipo de produto de crédito'
                  }
                },
                required: ['file', 'product']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Upload iniciado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    jobId: { type: 'string', format: 'uuid' },
                    status: { type: 'string', enum: ['processing'] },
                    totalRows: { type: 'number' }
                  }
                },
                example: {
                  jobId: '550e8400-e29b-41d4-a716-446655440000',
                  status: 'processing',
                  totalRows: 1000
                }
              }
            }
          },
          '400': {
            description: 'Arquivo inválido ou parâmetros incorretos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '429': {
            description: 'Rate limit excedido (máx 10 req/min)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/trpc/batch.getJob': {
      get: {
        tags: ['Batch'],
        summary: 'Consultar status de job',
        description: 'Retorna status e progresso de um job de processamento',
        operationId: 'batchGetJob',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'jobId',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID do job retornado no upload'
          }
        ],
        responses: {
          '200': {
            description: 'Status do job',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    jobId: { type: 'string' },
                    status: { type: 'string', enum: ['processing', 'completed', 'failed'] },
                    progress: { type: 'number', minimum: 0, maximum: 100 },
                    totalRows: { type: 'number' },
                    processedRows: { type: 'number' },
                    createdAt: { type: 'string', format: 'date-time' },
                    completedAt: { type: 'string', format: 'date-time', nullable: true }
                  }
                },
                example: {
                  jobId: '550e8400-e29b-41d4-a716-446655440000',
                  status: 'completed',
                  progress: 100,
                  totalRows: 1000,
                  processedRows: 1000,
                  createdAt: '2025-11-25T10:00:00Z',
                  completedAt: '2025-11-25T10:05:00Z'
                }
              }
            }
          },
          '404': {
            description: 'Job não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/trpc/batch.downloadCsv': {
      get: {
        tags: ['Batch'],
        summary: 'Download de resultados (CSV)',
        description: 'Baixa arquivo CSV com scores gerados',
        operationId: 'batchDownloadCsv',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'jobId',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Arquivo CSV',
            content: {
              'text/csv': {
                schema: {
                  type: 'string',
                  format: 'binary'
                },
                example: 'cpf,nome,score_prob_inadimplencia,faixa_score,motivo_exclusao\n12345678901,João Silva,0.15,A,\n'
              }
            }
          },
          '404': {
            description: 'Job não encontrado ou ainda processando'
          }
        }
      }
    },
    '/api/trpc/models.upload': {
      post: {
        tags: ['Models'],
        summary: 'Upload de modelo ML (.pkl)',
        description: 'Faz upload de arquivo .pkl com modelo treinado',
        operationId: 'modelsUpload',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  modelName: { type: 'string', description: 'Nome do modelo (ex: fa_8)' },
                  product: { type: 'string', enum: ['CARTAO', 'CARNE', 'EMPRESTIMO'] },
                  version: { type: 'string', description: 'Versão do modelo (ex: 1.0.0)' },
                  fileBase64: { type: 'string', description: 'Arquivo .pkl em base64' },
                  metrics: {
                    type: 'object',
                    properties: {
                      accuracy: { type: 'number' },
                      precision: { type: 'number' },
                      recall: { type: 'number' },
                      f1Score: { type: 'number' }
                    }
                  }
                },
                required: ['modelName', 'product', 'version', 'fileBase64']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Modelo enviado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    modelId: { type: 'number' },
                    status: { type: 'string', enum: ['validated', 'pending'] }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/trpc/models.list': {
      get: {
        tags: ['Models'],
        summary: 'Listar modelos ML',
        description: 'Retorna lista de modelos disponíveis por produto',
        operationId: 'modelsList',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'product',
            in: 'query',
            required: true,
            schema: { type: 'string', enum: ['CARTAO', 'CARNE', 'EMPRESTIMO'] }
          }
        ],
        responses: {
          '200': {
            description: 'Lista de modelos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      modelName: { type: 'string' },
                      version: { type: 'string' },
                      product: { type: 'string' },
                      status: { type: 'string', enum: ['production', 'validated', 'pending'] },
                      metrics: { type: 'object' },
                      createdAt: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/trpc/drift.detect': {
      post: {
        tags: ['Drift'],
        summary: 'Detectar drift de modelo',
        description: 'Calcula PSI (Population Stability Index) para detectar drift',
        operationId: 'driftDetect',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  modelId: { type: 'number' },
                  jobId: { type: 'string', format: 'uuid', description: 'Job de referência' }
                },
                required: ['modelId', 'jobId']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Resultado da detecção de drift',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    driftDetected: { type: 'boolean' },
                    psi: { type: 'number', description: 'Population Stability Index' },
                    status: { type: 'string', enum: ['stable', 'warning', 'critical'] },
                    message: { type: 'string' }
                  }
                },
                example: {
                  driftDetected: true,
                  psi: 0.25,
                  status: 'critical',
                  message: 'Drift crítico detectado (PSI > 0.2). Retreinamento recomendado.'
                }
              }
            }
          }
        }
      }
    },
    '/api/trpc/drift.history': {
      get: {
        tags: ['Drift'],
        summary: 'Histórico de drift',
        description: 'Retorna histórico de detecções de drift',
        operationId: 'driftHistory',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'modelId',
            in: 'query',
            required: false,
            schema: { type: 'number' }
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'number', default: 50 }
          }
        ],
        responses: {
          '200': {
            description: 'Histórico de drift',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      modelId: { type: 'number' },
                      psi: { type: 'number' },
                      status: { type: 'string' },
                      detectedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/trpc/bureau.getConfig': {
      get: {
        tags: ['Bureau'],
        summary: 'Consultar configuração de bureau',
        description: 'Retorna status de ativação e provedor configurado',
        operationId: 'bureauGetConfig',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Configuração do bureau',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    bureauEnabled: { type: 'boolean' },
                    provider: { type: 'string', enum: ['SERASA', 'BOA_VISTA', 'SPC'], nullable: true },
                    apiToken: { type: 'string', nullable: true }
                  }
                },
                example: {
                  bureauEnabled: true,
                  provider: 'SERASA',
                  apiToken: 'sk_test_***'
                }
              }
            }
          }
        }
      }
    },
    '/api/trpc/bureau.updateConfig': {
      post: {
        tags: ['Bureau'],
        summary: 'Atualizar configuração de bureau',
        description: 'Ativa/desativa integração com bureau de crédito',
        operationId: 'bureauUpdateConfig',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  bureauEnabled: { type: 'boolean' },
                  provider: { type: 'string', enum: ['SERASA', 'BOA_VISTA', 'SPC'] },
                  apiToken: { type: 'string' }
                },
                required: ['bureauEnabled']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Configuração atualizada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/trpc/bureau.getMetrics': {
      get: {
        tags: ['Bureau'],
        summary: 'Métricas de uso do bureau',
        description: 'Retorna estatísticas de consultas e custos',
        operationId: 'bureauGetMetrics',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Métricas do bureau',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalQueries: { type: 'number' },
                    cacheHits: { type: 'number' },
                    cacheMisses: { type: 'number' },
                    estimatedCost: { type: 'number', description: 'Custo estimado em R$' }
                  }
                },
                example: {
                  totalQueries: 1500,
                  cacheHits: 900,
                  cacheMisses: 600,
                  estimatedCost: 300.00
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtido via OAuth'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' },
              data: { type: 'object', nullable: true }
            }
          }
        },
        example: {
          error: {
            message: 'CPF inválido',
            code: 'BAD_REQUEST',
            data: { field: 'cpf', value: '00000000000' }
          }
        }
      }
    }
  }
};

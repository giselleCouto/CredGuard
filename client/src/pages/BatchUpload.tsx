import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, FileText, Download, CheckCircle, XCircle, Clock, Loader2, AlertTriangle } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import ThemeToggle from "@/components/ThemeToggle";
import { Link } from "wouter";

import { validateCPFsInCSV } from "@/utils/cpfValidator";

export default function BatchUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    invalidCPFs: Array<{ line: number; cpf: string; reason: string }>;
    totalRows: number;
    validRows: number;
  } | null>(null);
  const [validating, setValidating] = useState(false);

  const { data: jobs, isLoading: jobsLoading, refetch } = trpc.batch.listJobs.useQuery({ limit: 20, offset: 0 });
  const uploadMutation = trpc.batch.upload.useMutation({
    onSuccess: (data) => {
      toast.success(`Upload concluído! Job ID: ${data.jobId}`);
      setSelectedFile(null);
      setUploading(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro no upload: ${error.message}`);
      setUploading(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      await validateFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      await validateFile(file);
    }
  };
  
  const validateFile = async (file: File) => {
    setValidating(true);
    setValidationResult(null);
    
    try {
      const text = await file.text();
      const result = validateCPFsInCSV(text);
      setValidationResult(result);
      
      if (!result.valid) {
        toast.warning(`${result.invalidCPFs.length} CPF(s) inválido(s) encontrado(s)`);
      } else {
        toast.success(`Todos os ${result.validRows} CPFs são válidos!`);
      }
    } catch (error) {
      console.error('Erro ao validar arquivo:', error);
      toast.error('Erro ao validar arquivo CSV');
    } finally {
      setValidating(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo CSV");
      return;
    }
    
    if (validationResult && !validationResult.valid) {
      toast.error(`Não é possível fazer upload com ${validationResult.invalidCPFs.length} CPF(s) inválido(s)`);
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target?.result as string;
        const base64Data = fileData.split(',')[1]; // Remove data:text/csv;base64,

        await uploadMutation.mutateAsync({
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileData: base64Data,
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Upload error:", error);
      setUploading(false);
    }
  };

  const downloadCsv = async (jobId: string) => {
    try {
      // Usar fetch direto para download
      const response = await fetch(`/api/trpc/batch.downloadCsv?input=${encodeURIComponent(JSON.stringify({ jobId }))}`);      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      const data = result.result.data;
      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("CSV baixado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao baixar CSV: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'failed':
        return 'Falhou';
      case 'processing':
        return 'Processando';
      default:
        return 'Na fila';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/credguard-logo.png" alt="CredGuard" className="h-10" />
              <span className="text-xl font-bold">CredGuard</span>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={[
          { label: "Início", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Upload em Lote" }
        ]} />

        <div className="mt-6 space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-6 w-6" />
                Upload de Histórico de Clientes
              </CardTitle>
              <CardDescription>
                Faça upload de um arquivo CSV com o histórico de compras e pagamentos dos seus clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drag and Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Arraste e solte seu arquivo CSV aqui
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  ou clique no botão abaixo para selecionar
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" asChild>
                    <span>Selecionar Arquivo</span>
                  </Button>
                </label>
              </div>

              {selectedFile && (
                <div className="space-y-3">
                  <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleUpload}
                      disabled={uploading || validating || (validationResult ? !validationResult.valid : false)}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Processar
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Resultado da validação */}
                  {validating && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-3">
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      <p className="text-sm text-blue-900 dark:text-blue-100">Validando CPFs...</p>
                    </div>
                  )}
                  
                  {validationResult && validationResult.valid && (
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          Todos os {validationResult.validRows} CPFs são válidos!
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          Arquivo pronto para upload
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {validationResult && !validationResult.valid && (
                    <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-red-900 dark:text-red-100">
                            {validationResult.invalidCPFs.length} CPF(s) inválido(s) encontrado(s)
                          </p>
                          <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                            Corrija os CPFs abaixo antes de fazer upload
                          </p>
                        </div>
                      </div>
                      
                      {/* Lista de CPFs inválidos (máximo 10) */}
                      <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                        {validationResult.invalidCPFs.slice(0, 10).map((item, idx) => (
                          <div key={idx} className="bg-white dark:bg-gray-900 p-2 rounded text-xs">
                            <span className="font-medium text-red-700 dark:text-red-400">Linha {item.line}:</span>
                            <span className="text-gray-700 dark:text-gray-300 ml-2">{item.cpf || '(vazio)'}</span>
                            <span className="text-gray-500 dark:text-gray-400 ml-2">- {item.reason}</span>
                          </div>
                        ))}
                        {validationResult.invalidCPFs.length > 10 && (
                          <p className="text-xs text-red-600 dark:text-red-400 text-center pt-2">
                            ... e mais {validationResult.invalidCPFs.length - 10} erro(s)
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Formato do CSV */}
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Formato do CSV:</h4>
                <code className="text-xs block bg-white dark:bg-gray-900 p-2 rounded border overflow-x-auto">
                  cpf,nome,email,telefone,data_nascimento,renda,produto,data_compra,valor_compra,data_pagamento,status_pagamento,dias_atraso
                </code>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                  <strong>Produtos aceitos:</strong> CARTAO, EMPRESTIMO_PESSOAL, CARNE
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Jobs History */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Processamentos</CardTitle>
              <CardDescription>
                Acompanhe o status dos seus uploads e baixe os resultados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : jobs && jobs.length > 0 ? (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(job.status)}
                        <div>
                          <p className="font-medium">{job.fileName}</p>
                          <p className="text-sm text-muted-foreground">
                            Job ID: {job.jobId}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getStatusText(job.status)} • {job.totalRows || 0} linhas
                            {job.completedAt && ` • ${new Date(job.completedAt).toLocaleString('pt-BR')}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {job.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadCsv(job.jobId)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Baixar CSV
                          </Button>
                        )}
                        {job.status === 'failed' && job.errorMessage && (
                          <p className="text-sm text-red-500">{job.errorMessage}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum processamento realizado ainda
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

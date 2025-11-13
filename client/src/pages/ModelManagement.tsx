import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, CheckCircle2, Cpu, AlertCircle } from "lucide-react";

export default function ModelManagement() {
  const [selectedProduct, setSelectedProduct] = useState<"CARTAO" | "CARNE" | "EMPRESTIMO_PESSOAL">("CARTAO");
  const [modelName, setModelName] = useState("");
  const [version, setVersion] = useState("");
  const [metrics, setMetrics] = useState({
    accuracy: "",
    precision: "",
    recall: "",
    f1_score: "",
    auc_roc: "",
  });
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Queries
  const { data: models, isLoading, refetch } = trpc.models.list.useQuery({ product: selectedProduct });
  const { data: productionModel } = trpc.models.getProduction.useQuery({ product: selectedProduct });

  // Mutations
  const uploadMutation = trpc.models.upload.useMutation({
    onSuccess: () => {
      toast.success("Modelo enviado com sucesso!");
      refetch();
      // Limpar formulário
      setModelName("");
      setVersion("");
      setMetrics({ accuracy: "", precision: "", recall: "", f1_score: "", auc_roc: "" });
      setFileBase64(null);
      setFileName(null);
    },
    onError: (error) => {
      toast.error(`Erro ao enviar modelo: ${error.message}`);
    },
  });

  const promoteMutation = trpc.models.promote.useMutation({
    onSuccess: () => {
      toast.success("Modelo promovido para produção!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao promover modelo: ${error.message}`);
    },
  });

  // Dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/octet-stream': ['.pkl'],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) {
        toast.error("Por favor, selecione um arquivo .pkl válido");
        return;
      }

      const file = acceptedFiles[0];
      setFileName(file.name);

      // Converter para base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remover prefixo data:application/octet-stream;base64,
        const base64Data = base64.split(',')[1];
        setFileBase64(base64Data);
        toast.success(`Arquivo ${file.name} carregado`);
      };
      reader.onerror = () => {
        toast.error("Erro ao ler arquivo");
      };
      reader.readAsDataURL(file);
    },
  });

  const handleUpload = () => {
    if (!modelName || !version || !fileBase64) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const metricsObj: any = {};
    if (metrics.accuracy) metricsObj.accuracy = parseFloat(metrics.accuracy);
    if (metrics.precision) metricsObj.precision = parseFloat(metrics.precision);
    if (metrics.recall) metricsObj.recall = parseFloat(metrics.recall);
    if (metrics.f1_score) metricsObj.f1_score = parseFloat(metrics.f1_score);
    if (metrics.auc_roc) metricsObj.auc_roc = parseFloat(metrics.auc_roc);

    uploadMutation.mutate({
      modelName,
      version,
      product: selectedProduct,
      fileBase64,
      metrics: Object.keys(metricsObj).length > 0 ? metricsObj : undefined,
    });
  };

  const handlePromote = (modelVersionId: number) => {
    if (!confirm("Tem certeza que deseja promover este modelo para produção?")) {
      return;
    }

    promoteMutation.mutate({
      modelVersionId,
      product: selectedProduct,
      reason: "Promoção manual via interface",
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento de Modelos ML</h1>
        <p className="text-muted-foreground">
          Faça upload, gerencie versões e promova modelos para produção
        </p>
      </div>

      {/* Upload de Modelo */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Novo Modelo</CardTitle>
          <CardDescription>
            Envie um arquivo .pkl com o modelo treinado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="modelName">Nome do Modelo</Label>
              <Input
                id="modelName"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="ex: FA-15"
              />
            </div>
            <div>
              <Label htmlFor="version">Versão</Label>
              <Input
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="ex: 1.0.0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="product">Produto</Label>
            <Select value={selectedProduct} onValueChange={(v: any) => setSelectedProduct(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CARTAO">Cartão</SelectItem>
                <SelectItem value="CARNE">Carnê</SelectItem>
                <SelectItem value="EMPRESTIMO_PESSOAL">Empréstimo Pessoal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-5 gap-4">
            <div>
              <Label htmlFor="accuracy">Accuracy</Label>
              <Input
                id="accuracy"
                type="number"
                step="0.0001"
                value={metrics.accuracy}
                onChange={(e) => setMetrics({ ...metrics, accuracy: e.target.value })}
                placeholder="0.85"
              />
            </div>
            <div>
              <Label htmlFor="precision">Precision</Label>
              <Input
                id="precision"
                type="number"
                step="0.0001"
                value={metrics.precision}
                onChange={(e) => setMetrics({ ...metrics, precision: e.target.value })}
                placeholder="0.82"
              />
            </div>
            <div>
              <Label htmlFor="recall">Recall</Label>
              <Input
                id="recall"
                type="number"
                step="0.0001"
                value={metrics.recall}
                onChange={(e) => setMetrics({ ...metrics, recall: e.target.value })}
                placeholder="0.88"
              />
            </div>
            <div>
              <Label htmlFor="f1_score">F1 Score</Label>
              <Input
                id="f1_score"
                type="number"
                step="0.0001"
                value={metrics.f1_score}
                onChange={(e) => setMetrics({ ...metrics, f1_score: e.target.value })}
                placeholder="0.85"
              />
            </div>
            <div>
              <Label htmlFor="auc_roc">AUC-ROC</Label>
              <Input
                id="auc_roc"
                type="number"
                step="0.0001"
                value={metrics.auc_roc}
                onChange={(e) => setMetrics({ ...metrics, auc_roc: e.target.value })}
                placeholder="0.90"
              />
            </div>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {fileName ? (
              <p className="text-sm font-medium">{fileName}</p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  {isDragActive ? "Solte o arquivo aqui" : "Arraste um arquivo .pkl ou clique para selecionar"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Apenas arquivos .pkl são aceitos
                </p>
              </>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending || !fileBase64}
            className="w-full"
          >
            {uploadMutation.isPending ? "Enviando..." : "Enviar Modelo"}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Modelos */}
      <Card>
        <CardHeader>
          <CardTitle>Versões de Modelos - {selectedProduct}</CardTitle>
          <CardDescription>
            Gerencie versões e promova modelos para produção
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : models && models.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => {
                  const isProduction = productionModel?.id === model.id;
                  const metricsData = model.metrics ? JSON.parse(model.metrics) : {};

                  return (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">
                        {model.modelName}
                        {isProduction && (
                          <Badge variant="default" className="ml-2">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Produção
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{model.version}</TableCell>
                      <TableCell>
                        <Badge variant={model.status === "production" ? "default" : "secondary"}>
                          {model.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {metricsData.accuracy ? `${(metricsData.accuracy * 100).toFixed(2)}%` : "N/A"}
                      </TableCell>
                      <TableCell>
                        {new Date(model.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        {!isProduction && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePromote(model.id)}
                            disabled={promoteMutation.isPending}
                          >
                            <Cpu className="h-4 w-4 mr-2" />
                            Promover
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum modelo encontrado para este produto</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

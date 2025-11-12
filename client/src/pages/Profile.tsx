import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumbs from "@/components/Breadcrumbs";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";
import { RiskScoreWithTooltip } from "@/components/RiskScore";
import { trpc } from "@/lib/trpc";
import { User, Mail, Phone, Building, Briefcase, Calendar, TrendingUp, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Profile() {
  const { data: user, isLoading: userLoading, refetch } = trpc.profile.me.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.profile.stats.useQuery();
  const { data: myPredictions, isLoading: predictionsLoading } = trpc.profile.myPredictions.useQuery({ limit: 10, offset: 0 });
  
  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      refetch();
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    company: "",
    position: "",
    bio: "",
  });

  const handleEdit = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        company: user.company || "",
        position: user.position || "",
        bio: user.bio || "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateProfile.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (userLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size={32} />
              <ThemeToggle />
              <h1 className="text-2xl font-bold">Perfil do Usuário</h1>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/history">
                <Button variant="ghost">Histórico</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <Breadcrumbs
          items={[
            { label: "Início", href: "/" },
            { label: "Dashboard", href: "/dashboard" },
            { label: "Perfil" },
          ]}
        />

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Coluna Esquerda - Dados Pessoais */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Informações Pessoais</CardTitle>
                    <CardDescription>Gerencie seus dados de perfil</CardDescription>
                  </div>
                  {!isEditing && (
                    <Button onClick={handleEdit}>Editar</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Cargo</Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Biografia</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={updateProfile.isPending}>
                        {updateProfile.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        Cancelar
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <User className="h-5 w-5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{user?.name || "Não informado"}</p>
                        <p className="text-xs">Nome</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="h-5 w-5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{user?.email || "Não informado"}</p>
                        <p className="text-xs">E-mail</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Phone className="h-5 w-5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{user?.phone || "Não informado"}</p>
                        <p className="text-xs">Telefone</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Building className="h-5 w-5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{user?.company || "Não informado"}</p>
                        <p className="text-xs">Empresa</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Briefcase className="h-5 w-5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{user?.position || "Não informado"}</p>
                        <p className="text-xs">Cargo</p>
                      </div>
                    </div>
                    {user?.bio && (
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium mb-1">Biografia</p>
                        <p className="text-sm text-muted-foreground">{user.bio}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Histórico de Predições */}
            <Card>
              <CardHeader>
                <CardTitle>Minhas Predições Recentes</CardTitle>
                <CardDescription>Últimas análises de crédito realizadas</CardDescription>
              </CardHeader>
              <CardContent>
                {predictionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : myPredictions && myPredictions.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo de Crédito</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myPredictions.items.slice(0, 5).map((prediction) => (
                          <TableRow key={prediction.id}>
                            <TableCell>
                              {new Date(prediction.createdAt).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell>{prediction.creditType}</TableCell>
                            <TableCell>
                              <RiskScoreWithTooltip score={prediction.riskClass} />
                            </TableCell>
                            <TableCell>
                              <Link href={`/predictions/${prediction.id}`}>
                                <Button variant="ghost" size="sm">Ver Detalhes</Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-4 text-center">
                      <Link href="/history">
                        <Button variant="outline">Ver Todas as Predições</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma predição realizada ainda</p>
                    <Link href="/predictions">
                      <Button className="mt-4">Fazer Primeira Predição</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Estatísticas */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
                <CardDescription>Resumo da sua atividade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalPredictions || 0}</p>
                    <p className="text-sm text-muted-foreground">Total de Predições</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.avgScore.toFixed(1) || "0.0"}</p>
                    <p className="text-sm text-muted-foreground">Score Médio</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {stats?.lastPredictionDate 
                        ? new Date(stats.lastPredictionDate).toLocaleDateString("pt-BR")
                        : "Nunca"}
                    </p>
                    <p className="text-sm text-muted-foreground">Última Predição</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo de Conta:</span>
                  <span className="font-medium capitalize">{user?.role || "user"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membro desde:</span>
                  <span className="font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR") : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Último acesso:</span>
                  <span className="font-medium">
                    {user?.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString("pt-BR") : "-"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

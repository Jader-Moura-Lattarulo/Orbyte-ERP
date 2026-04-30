import React, { useState } from 'react';
import { Shield, Plus, Mail, Key, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

// Mock data temporário (até a integração com Edge Functions / public.profiles)
const MOCK_USERS = [
  { id: '1', email: 'admin@orbyte.com', name: 'Administrador', role: 'admin', created_at: new Date().toISOString() }
];

export default function UsersManagement() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gerenciar Usuários" 
        subtitle="Administre o acesso e as permissões do sistema ERP."
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              <DialogDescription>
                Por motivos de segurança (limitações do Supabase no Frontend), a criação de senhas reais será tratada via Backend/Edge Functions posteriormente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input placeholder="Ex: João Silva" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" placeholder="email@orbyte.com" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Senha Temporária</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" placeholder="••••••••" className="pl-10" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => setIsDialogOpen(false)}>Salvar Usuário</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex items-center gap-2 p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary-foreground/80 text-sm mb-6">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-primary" />
        <span className="text-slate-800 dark:text-slate-200">
          <strong>Aviso de Infraestrutura:</strong> Esta é a interface visual de gestão. A sincronização de senhas e a criação de fato no banco de dados (`auth.users`) demandará uma Supabase Edge Function com a Service Role Key.
        </span>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Equipe Orbyte
          </CardTitle>
          <CardDescription>Lista de funcionários com acesso permitido ao ERP.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? 'bg-primary/20 text-primary hover:bg-primary/30 border-none' : ''}>
                        {user.role === 'admin' ? 'Administrador' : 'Usuário Padrão'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" disabled={user.role === 'admin'}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

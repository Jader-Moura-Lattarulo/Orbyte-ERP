import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Plus, Search, Filter, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import FinancialFormDialog from '@/components/financial/FinancialFormDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign } from 'lucide-react';

export default function Financial() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['financials'],
    queryFn: () => api.entities.FinancialEntry.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.FinancialEntry.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['financials'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.FinancialEntry.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['financials'] }); setShowForm(false); setEditingEntry(null); },
  });

  const totalIncome = entries.filter(e => e.type === 'income' && e.status === 'paid').reduce((s, e) => s + (e.amount || 0), 0);
  const totalExpense = entries.filter(e => e.type === 'expense' && e.status === 'paid').reduce((s, e) => s + (e.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const filtered = entries.filter(e => {
    const matchSearch = e.description?.toLowerCase().includes(search.toLowerCase()) || e.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || e.type === typeFilter;
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const handleSave = (data) => {
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" subtitle="Contas a pagar e receber">
        <Button onClick={() => { setEditingEntry(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Lançamento
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Receitas" value={`R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingUp} />
        <StatCard title="Despesas" value={`R$ ${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingDown} />
        <StatCard title="Saldo" value={`R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="overdue">Vencido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState icon={DollarSign} title="Nenhum lançamento" description="Registre receitas e despesas." className="py-12" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(entry => (
                    <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/30" onClick={() => { setEditingEntry(entry); setShowForm(true); }}>
                      <TableCell><StatusBadge status={entry.type} /></TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{entry.description}</p>
                        {entry.client_name && <p className="text-xs text-muted-foreground">{entry.client_name}</p>}
                      </TableCell>
                      <TableCell className={`font-semibold ${entry.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {entry.type === 'expense' ? '-' : ''}R$ {(entry.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-sm">{entry.due_date ? format(new Date(entry.due_date), 'dd/MM/yyyy') : '-'}</TableCell>
                      <TableCell className="text-sm">{entry.payment_method?.replace(/_/g, ' ') || '-'}</TableCell>
                      <TableCell><StatusBadge status={entry.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <FinancialFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        entry={editingEntry}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
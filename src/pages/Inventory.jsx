import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Plus, Search, AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import InventoryFormDialog from '@/components/inventory/InventoryFormDialog';

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.entities.InventoryItem.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.InventoryItem.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.InventoryItem.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); setShowForm(false); setEditingItem(null); },
  });

  const filtered = items.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.sku?.toLowerCase().includes(search.toLowerCase()) ||
    i.category?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = items.filter(i => i.min_quantity && i.quantity <= i.min_quantity);

  const handleSave = (data) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Estoque" subtitle={`${items.length} itens cadastrados`}>
        <Button onClick={() => { setEditingItem(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Item
        </Button>
      </PageHeader>

      {lowStock.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{lowStock.length}</strong> {lowStock.length === 1 ? 'item abaixo' : 'itens abaixo'} do estoque mínimo</span>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar peça..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState icon={Package} title="Estoque vazio" description="Cadastre peças e materiais." className="py-12" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nome</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Mín</TableHead>
                    <TableHead className="text-right">Preço Unit.</TableHead>
                    <TableHead>Fornecedor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(item => {
                    const isLow = item.min_quantity && item.quantity <= item.min_quantity;
                    return (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-muted/30" onClick={() => { setEditingItem(item); setShowForm(true); }}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{item.sku || '-'}</TableCell>
                        <TableCell>{item.category || '-'}</TableCell>
                        <TableCell className="text-right">
                          <span className={isLow ? 'text-red-600 font-semibold' : ''}>{item.quantity}</span>
                          {isLow && <AlertTriangle className="w-3 h-3 text-red-500 inline ml-1" />}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{item.min_quantity || '-'}</TableCell>
                        <TableCell className="text-right">
                          {item.unit_price ? `R$ ${item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.supplier || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <InventoryFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        item={editingItem}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
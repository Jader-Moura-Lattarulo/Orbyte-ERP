import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function InventoryFormDialog({ open, onOpenChange, item, onSave, isLoading }) {
  const [form, setForm] = useState({
    name: '', sku: '', category: '', quantity: '', min_quantity: '', unit_price: '', supplier: '', location: ''
  });

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '', sku: item.sku || '', category: item.category || '',
        quantity: item.quantity ?? '', min_quantity: item.min_quantity ?? '',
        unit_price: item.unit_price ?? '', supplier: item.supplier || '', location: item.location || ''
      });
    } else {
      setForm({ name: '', sku: '', category: '', quantity: '', min_quantity: '', unit_price: '', supplier: '', location: '' });
    }
  }, [item, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      quantity: parseFloat(form.quantity) || 0,
      min_quantity: parseFloat(form.min_quantity) || 0,
      unit_price: parseFloat(form.unit_price) || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar Item' : 'Novo Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <Label>SKU</Label>
              <Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
            </div>
            <div>
              <Label>Quantidade *</Label>
              <Input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
            </div>
            <div>
              <Label>Qtd Mínima</Label>
              <Input type="number" value={form.min_quantity} onChange={e => setForm({...form, min_quantity: e.target.value})} />
            </div>
            <div>
              <Label>Preço Unitário (R$)</Label>
              <Input type="number" step="0.01" value={form.unit_price} onChange={e => setForm({...form, unit_price: e.target.value})} />
            </div>
            <div>
              <Label>Fornecedor</Label>
              <Input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} />
            </div>
            <div className="col-span-2">
              <Label>Localização</Label>
              <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Ex: Prateleira A3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
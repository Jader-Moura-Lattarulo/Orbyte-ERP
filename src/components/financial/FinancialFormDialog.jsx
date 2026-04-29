import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FinancialFormDialog({ open, onOpenChange, entry, onSave, isLoading }) {
  const [form, setForm] = useState({
    type: 'income', description: '', amount: '', category: '', due_date: '', paid_date: '',
    status: 'pending', payment_method: '', client_name: ''
  });

  useEffect(() => {
    if (entry) {
      setForm({
        type: entry.type || 'income', description: entry.description || '', amount: entry.amount || '',
        category: entry.category || '', due_date: entry.due_date || '', paid_date: entry.paid_date || '',
        status: entry.status || 'pending', payment_method: entry.payment_method || '', client_name: entry.client_name || ''
      });
    } else {
      setForm({ type: 'income', description: '', amount: '', category: '', due_date: '', paid_date: '', status: 'pending', payment_method: '', client_name: '' });
    }
  }, [entry, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, amount: parseFloat(form.amount) || 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{entry ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
            </div>
            <div className="col-span-2">
              <Label>Descrição *</Label>
              <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
            </div>
            <div>
              <Label>Categoria</Label>
              <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Ex: Material, Serviço" />
            </div>
            <div>
              <Label>Cliente</Label>
              <Input value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} />
            </div>
            <div>
              <Label>Vencimento</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
            </div>
            <div>
              <Label>Data Pagamento</Label>
              <Input type="date" value={form.paid_date} onChange={e => setForm({...form, paid_date: e.target.value})} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={form.payment_method} onValueChange={v => setForm({...form, payment_method: v})}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão Débito</SelectItem>
                  <SelectItem value="bank_transfer">Transferência</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
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
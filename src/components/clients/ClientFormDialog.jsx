import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ClientFormDialog({ open, onOpenChange, client, onSave, isLoading }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', document: '', address: '', city: '', state: '', notes: '', status: 'active'
  });

  useEffect(() => {
    if (client) {
      setForm({ name: client.name || '', email: client.email || '', phone: client.phone || '', document: client.document || '', address: client.address || '', city: client.city || '', state: client.state || '', notes: client.notes || '', status: client.status || 'active' });
    } else {
      setForm({ name: '', email: '', phone: '', document: '', address: '', city: '', state: '', notes: '', status: 'active' });
    }
  }, [client, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <Label>Telefone *</Label>
              <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div>
              <Label>CPF/CNPJ</Label>
              <Input value={form.document} onChange={e => setForm({...form, document: e.target.value})} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Endereço</Label>
              <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
            </div>
            <div>
              <Label>Estado</Label>
              <Input value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
            </div>
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} />
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
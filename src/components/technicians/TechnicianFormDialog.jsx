import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TechnicianFormDialog({ open, onOpenChange, technician, onSave, isLoading }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', specialty: '', status: 'active', hourly_rate: ''
  });

  useEffect(() => {
    if (technician) {
      setForm({
        name: technician.name || '', phone: technician.phone || '', email: technician.email || '',
        specialty: technician.specialty || '', status: technician.status || 'active',
        hourly_rate: technician.hourly_rate ?? ''
      });
    } else {
      setForm({ name: '', phone: '', email: '', specialty: '', status: 'active', hourly_rate: '' });
    }
  }, [technician, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, hourly_rate: parseFloat(form.hourly_rate) || 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{technician ? 'Editar Técnico' : 'Novo Técnico'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div>
              <Label>Especialidade</Label>
              <Input value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})} placeholder="Ex: Ar-condicionado" />
            </div>
            <div>
              <Label>Valor/Hora (R$)</Label>
              <Input type="number" step="0.01" value={form.hourly_rate} onChange={e => setForm({...form, hourly_rate: e.target.value})} />
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
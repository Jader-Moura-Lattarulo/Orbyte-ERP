import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';

export default function AppointmentFormDialog({ open, onOpenChange, appointment, defaultSlot, clients, technicians, existingAppointments, onSave, isLoading }) {
  const [form, setForm] = useState({
    title: '', client_id: '', client_name: '', technician_id: '', technician_name: '',
    date: '', start_time: '', end_time: '', status: 'scheduled', notes: ''
  });
  const [conflict, setConflict] = useState(null);

  useEffect(() => {
    if (appointment) {
      setForm({
        title: appointment.title || '', client_id: appointment.client_id || '', client_name: appointment.client_name || '',
        technician_id: appointment.technician_id || '', technician_name: appointment.technician_name || '',
        date: appointment.date || '', start_time: appointment.start_time || '', end_time: appointment.end_time || '',
        status: appointment.status || 'scheduled', notes: appointment.notes || ''
      });
    } else if (defaultSlot) {
      setForm(prev => ({ ...prev, title: '', client_id: '', client_name: '', technician_id: '', technician_name: '',
        date: defaultSlot.date, start_time: defaultSlot.start_time, end_time: defaultSlot.end_time,
        status: 'scheduled', notes: '' }));
    } else {
      setForm({ title: '', client_id: '', client_name: '', technician_id: '', technician_name: '',
        date: '', start_time: '', end_time: '', status: 'scheduled', notes: '' });
    }
    setConflict(null);
  }, [appointment, defaultSlot, open]);

  const checkConflict = (techId, date, startTime, endTime) => {
    if (!techId || !date || !startTime || !endTime) return null;
    const conflicting = existingAppointments.find(a =>
      a.technician_id === techId && a.date === date &&
      a.id !== appointment?.id && a.status !== 'cancelled' &&
      a.start_time < endTime && a.end_time > startTime
    );
    return conflicting;
  };

  const handleFieldChange = (field, value) => {
    const newForm = { ...form, [field]: value };
    if (field === 'client_id') {
      const c = clients.find(cl => cl.id === value);
      newForm.client_name = c?.name || '';
    }
    if (field === 'technician_id') {
      const t = technicians.find(te => te.id === value);
      newForm.technician_name = t?.name || '';
    }
    setForm(newForm);
    const c = checkConflict(
      field === 'technician_id' ? value : newForm.technician_id,
      field === 'date' ? value : newForm.date,
      field === 'start_time' ? value : newForm.start_time,
      field === 'end_time' ? value : newForm.end_time
    );
    setConflict(c);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{appointment ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {conflict && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Conflito: {conflict.technician_name} já tem "{conflict.title}" das {conflict.start_time} às {conflict.end_time}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => handleFieldChange('title', e.target.value)} required />
            </div>
            <div>
              <Label>Cliente</Label>
              <Select value={form.client_id} onValueChange={v => handleFieldChange('client_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Técnico</Label>
              <Select value={form.technician_id} onValueChange={v => handleFieldChange('technician_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data *</Label>
              <Input type="date" value={form.date} onChange={e => handleFieldChange('date', e.target.value)} required />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => handleFieldChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Início *</Label>
              <Input type="time" value={form.start_time} onChange={e => handleFieldChange('start_time', e.target.value)} required />
            </div>
            <div>
              <Label>Fim *</Label>
              <Input type="time" value={form.end_time} onChange={e => handleFieldChange('end_time', e.target.value)} required />
            </div>
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => handleFieldChange('notes', e.target.value)} rows={2} />
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
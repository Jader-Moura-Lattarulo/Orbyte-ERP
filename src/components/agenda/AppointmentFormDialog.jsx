import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Clock, User, HardHat, Calendar, Edit2, X } from 'lucide-react';
import { api } from '@/api/apiClient';
import ClientFormDialog from '@/components/clients/ClientFormDialog';
import TechnicianFormDialog from '@/components/technicians/TechnicianFormDialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, parseISO, isValid, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
    <Icon className="w-4 h-4 text-primary" />
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-muted-foreground uppercase">{label}</p>
      <p className="text-sm font-semibold truncate">{value || 'Não informado'}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    scheduled: { label: 'Agendado', class: 'bg-blue-100 text-blue-700' },
    confirmed: { label: 'Confirmado', class: 'bg-green-100 text-green-700' },
    in_progress: { label: 'Em Andamento', class: 'bg-amber-100 text-amber-700' },
    completed: { label: 'Concluído', class: 'bg-gray-100 text-gray-700' },
    cancelled: { label: 'Cancelado', class: 'bg-red-100 text-red-700' }
  };
  const s = map[status] || map.scheduled;
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase", s.class)}>
      {s.label}
    </span>
  );
};

export default function AppointmentFormDialog({ open, onOpenChange, appointment, defaultSlot, clients = [], technicians = [], existingAppointments = [], existingOrders = [], onSave, isLoading }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: '', client_id: '', client_name: '', technician_id: '', technician_name: '',
    date: '', start_time: '', end_time: '', status: 'scheduled', notes: ''
  });
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isNewTechOpen, setIsNewTechOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      if (appointment) {
        setForm({
          title: appointment.title || '',
          client_id: appointment.client_id ? String(appointment.client_id) : '',
          client_name: appointment.client_name || '',
          technician_id: appointment.technician_id ? String(appointment.technician_id) : '',
          technician_name: appointment.technician_name || '',
          date: appointment.date ? String(appointment.date).split('T')[0] : '',
          start_time: appointment.start_time || '09:00',
          end_time: appointment.end_time || '10:00',
          status: appointment.status || 'scheduled',
          notes: appointment.notes || ''
        });
        setIsEditing(false);
      } else {
        setForm({
          title: '', client_id: '', client_name: '', technician_id: '', technician_name: '',
          date: defaultSlot?.date || '',
          start_time: defaultSlot?.start_time || '09:00',
          end_time: defaultSlot?.end_time || '10:00',
          status: 'scheduled', notes: ''
        });
        setIsEditing(true);
      }
    }
  }, [open, appointment?.id, defaultSlot?.date]);

  const createClientMutation = useMutation({
    mutationFn: (data) => api.entities.Client.create(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setForm(prev => ({ ...prev, client_id: String(response.id), client_name: variables.name }));
      setIsNewClientOpen(false);
    }
  });

  const createTechMutation = useMutation({
    mutationFn: (data) => api.entities.Technician.create(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setForm(prev => ({ ...prev, technician_id: String(response.id), technician_name: variables.name }));
      setIsNewTechOpen(false);
    }
  });

  const handleFieldChange = (field, value) => {
    if (field === 'client_id' && value === 'new_client') { setIsNewClientOpen(true); return; }
    if (field === 'technician_id' && value === 'new_tech') { setIsNewTechOpen(true); return; }

    const newForm = { ...form, [field]: value };
    if (field === 'client_id') {
      const c = clients.find(cl => String(cl.id) === String(value));
      newForm.client_name = c?.name || '';
    }
    if (field === 'technician_id') {
      const t = technicians.find(te => String(te.id) === String(value));
      newForm.technician_name = t?.name || '';
    }
    setForm(newForm);
  };

  const updateTimeField = (type, part, val) => {
    const current = form[type] || (type === 'start_time' ? "09:00" : "10:00");
    const [h, m] = current.split(':');
    handleFieldChange(type, part === 'h' ? `${val}:${m || '00'}` : `${h || '09'}:${val}`);
  };

  const getMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':');
    return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
  };

  const validation = useMemo(() => {
    if (!open) return { error: null, conflict: null };

    const getMinutes = (t) => {
      if (!t) return 0;
      const parts = String(t).split(':');
      return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    };

    const cleanDate = (d) => String(d || '').split('T')[0].split(' ')[0].trim();
    const normalizeStr = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

    const startMin = getMinutes(form.start_time);
    const endMin = getMinutes(form.end_time);
    const fDate = cleanDate(form.date);

    // 1. Validação Básica de Tempo
    if (isEditing && form.start_time && form.end_time && startMin >= endMin) {
      return { error: "O horário de término deve ser posterior ao horário de início.", conflict: null };
    }

    // 2. Validação de Data Retroativa
    if (fDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(fDate + 'T12:00:00'); // T12 ignora timezone
      if (!isNaN(selectedDate.getTime()) && selectedDate < today) {
        return { error: "Não é permitido agendamentos em datas retroativas.", conflict: null };
      }
    }

    // 3. Validação de Conflitos em Tempo Real
    if (fDate && form.start_time && form.end_time) {
      const fTechId = String(form.technician_id || '').trim();
      const fTechName = normalizeStr(form.technician_name);
      const fClientId = String(form.client_id || '').trim();
      const fClientName = normalizeStr(form.client_name);
      const fTitle = normalizeStr(form.title);

      const allEvents = Array.isArray(existingAppointments) ? existingAppointments : [];

      for (let a of allEvents) {
        if (a.id === appointment?.id || a.status === 'cancelled' || a.status === 'completed') continue;
        if (cleanDate(a.date) !== fDate) continue;

        const aStart = getMinutes(a.start_time || '09:00');
        const aEnd = getMinutes(a.end_time || '10:00');

        const aTechId = String(a.technician_id || a.technician?.id || '').trim();
        const aTechName = normalizeStr(a.technician_name || a.technician?.name);
        const aClientId = String(a.client_id || a.client?.id || '').trim();
        const aClientName = normalizeStr(a.client_name || a.client?.name);
        const aTitle = normalizeStr(a.title);

        // Regra do Técnico
        const isSameTech = (fTechId !== '' && aTechId === fTechId) || (fTechName !== '' && aTechName === fTechName);
        if (isSameTech) {
          const bufferStart = aStart - 30;
          const bufferEnd = aEnd + 30;
          if (startMin < bufferEnd && endMin > bufferStart) {
            return { error: `Técnico precisa de 30 min de intervalo. Existe visita às ${a.start_time || '09:00'}.`, conflict: true };
          }
        }

        // Regra do Cliente
        const isSameClient = (fClientId !== '' && aClientId === fClientId) || (fClientName !== '' && aClientName === fClientName);
        if (isSameClient && aTitle === fTitle) {
          if (startMin < aEnd && endMin > aStart) {
            return { error: `Cliente já possui a visita "${a.title || form.title}" neste horário.`, conflict: true };
          }
        }
      }
    }

    return { error: null, conflict: null };
  }, [form.date, form.start_time, form.end_time, form.technician_id, form.client_id, form.title, form.technician_name, form.client_name, open, isEditing, existingAppointments, appointment?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    // 1. TRAVA FÍSICA NO DOM (Ignora atrasos do React e tranca o botão no clique)
    const submitBtn = document.getElementById('btn-salvar-agendamento');
    if (submitBtn) submitBtn.disabled = true;

    // 2. Conversores Blindados
    const getMinutes = (t) => {
      if (!t) return 0;
      const parts = String(t).split(':');
      return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    };

    const cleanDate = (d) => String(d || '').split('T')[0].split(' ')[0].trim();
    const normalizeStr = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

    // 3. Preparando dados do formulário
    const startMin = getMinutes(form.start_time);
    const endMin = getMinutes(form.end_time);
    const fDate = cleanDate(form.date);

    // Extrai IDs e Nomes (Garantia dupla)
    const fTechId = String(form.technician_id || '').trim();
    const fTechName = normalizeStr(form.technician_name);
    const fClientId = String(form.client_id || '').trim();
    const fClientName = normalizeStr(form.client_name);
    const fTitle = normalizeStr(form.title);

    const appointmentsList = Array.isArray(existingAppointments) ? existingAppointments : [];
    let conflictMsg = null;

    // 4. Varredura Absoluta
    for (let i = 0; i < appointmentsList.length; i++) {
      const a = appointmentsList[i];

      // Ignora o atual e os inativos
      if (a.id === appointment?.id || a.status === 'cancelled' || a.status === 'completed') continue;

      // Se for outro dia, pula
      if (cleanDate(a.date) !== fDate) continue;

      const aStart = getMinutes(a.start_time || '09:00');
      const aEnd = getMinutes(a.end_time || '10:00');

      const aTechId = String(a.technician_id || a.technician?.id || '').trim();
      const aTechName = normalizeStr(a.technician_name || a.technician?.name);
      const aClientId = String(a.client_id || a.client?.id || '').trim();
      const aClientName = normalizeStr(a.client_name || a.client?.name);
      const aTitle = normalizeStr(a.title);

      // REGRA 1: Conflito de Técnico (Checa ID. Se falhar, checa o Nome)
      const isSameTech = (fTechId !== '' && aTechId === fTechId) || (fTechName !== '' && aTechName === fTechName);
      if (isSameTech) {
        const bufferStart = aStart - 30;
        const bufferEnd = aEnd + 30;
        if (startMin < bufferEnd && endMin > bufferStart) {
          conflictMsg = `Técnico ocupado. Visita existente às ${a.start_time || '09:00'}.`;
          break;
        }
      }

      // REGRA 2: Conflito de Cliente (Checa ID ou Nome)
      const isSameClient = (fClientId !== '' && aClientId === fClientId) || (fClientName !== '' && aClientName === fClientName);
      if (isSameClient && aTitle === fTitle) {
        if (startMin < aEnd && endMin > aStart) {
          conflictMsg = `Cliente já possui a visita "${a.title || form.title}" neste horário.`;
          break;
        }
      }
    }

    // 5. Bloqueio e Retorno Imediato
    if (conflictMsg) {
      toast.error(conflictMsg); // Removi a palavra "Bloqueado:" para ficar idêntico ao original
      if (submitBtn) submitBtn.disabled = false; // Destranca o botão para o usuário poder corrigir
      return;
    }

    if (validation.error) {
      toast.error(validation.error);
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    // 6. Salvamento Seguro
    onSave({
      ...form,
      client_id: form.client_id ? parseInt(form.client_id, 10) : null,
      technician_id: form.technician_id ? parseInt(form.technician_id, 10) : null
    });

    // Libera o botão após 2 segundos caso a rede esteja lenta
    setTimeout(() => { if (submitBtn) submitBtn.disabled = false; }, 2000);
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = parseISO(dateStr);
      if (isValid(d)) return format(d, "dd 'de' MMMM", { locale: ptBR });
      return dateStr;
    } catch (e) { return dateStr; }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader className="p-6 border-b bg-muted/5">
          <DialogTitle className="text-xl font-black">
            {isEditing ? (appointment ? 'Editar Agendamento' : 'Novo Agendamento') : 'Detalhes do Agendamento'}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isEditing ? (
            <form id="appointment-form" onSubmit={handleSubmit} className="space-y-4">
              {(validation.error || validation.conflict) && (
                <div className={cn("flex items-center gap-2 p-3 rounded-lg text-sm border", validation.error?.includes("Técnico") ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800')}>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{validation.error}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="font-bold">Título *</Label>
                  <Input value={form.title} onChange={e => handleFieldChange('title', e.target.value)} required />
                </div>
                <div>
                  <Label className="font-bold">Cliente</Label>
                  <Select key={`client-${form.client_id}-${clients.length}`} value={form.client_id} onValueChange={v => handleFieldChange('client_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar">
                        {clients.find(c => String(c.id) === String(form.client_id))?.name || form.client_name || "Selecionar"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      <SelectItem value="new_client" className="font-bold text-primary">+ Novo Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bold">Técnico</Label>
                  <Select key={`tech-${form.technician_id}-${technicians.length}`} value={form.technician_id} onValueChange={v => handleFieldChange('technician_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar">
                        {technicians.find(t => String(t.id) === String(form.technician_id))?.name || form.technician_name || "Selecionar"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                      <SelectItem value="new_tech" className="font-bold text-primary">+ Novo Técnico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bold">Data *</Label>
                  <Input type="date" value={form.date} onChange={e => handleFieldChange('date', e.target.value)} required />
                </div>
                <div>
                  <Label className="font-bold">Status</Label>
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

                <div className="space-y-2">
                  <Label className="font-bold">Início *</Label>
                  <div className="flex gap-2">
                    <Select value={(form.start_time || '09:00').split(':')[0]} onValueChange={v => updateTimeField('start_time', 'h', v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{Array.from({ length: 24 }).map((_, i) => (<SelectItem key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}h</SelectItem>))}</SelectContent>
                    </Select>
                    <Select value={(form.start_time || '09:00').split(':')[1]} onValueChange={v => updateTimeField('start_time', 'm', v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="00">00</SelectItem><SelectItem value="15">15</SelectItem><SelectItem value="30">30</SelectItem><SelectItem value="45">45</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Fim *</Label>
                  <div className="flex gap-2">
                    <Select value={(form.end_time || '10:00').split(':')[0]} onValueChange={v => updateTimeField('end_time', 'h', v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{Array.from({ length: 24 }).map((_, i) => (<SelectItem key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}h</SelectItem>))}</SelectContent>
                    </Select>
                    <Select value={(form.end_time || '10:00').split(':')[1]} onValueChange={v => updateTimeField('end_time', 'm', v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="00">00</SelectItem><SelectItem value="15">15</SelectItem><SelectItem value="30">30</SelectItem><SelectItem value="45">45</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="col-span-2">
                  <Label className="font-bold">Observações</Label>
                  <Textarea value={form.notes} onChange={e => handleFieldChange('notes', e.target.value)} rows={2} />
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <h3 className="text-lg font-black text-primary">{form.title}</h3>
                <div className="mt-2">
                  <StatusBadge status={form.status} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow icon={User} label="Cliente" value={form.client_name} />
                <InfoRow icon={HardHat} label="Técnico" value={form.technician_name} />
                <InfoRow icon={Calendar} label="Data" value={formatDateLabel(form.date)} />
                <InfoRow icon={Clock} label="Horário" value={`${form.start_time} às ${form.end_time}`} />
              </div>
              {form.notes && (
                <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Observações</p>
                  <p className="text-sm">{form.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t bg-muted/5">
          <div className="flex gap-2 w-full justify-end">
            {isEditing ? (
              <>
                <Button type="button" variant="outline" onClick={() => appointment ? setIsEditing(false) : onOpenChange(false)} className="font-bold">
                  Cancelar
                </Button>
                <Button id="btn-salvar-agendamento" type="submit" form="appointment-form" disabled={isLoading || !!validation.error || !!validation.conflict} className="font-bold">
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)} className="font-bold gap-2">
                  <X className="w-4 h-4" /> Fechar
                </Button>
                <Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditing(true); }} className="font-bold gap-2">
                  <Edit2 className="w-4 h-4" /> Editar
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      <ClientFormDialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen} onSave={data => createClientMutation.mutate(data)} isLoading={createClientMutation.isPending} />
      <TechnicianFormDialog open={isNewTechOpen} onOpenChange={setIsNewTechOpen} onSave={data => createTechMutation.mutate(data)} isLoading={createTechMutation.isPending} />
    </Dialog>
  );
}
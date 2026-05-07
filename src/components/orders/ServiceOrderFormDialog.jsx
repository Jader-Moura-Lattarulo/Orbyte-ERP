import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Loader2, Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';
import { api } from '@/api/apiClient';
import ClientFormDialog from '@/components/clients/ClientFormDialog';
import TechnicianFormDialog from '@/components/technicians/TechnicianFormDialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, parseISO, setHours, setMinutes, addHours, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ServiceOrderFormDialog({ open, onOpenChange, order, clients, technicians, existingAppointments = [], existingOrders = [], onSave, isLoading, readOnly = false }) {
  const [form, setForm] = useState({
    title: '', description: '', client_id: '', client_name: '', technician_id: '', technician_name: '',
    status: 'open', priority: 'medium', scheduled_date: '', estimated_hours: '',
    service_value: '', parts_value: '', total_value: ''
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isNewTechOpen, setIsNewTechOpen] = useState(false);
  const queryClient = useQueryClient();

  const getMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':');
    return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
  };

  const validation = useMemo(() => {
    if (!open || !form.scheduled_date || !form.estimated_hours) return { error: null, conflict: null };

    const startDate = parseISO(form.scheduled_date);
    if (!isValid(startDate)) return { error: null, conflict: null };

    const hours = parseFloat(form.estimated_hours) || 0.5;
    const endDate = addHours(startDate, hours);
    
    const startMin = getMinutes(format(startDate, 'HH:mm'));
    const endMin = getMinutes(format(endDate, 'HH:mm'));
    const dateStr = format(startDate, 'yyyy-MM-dd');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      return { error: "Não é permitido agendamentos em datas retroativas.", conflict: null };
    }

    const allEvents = [
      ...(existingAppointments || []).map(a => {
        const end = a.end_time || '10:00';
        const start = a.start_time || (parseInt(end.split(':')[0]) - 1).toString().padStart(2, '0') + ':' + end.split(':')[1];
        let eDateStr = '';
        try {
          const dateObj = typeof a.date === 'string' ? new Date(a.date.split(' ')[0] + 'T12:00:00') : new Date(a.date);
          eDateStr = format(dateObj, 'yyyy-MM-dd');
        } catch (e) { 
          eDateStr = String(a.date || '').slice(0, 10); 
        }

        return { 
          ...a, 
          type: 'agendamento',
          start_time: start,
          end_time: end,
          date: eDateStr
        };
      }),
      ...(existingOrders || []).filter(o => o.scheduled_date).map(o => {
        let sd = null;
        try { sd = parseISO(o.scheduled_date); } catch(e) {}
        if (!sd || !isValid(sd)) return null;

        const start = format(sd, 'HH:mm');
        const end = format(addHours(sd, parseFloat(o.estimated_hours) || 1), 'HH:mm');
        return { 
          ...o, 
          type: 'OS', 
          date: format(sd, 'yyyy-MM-dd'),
          start_time: start,
          end_time: end
        };
      }).filter(Boolean)
    ].filter(e => e.id !== order?.id && e.status !== 'cancelled' && e.status !== 'completed');

    if (form.technician_id) {
      const techConflict = allEvents.find(e => {
        const eTechId = String(e.technician_id || '').trim().valueOf();
        const fTechId = String(form.technician_id || '').trim().valueOf();
        if (eTechId !== fTechId) return false;

        const eDate = String(e.date || '').split('T')[0];
        const fDate = dateStr.split('T')[0];
        
        const eStart = getMinutes(e.start_time || e.scheduled_date?.split('T')[1]?.slice(0,5));
        const eEnd = getMinutes(e.end_time || format(addHours(parseISO(e.scheduled_date), parseFloat(e.estimated_hours) || 1), 'HH:mm'));
        
        const bufferStart = eStart - 30;
        const bufferEnd = eEnd + 30;

        const hasConflict = startMin < bufferEnd && endMin > bufferStart;
        if (eDate === fDate) {
          console.log(`[OSTechCheck] Validando: [${e.title}] | Data E: ${eDate} vs Data F: ${fDate} | Conflito: ${hasConflict}`);
        }

        return eDate === fDate && hasConflict;
      });

      if (techConflict) {
        return { error: `Técnico precisa de 30 min de intervalo. Conflito com ${techConflict.type}: "${techConflict.title}"`, conflict: techConflict };
      }
    }

    if (form.client_id) {
      const normalizeText = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
      
      const clientConflict = allEvents.find(e => {
        const eClientId = String(e.client_id || '').trim().valueOf();
        const fClientId = String(form.client_id || '').trim().valueOf();
        if (eClientId !== fClientId) return false;

        const eDate = String(e.date || '').split('T')[0];
        const fDate = dateStr.split('T')[0];
        
        const sameTitle = normalizeText(e.title) === normalizeText(form.title);
        const eStart = getMinutes(e.start_time || e.scheduled_date?.split('T')[1]?.slice(0,5));
        const eEnd = getMinutes(e.end_time || format(addHours(parseISO(e.scheduled_date), parseFloat(e.estimated_hours) || 1), 'HH:mm'));
        const hasConflict = startMin < eEnd && endMin > eStart;

        if (eDate === fDate && sameTitle) {
          console.log(`[OSClientCheck] Validando: [${e.title}] | Data E: ${eDate} vs Data F: ${fDate} | Conflito: ${hasConflict}`);
        }

        return eDate === fDate && sameTitle && hasConflict;
      });

      if (clientConflict) {
        return { error: `Cliente já possui uma visita com este mesmo título neste horário.`, conflict: clientConflict };
      }
    }

    return { error: null, conflict: null };
  }, [form.scheduled_date, form.estimated_hours, form.technician_id, form.client_id, form.title, open, readOnly, existingAppointments, existingOrders, order?.id]);

  const createClientMutation = useMutation({
    mutationFn: (data) => api.entities.Client.create(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setForm(prev => ({ 
        ...prev, 
        client_id: String(response.id), 
        client_name: variables.name 
      }));
      setIsNewClientOpen(false);
    }
  });

  const createTechMutation = useMutation({
    mutationFn: (data) => api.entities.Technician.create(data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setForm(prev => ({ 
        ...prev, 
        technician_id: String(response.id), 
        technician_name: variables.name 
      }));
      setIsNewTechOpen(false);
    }
  });

  useEffect(() => {
    if (order) {
      setForm({
        title: order.title || '', description: order.description || '',
        client_id: order.client_id || '', client_name: order.client_name || '',
        technician_id: order.technician_id || '', technician_name: order.technician_name || '',
        status: order.status || 'open', priority: order.priority || 'medium',
        scheduled_date: order.scheduled_date ? order.scheduled_date.slice(0, 16) : '',
        estimated_hours: order.estimated_hours || '',
        service_value: order.service_value || '', parts_value: order.parts_value || '',
        total_value: order.total_value || ''
      });
    } else {
      setForm({
        title: '', description: '', client_id: '', client_name: '', technician_id: '', technician_name: '',
        status: 'open', priority: 'medium', scheduled_date: '', estimated_hours: '',
        service_value: '', parts_value: '', total_value: ''
      });
    }
  }, [order, open]);

  const handleClientChange = (clientId) => {
    if (clientId === 'new_client') {
      setIsNewClientOpen(true);
      return;
    }
    const client = clients.find(c => String(c.id) === clientId);
    setForm({ ...form, client_id: clientId, client_name: client?.name || '' });
  };

  const handleTechChange = (techId) => {
    if (techId === 'new_tech') {
      setIsNewTechOpen(true);
      return;
    }
    const tech = technicians.find(t => String(t.id) === techId);
    calculateValues({ technician_id: techId, technician_name: tech?.name || '' });
  };

  const calculateValues = (updates) => {
    const nextForm = { ...form, ...updates };
    if (nextForm.technician_id && nextForm.estimated_hours) {
      const hoursVal = Math.max(0.25, parseFloat(nextForm.estimated_hours) || 0);
      nextForm.estimated_hours = hoursVal;
      const tech = technicians.find(t => String(t.id) === nextForm.technician_id);
      if (tech && tech.hourly_rate) {
        nextForm.service_value = tech.hourly_rate * hoursVal;
      }
    }
    const service = Math.max(0, parseFloat(nextForm.service_value) || 0);
    const parts = Math.max(0, parseFloat(nextForm.parts_value) || 0);
    nextForm.total_value = (service + parts) * 1.30;
    setForm(nextForm);
  };

  const generateAIDescription = async () => {
    if (!form.title) return;
    setAiLoading(true);
    const result = await api.integrations.Core.InvokeLLM({
      prompt: `Gere uma descrição técnica profissional para uma ordem de serviço com o título: "${form.title}". 
      Cliente: ${form.client_name || 'não informado'}. 
      Escreva em português, de forma clara e objetiva, com no máximo 3 parágrafos. 
      Inclua possíveis etapas do serviço e recomendações.`,
    });
    setForm(prev => ({ ...prev, description: result }));
    setAiLoading(false);
  };

  const updateTotal = (field, value) => {
    calculateValues({ [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    // 1. Trava Física Imediata
    const submitBtn = document.getElementById('btn-salvar-os');
    if (submitBtn) submitBtn.disabled = true;

    // 2. Funções de Limpeza
    const getMinutesLocal = (t) => {
      if (!t) return 0;
      const parts = String(t).split(':');
      return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    };

    const cleanDate = (d) => {
      if (!d) return '';
      if (typeof d === 'object') {
        const temp = new Date(d.getTime());
        temp.setHours(12, 0, 0, 0);
        return temp.toISOString().split('T')[0];
      }
      return String(d).split('T')[0].split(' ')[0].trim();
    };

    const cleanStr = (s) => String(s || '').trim();

    // 3. Preparação
    const startDate = parseISO(form.scheduled_date);
    if (!isValid(startDate)) {
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    const startMin = getMinutesLocal(format(startDate, 'HH:mm'));
    const hours = parseFloat(form.estimated_hours) || 1;
    const endMin = getMinutesLocal(format(addHours(startDate, hours), 'HH:mm'));
    const fDate = cleanDate(startDate);
    
    const fTechId = cleanStr(form.technician_id);
    const fClientId = cleanStr(form.client_id);
    const fTitle = cleanStr(form.title).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    let conflictMsg = null;

    // 4. Varredura Agendamentos
    const appList = existingAppointments || [];
    for (let i = 0; i < appList.length; i++) {
      const a = appList[i];
      if (a.status === 'cancelled' || a.status === 'completed') continue;

      const aDate = cleanDate(a.date);
      if (aDate !== fDate) continue;

      const aTechId = cleanStr(a.technician_id || a.technician?.id);
      const aClientId = cleanStr(a.client_id || a.client?.id);
      const aTitle = cleanStr(a.title).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      
      const aStart = getMinutesLocal(a.start_time || '09:00');
      const aEnd = getMinutesLocal(a.end_time || '10:00');

      if (fTechId !== '' && aTechId === fTechId) {
        if (startMin < (aEnd + 30) && endMin > (aStart - 30)) {
          conflictMsg = `Técnico possui Agendamento às ${a.start_time}.`;
          break;
        }
      }

      if (fClientId !== '' && aClientId === fClientId && aTitle === fTitle) {
        if (startMin < aEnd && endMin > aStart) {
          conflictMsg = `Cliente possui Agendamento "${a.title}" neste horário.`;
          break;
        }
      }
    }

    // 5. Varredura outras OSs
    if (!conflictMsg) {
      const osList = existingOrders || [];
      for (let i = 0; i < osList.length; i++) {
        const o = osList[i];
        if (o.id === order?.id || o.status === 'cancelled' || o.status === 'completed' || !o.scheduled_date) continue;

        const oDate = cleanDate(parseISO(o.scheduled_date));
        if (oDate !== fDate) continue;

        const oSD = parseISO(o.scheduled_date);
        const oStart = getMinutesLocal(format(oSD, 'HH:mm'));
        const oEnd = getMinutesLocal(format(addHours(oSD, parseFloat(o.estimated_hours) || 1), 'HH:mm'));

        const oTechId = cleanStr(o.technician_id || o.technician?.id);
        const oClientId = cleanStr(o.client_id || o.client?.id);
        const oTitle = cleanStr(o.title).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

        if (fTechId !== '' && oTechId === fTechId) {
          if (startMin < (oEnd + 30) && endMin > (oStart - 30)) {
            conflictMsg = `Técnico possui outra OS às ${format(oSD, 'HH:mm')}.`;
            break;
          }
        }

        if (fClientId !== '' && oClientId === fClientId && oTitle === fTitle) {
          if (startMin < oEnd && endMin > oStart) {
            conflictMsg = `Cliente possui OS "${o.title}" neste horário.`;
            break;
          }
        }
      }
    }

    if (conflictMsg) {
      toast.error("Bloqueado: " + conflictMsg);
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    if (validation.error) {
      toast.error(validation.error);
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    const data = {
      ...form,
      service_value: Math.max(0, parseFloat(form.service_value) || 0),
      parts_value: Math.max(0, parseFloat(form.parts_value) || 0),
      total_value: Math.max(0, parseFloat(form.total_value) || 0),
      estimated_hours: Math.max(0, parseFloat(form.estimated_hours) || 0),
      client_id: form.client_id ? parseInt(form.client_id, 10) : null,
      technician_id: form.technician_id ? parseInt(form.technician_id, 10) : null,
    };
    onSave(data);

    setTimeout(() => { if (submitBtn) submitBtn.disabled = false; }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? `Editar OS ${order.order_number || ''}` : 'Nova Ordem de Serviço'}</DialogTitle>
        </DialogHeader>
        
        {validation.error && (
          <div className={cn("flex items-center gap-2 p-3 mt-2 rounded-lg text-sm border", validation.error.includes("Técnico") ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800')}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{validation.error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="info" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="info" className="flex-1 font-bold">Informações</TabsTrigger>
              <TabsTrigger value="values" className="flex-1 font-bold">Valores</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div>
                <Label className="font-bold">Título *</Label>
                <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Ex: Manutenção preventiva ar-condicionado" disabled={readOnly} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-bold">Descrição</Label>
                  {!readOnly && (
                    <Button type="button" variant="ghost" size="sm" onClick={generateAIDescription} disabled={aiLoading || !form.title} className="text-primary gap-1 h-7">
                      {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Gerar com IA
                    </Button>
                  )}
                </div>
                <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4} placeholder="Descreva o serviço..." disabled={readOnly} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bold">Cliente</Label>
                  <Select value={form.client_id} onValueChange={handleClientChange} disabled={readOnly}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      {!readOnly && <SelectItem value="new_client" className="font-bold text-primary cursor-pointer">+ Novo Cliente</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bold">Técnico</Label>
                  <Select value={form.technician_id} onValueChange={handleTechChange} disabled={readOnly}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {technicians.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                      {!readOnly && <SelectItem value="new_tech" className="font-bold text-primary cursor-pointer">+ Novo Técnico</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bold">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v})} disabled={readOnly}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberta</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="waiting_parts">Aguard. Peças</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bold">Prioridade</Label>
                  <Select value={form.priority} onValueChange={v => setForm({...form, priority: v})} disabled={readOnly}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bold">Data Agendada</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        disabled={readOnly}
                        className={cn("w-full justify-start text-left font-normal h-10 px-3", !form.scheduled_date && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.scheduled_date ? format(parseISO(form.scheduled_date), "Pp", { locale: ptBR }) : <span>Selecionar data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 border-b flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-2">
                           <Clock className="w-4 h-4 text-muted-foreground" />
                           <Select value={form.scheduled_date ? format(parseISO(form.scheduled_date), "HH") : "09"} onValueChange={h => { const date = form.scheduled_date ? parseISO(form.scheduled_date) : new Date(); setForm({...form, scheduled_date: format(setHours(date, parseInt(h)), "yyyy-MM-dd'T'HH:mm")}); }}>
                             <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
                             <SelectContent>{Array.from({length: 24}).map((_, i) => (<SelectItem key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}h</SelectItem>))}</SelectContent>
                           </Select>
                           <span className="text-muted-foreground font-bold">:</span>
                           <Select value={form.scheduled_date ? format(parseISO(form.scheduled_date), "mm") : "00"} onValueChange={m => { const date = form.scheduled_date ? parseISO(form.scheduled_date) : new Date(); setForm({...form, scheduled_date: format(setMinutes(date, parseInt(m)), "yyyy-MM-dd'T'HH:mm")}); }}>
                             <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
                             <SelectContent><SelectItem value="00">00</SelectItem><SelectItem value="15">15</SelectItem><SelectItem value="30">30</SelectItem><SelectItem value="45">45</SelectItem></SelectContent>
                           </Select>
                        </div>
                      </div>
                      <Calendar mode="single" selected={form.scheduled_date ? parseISO(form.scheduled_date) : undefined} onSelect={date => { if (!date) return; const current = form.scheduled_date ? parseISO(form.scheduled_date) : new Date(); const final = setMinutes(setHours(date, current.getHours()), current.getMinutes()); setForm({...form, scheduled_date: format(final, "yyyy-MM-dd'T'HH:mm")}); }} locale={ptBR} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="font-bold">Tempo Estimado (HH:mm) *</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 flex items-center gap-1.5 px-3 h-10 rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <Input type="number" min="0" value={Math.floor(parseFloat(form.estimated_hours) || 0)} onChange={e => { const h = Math.max(0, parseInt(e.target.value) || 0); const m = Math.round(((parseFloat(form.estimated_hours) || 0) % 1) * 60); calculateValues({ estimated_hours: h + (m / 60) }); }} disabled={readOnly} className="border-0 p-0 h-auto focus-visible:ring-0 w-12 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="00" />
                      <span className="text-muted-foreground font-bold">:</span>
                      <Select value={String(Math.round(((parseFloat(form.estimated_hours) || 0) % 1) * 60)).padStart(2, '0')} onValueChange={m => { const h = Math.floor(parseFloat(form.estimated_hours) || 0); calculateValues({ estimated_hours: h + (parseInt(m) / 60) }); }} disabled={readOnly}>
                        <SelectTrigger className="border-0 p-0 h-auto focus:ring-0 focus:ring-offset-0 w-12 bg-transparent"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="00">00</SelectItem><SelectItem value="15">15</SelectItem><SelectItem value="30">30</SelectItem><SelectItem value="45">45</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="values" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bold">Mão de Obra (R$)</Label>
                  <Input type="number" step="0.01" min="0" value={form.service_value} onChange={e => updateTotal('service_value', e.target.value)} disabled={readOnly} />
                </div>
                <div>
                  <Label className="font-bold">Peças (R$)</Label>
                  <Input type="number" step="0.01" min="0" value={form.parts_value} onChange={e => updateTotal('parts_value', e.target.value)} disabled={readOnly} />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-800">Total</span>
                  <span className="text-xl font-bold text-emerald-700">R$ {(parseFloat(form.total_value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? 'Fechar' : 'Cancelar'}
            </Button>
            {!readOnly && (
              <Button type="submit" id="btn-salvar-os" disabled={isLoading || !!validation.error || !!validation.conflict}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
      <ClientFormDialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen} onSave={data => createClientMutation.mutate(data)} isLoading={createClientMutation.isPending} />
      <TechnicianFormDialog open={isNewTechOpen} onOpenChange={setIsNewTechOpen} onSave={data => createTechMutation.mutate(data)} isLoading={createTechMutation.isPending} />
    </Dialog>
  );
}
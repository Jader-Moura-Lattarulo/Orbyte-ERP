import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { api } from '@/api/apiClient';
import ClientFormDialog from '@/components/clients/ClientFormDialog';
import TechnicianFormDialog from '@/components/technicians/TechnicianFormDialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, parseISO, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ServiceOrderFormDialog({ open, onOpenChange, order, clients, technicians, onSave, isLoading, readOnly = false }) {
  const [form, setForm] = useState({
    title: '', description: '', client_id: '', client_name: '', technician_id: '', technician_name: '',
    status: 'open', priority: 'medium', scheduled_date: '', estimated_hours: '',
    service_value: '', parts_value: '', total_value: ''
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isNewTechOpen, setIsNewTechOpen] = useState(false);
  const queryClient = useQueryClient();

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
    
    // Automação da Mão de Obra baseada no técnico e horas
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
    
    // Fórmula do total com 30% de margem
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

  const suggestPrice = async () => {
    if (!form.title) return;
    setAiLoading(true);
    const result = await api.integrations.Core.InvokeLLM({
      prompt: `Sugira um preço justo em reais (BRL) para o seguinte serviço: "${form.title}". 
      ${form.description ? `Descrição: ${form.description}` : ''}
      Considere o mercado brasileiro. Retorne apenas o objeto JSON.`,
      response_json_schema: {
        type: "object",
        properties: {
          suggested_price: { type: "number" },
          reasoning: { type: "string" }
        }
      }
    });
    if (result.suggested_price) {
      setForm(prev => ({
        ...prev,
        service_value: result.suggested_price,
        total_value: result.suggested_price + (parseFloat(prev.parts_value) || 0)
      }));
    }
    setAiLoading(false);
  };

  const updateTotal = (field, value) => {
    calculateValues({ [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      service_value: Math.max(0, parseFloat(form.service_value) || 0),
      parts_value: Math.max(0, parseFloat(form.parts_value) || 0),
      total_value: Math.max(0, parseFloat(form.total_value) || 0),
      estimated_hours: Math.max(0, parseFloat(form.estimated_hours) || 0),
    };
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? `Editar OS ${order.order_number || ''}` : 'Nova Ordem de Serviço'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="info" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="info" className="flex-1">Informações</TabsTrigger>
              <TabsTrigger value="values" className="flex-1">Valores</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div>
                <Label>Título *</Label>
                <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Ex: Manutenção preventiva ar-condicionado" disabled={readOnly} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Descrição</Label>
                </div>
                <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4} placeholder="Descreva o serviço..." disabled={readOnly} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <Select value={form.client_id} onValueChange={handleClientChange} disabled={readOnly}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      {!readOnly && <SelectItem value="new_client" className="font-medium text-primary cursor-pointer">+ Novo Cliente</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Técnico</Label>
                  <Select value={form.technician_id} onValueChange={handleTechChange} disabled={readOnly}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {technicians.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                      {!readOnly && <SelectItem value="new_tech" className="font-medium text-primary cursor-pointer">+ Novo Técnico</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
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
                  <Label>Prioridade</Label>
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
                  <Label>Data Agendada</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        disabled={readOnly}
                        className={cn(
                          "w-full justify-start text-left font-normal h-10 px-3",
                          !form.scheduled_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.scheduled_date ? format(parseISO(form.scheduled_date), "Pp", { locale: ptBR }) : <span>Selecionar data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 border-b flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-2">
                           <Clock className="w-4 h-4 text-muted-foreground" />
                           <Select 
                             value={form.scheduled_date ? format(parseISO(form.scheduled_date), "HH") : "09"}
                             onValueChange={h => {
                               const date = form.scheduled_date ? parseISO(form.scheduled_date) : new Date();
                               setForm({...form, scheduled_date: format(setHours(date, parseInt(h)), "yyyy-MM-dd'T'HH:mm")});
                             }}
                           >
                             <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
                             <SelectContent>
                               {Array.from({length: 24}).map((_, i) => (
                                 <SelectItem key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}h</SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                           <span className="text-muted-foreground">:</span>
                           <Select 
                             value={form.scheduled_date ? format(parseISO(form.scheduled_date), "mm") : "00"}
                             onValueChange={m => {
                               const date = form.scheduled_date ? parseISO(form.scheduled_date) : new Date();
                               setForm({...form, scheduled_date: format(setMinutes(date, parseInt(m)), "yyyy-MM-dd'T'HH:mm")});
                             }}
                           >
                             <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
                             <SelectContent>
                               <SelectItem value="00">00</SelectItem>
                               <SelectItem value="15">15</SelectItem>
                               <SelectItem value="30">30</SelectItem>
                               <SelectItem value="45">45</SelectItem>
                             </SelectContent>
                           </Select>
                        </div>
                      </div>
                      <Calendar
                        mode="single"
                        selected={form.scheduled_date ? parseISO(form.scheduled_date) : undefined}
                        onSelect={date => {
                          if (!date) return;
                          const current = form.scheduled_date ? parseISO(form.scheduled_date) : new Date();
                          const final = setMinutes(setHours(date, current.getHours()), current.getMinutes());
                          setForm({...form, scheduled_date: format(final, "yyyy-MM-dd'T'HH:mm")});
                        }}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Tempo Estimado (HH:mm) *</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 flex items-center gap-1.5 px-3 h-10 rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <Input 
                        type="number" 
                        min="0"
                        value={Math.floor(parseFloat(form.estimated_hours) || 0)} 
                        onChange={e => {
                          const h = Math.max(0, parseInt(e.target.value) || 0);
                          const m = Math.round(((parseFloat(form.estimated_hours) || 0) % 1) * 60);
                          let total = h + (m / 60);
                          calculateValues({ estimated_hours: total });
                        }}
                        disabled={readOnly}
                        className="border-0 p-0 h-auto focus-visible:ring-0 w-12 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="00"
                      />
                      <span className="text-muted-foreground font-bold">:</span>
                      <Select 
                        value={String(Math.round(((parseFloat(form.estimated_hours) || 0) % 1) * 60)).padStart(2, '0')}
                        onValueChange={m => {
                          const h = Math.floor(parseFloat(form.estimated_hours) || 0);
                          let total = h + (parseInt(m) / 60);
                          calculateValues({ estimated_hours: total });
                        }}
                        disabled={readOnly}
                      >
                        <SelectTrigger className="border-0 p-0 h-auto focus:ring-0 focus:ring-offset-0 w-12 bg-transparent">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="00">00</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="45">45</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="values" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mão de Obra (R$)</Label>
                  <Input type="number" step="0.01" min="0" value={form.service_value} onChange={e => updateTotal('service_value', e.target.value)} disabled={readOnly} />
                </div>
                <div>
                  <Label>Peças (R$)</Label>
                  <Input type="number" step="0.01" min="0" value={form.parts_value} onChange={e => updateTotal('parts_value', e.target.value)} disabled={readOnly} />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-800">Total</span>
                  <span className="text-xl font-bold text-emerald-700">
                    R$ {(parseFloat(form.total_value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? 'Fechar' : 'Cancelar'}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
      <ClientFormDialog 
        open={isNewClientOpen} 
        onOpenChange={setIsNewClientOpen} 
        onSave={data => createClientMutation.mutate(data)} 
        isLoading={createClientMutation.isPending}
      />
      <TechnicianFormDialog 
        open={isNewTechOpen} 
        onOpenChange={setIsNewTechOpen} 
        onSave={data => createTechMutation.mutate(data)} 
        isLoading={createTechMutation.isPending}
      />
    </Dialog>
  );
}
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ServiceOrderFormDialog({ open, onOpenChange, order, clients, technicians, onSave, isLoading }) {
  const [form, setForm] = useState({
    title: '', description: '', client_id: '', client_name: '', technician_id: '', technician_name: '',
    status: 'open', priority: 'medium', scheduled_date: '', estimated_hours: '',
    service_value: '', parts_value: '', total_value: ''
  });
  const [aiLoading, setAiLoading] = useState(false);

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
    const client = clients.find(c => c.id === clientId);
    setForm({ ...form, client_id: clientId, client_name: client?.name || '' });
  };

  const handleTechChange = (techId) => {
    const tech = technicians.find(t => t.id === techId);
    setForm({ ...form, technician_id: techId, technician_name: tech?.name || '' });
  };

  const generateAIDescription = async () => {
    if (!form.title) return;
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
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
    const result = await base44.integrations.Core.InvokeLLM({
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
    const numVal = parseFloat(value) || 0;
    const newForm = { ...form, [field]: value };
    const service = field === 'service_value' ? numVal : (parseFloat(form.service_value) || 0);
    const parts = field === 'parts_value' ? numVal : (parseFloat(form.parts_value) || 0);
    newForm.total_value = service + parts;
    setForm(newForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      service_value: parseFloat(form.service_value) || 0,
      parts_value: parseFloat(form.parts_value) || 0,
      total_value: parseFloat(form.total_value) || 0,
      estimated_hours: parseFloat(form.estimated_hours) || 0,
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
                <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Ex: Manutenção preventiva ar-condicionado" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Descrição</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={generateAIDescription} disabled={aiLoading || !form.title} className="text-xs gap-1 text-primary">
                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Gerar com IA
                  </Button>
                </div>
                <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4} placeholder="Descreva o serviço..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <Select value={form.client_id} onValueChange={handleClientChange}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Técnico</Label>
                  <Select value={form.technician_id} onValueChange={handleTechChange}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
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
                  <Select value={form.priority} onValueChange={v => setForm({...form, priority: v})}>
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
                  <Input type="datetime-local" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} />
                </div>
                <div>
                  <Label>Horas Estimadas</Label>
                  <Input type="number" step="0.5" value={form.estimated_hours} onChange={e => setForm({...form, estimated_hours: e.target.value})} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="values" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-sm">Sugestão de preço com IA</span>
                <Button type="button" variant="outline" size="sm" onClick={suggestPrice} disabled={aiLoading || !form.title} className="gap-1">
                  {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Sugerir Preço
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mão de Obra (R$)</Label>
                  <Input type="number" step="0.01" value={form.service_value} onChange={e => updateTotal('service_value', e.target.value)} />
                </div>
                <div>
                  <Label>Peças (R$)</Label>
                  <Input type="number" step="0.01" value={form.parts_value} onChange={e => updateTotal('parts_value', e.target.value)} />
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
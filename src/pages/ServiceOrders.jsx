import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { ClipboardList } from 'lucide-react';
import ServiceOrderCard from '@/components/orders/ServiceOrderCard';
import ServiceOrderFormDialog from '@/components/orders/ServiceOrderFormDialog';

export default function ServiceOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['service-orders'],
    queryFn: () => api.entities.ServiceOrder.list('-created_date', 200),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.entities.Client.list('-created_date', 200),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => api.entities.Technician.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.ServiceOrder.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-orders'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.ServiceOrder.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service-orders'] }); setShowForm(false); setEditingOrder(null); },
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.entities.Appointment.list(),
  });

  const filtered = orders.filter(o => {
    const matchSearch = o.title?.toLowerCase().includes(search.toLowerCase()) ||
      o.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.order_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = (data) => {
    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, data });
    } else {
      const orderNumber = `OS-${String(orders.length + 1).padStart(4, '0')}`;
      createMutation.mutate({ ...data, order_number: orderNumber });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Ordens de Serviço" subtitle={`${orders.length} total`}>
        <Button onClick={() => { setEditingOrder(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nova OS
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar OS..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="open">Aberta</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="waiting_parts">Aguard. Peças</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhuma OS encontrada" description="Crie sua primeira ordem de serviço." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(order => (
            <ServiceOrderCard
              key={order.id}
              order={order}
              onClick={() => { setEditingOrder(order); setShowForm(true); }}
            />
          ))}
        </div>
      )}

      <ServiceOrderFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        order={editingOrder}
        clients={clients}
        technicians={technicians}
        existingAppointments={appointments}
        existingOrders={orders}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import ClientFormDialog from '@/components/clients/ClientFormDialog';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

export default function Clients() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setShowForm(false); setEditingClient(null); },
  });

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (data) => {
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" subtitle={`${clients.length} cadastrados`}>
        <Button onClick={() => { setEditingClient(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Cliente
        </Button>
      </PageHeader>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum cliente" description="Cadastre seu primeiro cliente para começar." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(client => (
            <Card key={client.id} className="border-border/50 hover:shadow-md transition-all cursor-pointer group" onClick={() => { setEditingClient(client); setShowForm(true); }}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {client.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{client.name}</h3>
                      <StatusBadge status={client.status || 'active'} />
                    </div>
                    <div className="mt-2 space-y-1">
                      {client.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" /> {client.phone}
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" /> {client.email}
                        </div>
                      )}
                      {client.city && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" /> {client.city}{client.state ? `, ${client.state}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClientFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        client={editingClient}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Plus, Search, Wrench, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import TechnicianFormDialog from '@/components/technicians/TechnicianFormDialog';

export default function Technicians() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTech, setEditingTech] = useState(null);
  const queryClient = useQueryClient();

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => api.entities.Technician.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Technician.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['technicians'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Technician.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['technicians'] }); setShowForm(false); setEditingTech(null); },
  });

  const filtered = technicians.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (data) => {
    if (editingTech) {
      updateMutation.mutate({ id: editingTech.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Técnicos" subtitle={`${technicians.length} cadastrados`}>
        <Button onClick={() => { setEditingTech(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Técnico
        </Button>
      </PageHeader>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar técnico..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Wrench} title="Nenhum técnico" description="Cadastre sua equipe técnica." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(tech => (
            <Card key={tech.id} className="border-border/50 hover:shadow-md transition-all cursor-pointer group" onClick={() => { setEditingTech(tech); setShowForm(true); }}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {tech.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{tech.name}</h3>
                      <StatusBadge status={tech.status || 'active'} />
                    </div>
                    {tech.specialty && (
                      <p className="text-xs text-muted-foreground mt-1">{tech.specialty}</p>
                    )}
                    <div className="mt-2 space-y-1">
                      {tech.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" /> {tech.phone}
                        </div>
                      )}
                      {tech.email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" /> {tech.email}
                        </div>
                      )}
                    </div>
                    {tech.hourly_rate > 0 && (
                      <p className="text-xs font-medium text-emerald-600 mt-2">
                        R$ {tech.hourly_rate?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/h
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TechnicianFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        technician={editingTech}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
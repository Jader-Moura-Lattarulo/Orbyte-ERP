import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import AppointmentFormDialog from '@/components/agenda/AppointmentFormDialog';
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 12 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);

export default function Agenda() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const queryClient = useQueryClient();

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.Appointment.list('-created_date', 200),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); setShowForm(false); setEditingAppointment(null); },
  });

  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const getAppointmentsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(a => a.date === dateStr);
  };

  const handleSlotClick = (date, time) => {
    setSelectedSlot({ date: format(date, 'yyyy-MM-dd'), start_time: time, end_time: `${String(parseInt(time) + 1).padStart(2, '0')}:00` });
    setEditingAppointment(null);
    setShowForm(true);
  };

  const handleSave = (data) => {
    if (editingAppointment) {
      updateMutation.mutate({ id: editingAppointment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Agenda" subtitle={format(currentWeek, "'Semana de' dd MMM yyyy", { locale: ptBR })}>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button onClick={() => { setEditingAppointment(null); setSelectedSlot(null); setShowForm(true); }} className="gap-2 ml-2">
            <Plus className="w-4 h-4" /> Agendar
          </Button>
        </div>
      </PageHeader>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-8 border-b border-border/50">
                <div className="p-3 text-xs font-medium text-muted-foreground" />
                {days.map(day => (
                  <div key={day.toString()} className={cn(
                    "p-3 text-center border-l border-border/50",
                    isSameDay(day, new Date()) && "bg-primary/5"
                  )}>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      {format(day, 'EEE', { locale: ptBR })}
                    </p>
                    <p className={cn(
                      "text-lg font-bold mt-0.5",
                      isSameDay(day, new Date()) && "text-primary"
                    )}>
                      {format(day, 'dd')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time slots */}
              {HOURS.map(hour => (
                <div key={hour} className="grid grid-cols-8 border-b border-border/30 min-h-[60px]">
                  <div className="p-2 text-xs text-muted-foreground font-mono flex items-start justify-end pr-3">
                    {hour}
                  </div>
                  {days.map(day => {
                    const dayAppts = getAppointmentsForDay(day).filter(a => a.start_time?.startsWith(hour.split(':')[0]));
                    return (
                      <div
                        key={day.toString()}
                        className="border-l border-border/30 p-1 hover:bg-muted/30 cursor-pointer transition-colors relative"
                        onClick={() => handleSlotClick(day, hour)}
                      >
                        {dayAppts.map(apt => (
                          <div
                            key={apt.id}
                            className="text-xs p-1.5 rounded-lg bg-primary/10 border border-primary/20 mb-1 cursor-pointer hover:bg-primary/20 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setEditingAppointment(apt); setShowForm(true); }}
                          >
                            <p className="font-medium text-primary truncate">{apt.title}</p>
                            <p className="text-muted-foreground">{apt.start_time}-{apt.end_time}</p>
                            {apt.technician_name && <p className="text-muted-foreground truncate">{apt.technician_name}</p>}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <AppointmentFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        appointment={editingAppointment}
        defaultSlot={selectedSlot}
        clients={clients}
        technicians={technicians}
        existingAppointments={appointments}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
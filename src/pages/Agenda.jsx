import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import AppointmentFormDialog from '@/components/agenda/AppointmentFormDialog';
import ServiceOrderFormDialog from '@/components/orders/ServiceOrderFormDialog';
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks, parseISO, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const HOURS = Array.from({ length: 12 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);

export default function Agenda() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showForm, setShowForm] = useState(false);
  const [showOSDialog, setShowOSDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [selectedOS, setSelectedOS] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const queryClient = useQueryClient();

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.entities.Appointment.list('-created_date', 200),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['service-orders'],
    queryFn: () => api.entities.ServiceOrder.list('-created_date', 200),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.entities.Client.list(),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => api.entities.Technician.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Appointment.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Appointment.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); setShowForm(false); setEditingAppointment(null); },
  });

  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const getAppointmentsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAppts = appointments.filter(a => a.date === dateStr);
    
    const dayOrders = orders
      .filter(o => o.scheduled_date && o.scheduled_date.startsWith(dateStr))
      .map(o => {
        const scheduledDate = parseISO(o.scheduled_date);
        const startTime = format(scheduledDate, 'HH:mm');
        const duration = parseFloat(o.estimated_hours) || 1;
        const endTimeDate = addHours(scheduledDate, duration);
        const endTime = format(endTimeDate, 'HH:mm');
        
        return {
          id: `os-${o.id}`,
          title: `OS: ${o.title}`,
          date: dateStr,
          start_time: startTime,
          end_time: endTime,
          technician_name: o.technician_name,
          is_os: true,
          original_os: o
        };
      });

    return [...dayAppts, ...dayOrders];
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
                            className={cn(
                              "text-xs p-1.5 rounded-lg border mb-1 cursor-pointer transition-colors",
                              apt.is_os 
                                ? "bg-amber-100 border-amber-300 hover:bg-amber-200" 
                                : "bg-primary/10 border-primary/20 hover:bg-primary/20"
                            )}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (apt.is_os) {
                                setSelectedOS(apt.original_os);
                                setShowOSDialog(true);
                              } else {
                                setEditingAppointment(apt); 
                                setShowForm(true); 
                              }
                            }}
                          >
                            <p className={cn("font-medium truncate", apt.is_os ? "text-amber-800" : "text-primary")}>
                              {apt.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{apt.start_time}-{apt.end_time}</p>
                            {apt.technician_name && <p className="text-[10px] text-muted-foreground truncate">{apt.technician_name}</p>}
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

      <ServiceOrderFormDialog
        open={showOSDialog}
        onOpenChange={setShowOSDialog}
        order={selectedOS}
        clients={clients}
        technicians={technicians}
        onSave={() => {}}
        readOnly={true}
      />
    </div>
  );
}
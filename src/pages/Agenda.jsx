import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
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

  // Data Fetching
  const appointmentsQuery = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.entities.Appointment.list('-created_date', 500),
  });

  const ordersQuery = useQuery({
    queryKey: ['service-orders'],
    queryFn: () => api.entities.ServiceOrder.list('-created_date', 500),
  });

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.entities.Client.list(),
  });

  const techniciansQuery = useQuery({
    queryKey: ['technicians'],
    queryFn: () => api.entities.Technician.list(),
  });

  // Data Normalization
  const appointments = useMemo(() => {
    const data = appointmentsQuery.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  }, [appointmentsQuery.data]);

  const orders = useMemo(() => {
    const data = ordersQuery.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  }, [ordersQuery.data]);

  const clients = Array.isArray(clientsQuery.data) ? clientsQuery.data : (clientsQuery.data?.data || []);
  const technicians = Array.isArray(techniciansQuery.data) ? techniciansQuery.data : (techniciansQuery.data?.data || []);

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Appointment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowForm(false);
      toast.success('Agendamento criado!');
    },
    onError: (err) => toast.error(err.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Appointment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowForm(false);
      setEditingAppointment(null);
      toast.success('Agendamento atualizado!');
    },
    onError: (err) => toast.error(err.message)
  });

  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const getAppointmentsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const dayAppts = appointments.filter(a => {
      if (!a || !a.date) return false;
      const apptDate = String(a.date).trim().split(' ')[0].split('T')[0];
      return apptDate === dateStr;
    });

    const dayOrders = orders
      .filter(o => o && o.scheduled_date && String(o.scheduled_date).startsWith(dateStr))
      .map(o => {
        try {
          const sd = parseISO(o.scheduled_date);
          const start = format(sd, 'HH:mm');
          const end = format(addHours(sd, parseFloat(o.estimated_hours) || 1), 'HH:mm');
          return { ...o, id: `os-${o.id}`, is_os: true, start_time: start, end_time: end, original_os: o };
        } catch { return null; }
      }).filter(Boolean);

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

      <Card className="border-border/50 overflow-hidden shadow-sm">
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
                    const hPart = hour.split(':')[0];
                    const dayItems = getAppointmentsForDay(day).filter(item => {
                      // Fallback para agendamentos antigos sem start_time
                      const st = item.start_time || (item.end_time === '10:00' ? '09:00' : '07:00');
                      return st.startsWith(hPart);
                    });

                    return (
                      <div
                        key={day.toString()}
                        className="border-l border-border/30 p-1 hover:bg-muted/30 cursor-pointer transition-colors relative"
                        onClick={() => handleSlotClick(day, hour)}
                      >
                        {dayItems.map(item => (
                          <div
                            key={item.id}
                            className={cn(
                              "text-xs p-1.5 rounded-lg border mb-1 cursor-pointer transition-colors",
                              item.is_os 
                                ? "bg-amber-100 border-amber-300 hover:bg-amber-200" 
                                : "bg-primary/10 border-primary/20 hover:bg-primary/20"
                            )}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (item.is_os) {
                                setSelectedOS(item.original_os);
                                setShowOSDialog(true);
                              } else {
                                setEditingAppointment(item); 
                                setShowForm(true); 
                              }
                            }}
                          >
                            <p className={cn("font-medium truncate", item.is_os ? "text-amber-800" : "text-primary")}>
                              {item.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{item.start_time || '00:00'}-{item.end_time || '00:00'}</p>
                            {item.technician_name && <p className="text-[10px] text-muted-foreground truncate">{item.technician_name}</p>}
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
        existingOrders={orders}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ServiceOrderFormDialog
        open={showOSDialog}
        onOpenChange={setShowOSDialog}
        order={selectedOS}
        clients={clients}
        technicians={technicians}
        existingAppointments={appointments}
        existingOrders={orders}
        onSave={() => {}}
        readOnly={true}
      />
    </div>
  );
}
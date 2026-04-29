import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import { format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function UpcomingAppointments({ appointments }) {
  const upcoming = appointments
    .filter(a => a.date && isAfter(new Date(a.date + 'T23:59:59'), new Date()) && a.status !== 'cancelled')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Próximos Agendamentos</CardTitle>
          <Link to="/agenda" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
            Ver agenda <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {upcoming.map((apt) => (
            <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                <span className="text-[10px] font-semibold text-primary uppercase">
                  {apt.date ? format(new Date(apt.date), 'MMM', { locale: ptBR }) : ''}
                </span>
                <span className="text-sm font-bold text-primary leading-none">
                  {apt.date ? format(new Date(apt.date), 'dd') : ''}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{apt.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{apt.start_time} - {apt.end_time}</span>
                  {apt.technician_name && <span className="text-xs text-muted-foreground">• {apt.technician_name}</span>}
                </div>
              </div>
              <StatusBadge status={apt.status} />
            </div>
          ))}
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum agendamento próximo</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
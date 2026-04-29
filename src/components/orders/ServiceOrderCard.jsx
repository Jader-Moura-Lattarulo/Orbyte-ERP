import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/shared/StatusBadge';
import { Calendar, User, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ServiceOrderCard({ order, onClick }) {
  return (
    <Card 
      className="border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[11px] font-mono text-muted-foreground">{order.order_number}</p>
            <h3 className="text-sm font-semibold mt-0.5 group-hover:text-primary transition-colors line-clamp-1">{order.title}</h3>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="space-y-2">
          {order.client_name && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="w-3.5 h-3.5" /> {order.client_name}
            </div>
          )}
          {order.technician_name && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" /> {order.technician_name}
            </div>
          )}
          {order.scheduled_date && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" /> {format(new Date(order.scheduled_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </div>
          )}
        </div>

        {order.total_value > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-sm font-bold text-emerald-600">
              R$ {order.total_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {order.priority && order.priority !== 'medium' && (
          <div className="mt-2">
            <StatusBadge status={order.priority} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/shared/StatusBadge';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RecentOrders({ orders }) {
  const recent = orders.slice(0, 5);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Últimas OS</CardTitle>
          <Link to="/ordens" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {recent.map((order) => (
            <Link key={order.id} to={`/ordens/${order.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{order.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{order.client_name || 'Sem cliente'} • {order.created_date ? format(new Date(order.created_date), "dd MMM", { locale: ptBR }) : ''}</p>
              </div>
              <StatusBadge status={order.status} />
            </Link>
          ))}
          {recent.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma OS encontrada</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
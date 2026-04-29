import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function TopTechnicians({ orders }) {
  const completedOrders = orders.filter(o => o.status === 'completed' && o.technician_name);
  
  const techMap = {};
  completedOrders.forEach(o => {
    if (!techMap[o.technician_name]) {
      techMap[o.technician_name] = { count: 0, revenue: 0 };
    }
    techMap[o.technician_name].count++;
    techMap[o.technician_name].revenue += (o.total_value || 0);
  });

  const techRanking = Object.entries(techMap)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 5);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Técnicos Destaque</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {techRanking.map(([name, data], idx) => (
            <div key={name} className="flex items-center gap-3">
              <div className="text-xs font-bold text-muted-foreground w-5">{idx + 1}º</div>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{name}</p>
                <p className="text-xs text-muted-foreground">{data.count} OS concluídas</p>
              </div>
              <p className="text-sm font-semibold text-emerald-600">
                R$ {data.revenue.toLocaleString('pt-BR', {minimumFractionDigits: 0})}
              </p>
            </div>
          ))}
          {techRanking.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Sem dados ainda</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
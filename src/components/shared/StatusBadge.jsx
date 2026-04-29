import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
  // OS statuses
  open: { label: 'Aberta', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'Em Andamento', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  waiting_parts: { label: 'Aguard. Peças', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  completed: { label: 'Concluída', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelada', className: 'bg-red-50 text-red-700 border-red-200' },
  // Financial statuses
  pending: { label: 'Pendente', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  paid: { label: 'Pago', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  overdue: { label: 'Vencido', className: 'bg-red-50 text-red-700 border-red-200' },
  // Agenda
  scheduled: { label: 'Agendado', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  confirmed: { label: 'Confirmado', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  // Priority
  low: { label: 'Baixa', className: 'bg-slate-50 text-slate-600 border-slate-200' },
  medium: { label: 'Média', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  high: { label: 'Alta', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  urgent: { label: 'Urgente', className: 'bg-red-50 text-red-700 border-red-200' },
  // General
  active: { label: 'Ativo', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive: { label: 'Inativo', className: 'bg-slate-50 text-slate-600 border-slate-200' },
  // Financial types
  income: { label: 'Receita', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  expense: { label: 'Despesa', className: 'bg-red-50 text-red-700 border-red-200' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium border", config.className)}>
      {config.label}
    </Badge>
  );
}
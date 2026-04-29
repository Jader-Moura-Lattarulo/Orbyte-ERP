import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RevenueChart({ financials }) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    const income = financials
      .filter(f => f.type === 'income' && f.paid_date && isWithinInterval(new Date(f.paid_date), { start, end }))
      .reduce((sum, f) => sum + (f.amount || 0), 0);
    
    const expense = financials
      .filter(f => f.type === 'expense' && f.paid_date && isWithinInterval(new Date(f.paid_date), { start, end }))
      .reduce((sum, f) => sum + (f.amount || 0), 0);

    return {
      name: format(date, 'MMM', { locale: ptBR }),
      receita: income,
      despesa: expense,
    };
  });

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Receitas vs Despesas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={months} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }}
              formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits:2})}`, '']}
            />
            <Bar dataKey="receita" name="Receita" fill="hsl(142, 71%, 45%)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="despesa" name="Despesa" fill="hsl(0, 84%, 60%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
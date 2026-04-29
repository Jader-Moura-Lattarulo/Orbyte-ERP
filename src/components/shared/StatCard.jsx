import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className }) {
  return (
    <div className={cn(
      "bg-card rounded-2xl p-5 border border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={cn(
            "text-xs font-semibold px-1.5 py-0.5 rounded",
            trendUp ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
          )}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          <span className="text-xs text-muted-foreground">vs. mês anterior</span>
        </div>
      )}
    </div>
  );
}
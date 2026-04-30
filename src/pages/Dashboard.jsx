import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { ClipboardList, Users, DollarSign, TrendingUp, AlertTriangle, Clock, CheckCircle2, Wrench } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import RecentOrders from '@/components/dashboard/RecentOrders';
import RevenueChart from '@/components/dashboard/RevenueChart';
import TopTechnicians from '@/components/dashboard/TopTechnicians';
import UpcomingAppointments from '@/components/dashboard/UpcomingAppointments';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['service-orders'],
    queryFn: () => api.entities.ServiceOrder.list('-created_date', 100),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.entities.Client.list('-created_date', 100),
  });

  const { data: financials = [] } = useQuery({
    queryKey: ['financials'],
    queryFn: () => api.entities.FinancialEntry.list('-created_date', 100),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.entities.Appointment.list('-created_date', 50),
  });

  const openOrders = orders.filter(o => o.status === 'open' || o.status === 'in_progress');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenue = financials.filter(f => f.type === 'income' && f.status === 'paid').reduce((sum, f) => sum + (f.amount || 0), 0);
  const pendingAmount = financials.filter(f => f.type === 'income' && f.status === 'pending').reduce((sum, f) => sum + (f.amount || 0), 0);

  if (loadingOrders) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle="Visão geral do seu negócio" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Visão geral do seu negócio" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="OS Abertas" value={openOrders.length} icon={ClipboardList} subtitle={`${completedOrders.length} concluídas`} />
        <StatCard title="Clientes" value={clients.length} icon={Users} subtitle="Total cadastrado" />
        <StatCard title="Receita" value={`R$ ${totalRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} icon={DollarSign} subtitle="Recebido" />
        <StatCard title="A Receber" value={`R$ ${pendingAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} icon={TrendingUp} subtitle="Pendente" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart financials={financials} />
        </div>
        <TopTechnicians orders={orders} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentOrders orders={orders} />
        <UpcomingAppointments appointments={appointments} />
      </div>
    </div>
  );
}
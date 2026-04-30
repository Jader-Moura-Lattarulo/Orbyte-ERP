import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  DollarSign,
  Calendar,
  Package,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: ClipboardList, label: 'Ordens de Serviço', path: '/ordens' },
  { icon: DollarSign, label: 'Financeiro', path: '/financeiro' },
  { icon: Calendar, label: 'Agenda', path: '/agenda' },
  { icon: Package, label: 'Estoque', path: '/estoque' },
  { icon: Wrench, label: 'Técnicos', path: '/tecnicos' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col z-50 transition-all duration-300 border-r border-sidebar-border",
      collapsed ? "w-[72px]" : "w-[240px]"
    )}>
      {/* Logo */}
      <div className="flex items-center px-6 h-20 border-b border-sidebar-border">
        <img src="/OrbyteLogo-vazado-neg.png" alt="Orbyte ERP" className="h-12 w-auto object-contain flex-shrink-0" />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/25"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* Admin Section */}
        {user?.role === 'admin' && (
          <Link
            to="/usuarios"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mt-4 border-t border-sidebar-border pt-4",
              location.pathname.startsWith('/usuarios')
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/25"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Gerenciar Usuários</span>}
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span>Recolher</span>}
        </button>
        <button
          onClick={() => api.auth.logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
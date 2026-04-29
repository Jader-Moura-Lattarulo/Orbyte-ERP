import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Users, ClipboardList, DollarSign, Calendar, Package, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: ClipboardList, label: 'Ordens de Serviço', path: '/ordens' },
  { icon: DollarSign, label: 'Financeiro', path: '/financeiro' },
  { icon: Calendar, label: 'Agenda', path: '/agenda' },
  { icon: Package, label: 'Estoque', path: '/estoque' },
  { icon: Wrench, label: 'Técnicos', path: '/tecnicos' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Wrench className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-sm">ServiçoPro</span>
      </div>
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 bg-sidebar text-sidebar-foreground">
          <div className="p-5 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Wrench className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-base font-bold">ServiçoPro</h1>
                <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest">ERP</p>
              </div>
            </div>
          </div>
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
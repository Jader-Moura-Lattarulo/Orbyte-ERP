import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Mobile nav */}
      <div className="lg:hidden">
        <MobileNav />
      </div>

      {/* Main content */}
      <main className="lg:ml-[260px] min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
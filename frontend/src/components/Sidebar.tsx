import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Globe, FileText, DollarSign, Shield } from 'lucide-react';

function Sidebar({ user }) {
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/cases', icon: Briefcase, label: 'Cases' },
    { path: '/payments', icon: DollarSign, label: 'Financials' },
    { path: '/templates', icon: FileText, label: 'Templates' },
    { path: '/integrations', icon: Globe, label: 'UYAP' },
    ...(isAdmin ? [{ path: '/users', icon: Shield, label: 'Users' }] : []),
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-dark-800 to-dark-900 text-white shadow-xl">
      <div className="p-6 border-b border-dark-700">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">LOMS</h2>
        <p className="text-xs text-dark-400 mt-1">Legal Ops</p>
      </div>
      <nav className="mt-6 space-y-2 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
                          location.pathname.startsWith(item.path + '/');
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/50'
                  : 'text-dark-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;

import React from 'react';
import { 
  Scissors, 
  Calendar, 
  Users, 
  Activity, 
  DollarSign, 
  Grid, 
  Wifi, 
  WifiOff, 
  ShieldAlert, 
  Sun, 
  Moon,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  syncPendingCount: number;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  userRole,
  setUserRole,
  isOffline,
  setIsOffline,
  darkMode,
  setDarkMode,
  syncPendingCount,
}: SidebarProps) {
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Grid, roles: ['Admin', 'Staff', 'Receptionist'] },
    { id: 'appointments', label: 'Appointments', icon: Calendar, roles: ['Admin', 'Staff', 'Receptionist'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['Admin', 'Staff', 'Receptionist'] },
    { id: 'services', label: 'Services Menu', icon: Scissors, roles: ['Admin', 'Receptionist'] },
    { id: 'reports', label: 'Earnings Report', icon: DollarSign, roles: ['Admin'] },
  ];

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRole = e.target.value as UserRole;
    setUserRole(selectedRole);
    // Auto-fallback if active tab is restricted in new role
    if (selectedRole === 'Staff' && activeTab === 'reports') {
      setActiveTab('dashboard');
    } else if (selectedRole === 'Staff' && activeTab === 'services') {
      setActiveTab('dashboard');
    } else if (selectedRole === 'Receptionist' && activeTab === 'reports') {
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950/50 border-r border-slate-200 dark:border-slate-800/80 transition-colors duration-200 w-full md:w-64 max-h-screen">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800/80 flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
            RC
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 font-sans leading-tight">
              Royal Cuts <span className="text-emerald-500 font-extrabold">CRM</span>
            </h1>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-1 font-semibold font-mono">
              Barber Management
            </p>
          </div>
        </div>
      </div>

      {/* Role Manager */}
      <div className="p-3 mx-4 my-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
        <div className="flex items-center space-x-2 mb-1.5">
          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Active Access Role</span>
        </div>
        <div className="relative">
          <select
            id="role-select"
            value={userRole}
            onChange={handleRoleChange}
            className="w-full pl-2.5 pr-8 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 appearance-none cursor-pointer"
          >
            <option value="Admin">🔑 Admin / Owner</option>
            <option value="Staff">💇‍♂️ Stylist / Staff</option>
            <option value="Receptionist">📞 Receptionist</option>
          </select>
          <div className="absolute right-2 top-2 pointer-events-none text-slate-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
            {userRole === 'Admin' && 'Full privileges granted.'}
            {userRole === 'Staff' && 'Limited: Bookings & direct logs.'}
            {userRole === 'Receptionist' && 'Limited: Schedule & Client Ledger.'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-3 overflow-y-auto space-y-1">
        {navItems.map((item) => {
          const isAllowed = item.roles.includes(userRole);
          if (!isAllowed) return null;

          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all group ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 shadow-xs'
                  : 'text-slate-550 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-900/80 hover:text-slate-905 dark:hover:text-slate-105 border border-transparent'
              }`}
            >
              <IconComponent className={`h-4 w-4 transition-transform group-hover:scale-105 shrink-0 ${
                isActive ? 'text-emerald-555' : 'text-slate-400 dark:text-slate-550 group-hover:text-emerald-500'
              }`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Controls / Status Area */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
        {/* Offline Toggle */}
        <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2">
            {isOffline ? (
              <WifiOff className="h-4.5 w-4.5 text-rose-500 animate-bounce" />
            ) : (
              <Wifi className="h-4.5 w-4.5 text-emerald-500 animate-pulse" />
            )}
            <div className="text-left">
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
                {isOffline ? 'Offline Active' : 'Online Sync'}
              </p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                {isOffline ? 'Queueing local acts' : 'All synced successfully'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`cursor-pointer px-2 py-1 rounded text-[10px] font-bold transition-all uppercase ${
              isOffline
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
            }`}
          >
            {isOffline ? 'Go Online' : 'Go Offline'}
          </button>
        </div>

        {syncPendingCount > 0 && isOffline && (
          <div className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-amber-800 dark:text-amber-400 border border-amber-200/50 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[10px] font-medium leading-tight">
              {syncPendingCount} local transaction{syncPendingCount > 1 ? 's' : ''} saved offline.
            </span>
          </div>
        )}

        {/* Dark Mode toggle & system status */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
            v3.2.0 • Offline First
          </span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  ArrowUpRight, 
  PlusCircle, 
  CheckCircle, 
  AlertTriangle,
  Play,
  Send,
  Zap,
  Sparkles
} from 'lucide-react';
import { Customer, Appointment, Payment, Service, UserRole } from '../types';
import { formatWhatsAppLink, getAppointmentReminderMsg } from '../utils/whatsapp';

interface DashboardViewProps {
  customers: Customer[];
  appointments: Appointment[];
  payments: Payment[];
  services: Service[];
  userRole: UserRole;
  addPayment: (payment: Omit<Payment, 'id' | 'date' | 'time'>) => void;
  triggerNotification: (title: string, message: string, type: 'info' | 'urgent' | 'success' | 'alert') => void;
  isOffline: boolean;
}

export default function DashboardView({
  customers,
  appointments,
  payments,
  services,
  userRole,
  addPayment,
  triggerNotification,
  isOffline,
}: DashboardViewProps) {
  // Quick Checkout State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [payMethod, setPayMethod] = useState<'Cash' | 'Card' | 'UPI/Online'>('Cash');
  const [selectedBarber, setSelectedBarber] = useState('u2'); // Samir Barber
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Custom alert text
  const [alertText, setAlertText] = useState('Urgent: Water supply repair scheduled today. Store closed for 1 hour at 2 PM.');

  // Statistics Calculation
  const stats = useMemo(() => {
    // Current month: June 2026
    const j2026Payments = payments.filter(p => p.date.startsWith('2026-06'));
    const totalEarnings = j2026Payments.reduce((acc, curr) => acc + curr.totalAmount, 0);
    
    // Total historical earnings
    const grandEarnings = payments.reduce((acc, curr) => acc + curr.totalAmount, 0);

    const pendingAppointments = appointments.filter(a => a.status === 'pending');
    const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');

    // Popular services computation
    const serviceCounts: Record<string, number> = {};
    payments.forEach(p => {
      p.serviceNames.forEach(s => {
        serviceCounts[s] = (serviceCounts[s] || 0) + 1;
      });
    });
    
    const popularServices = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    return {
      monthlySales: totalEarnings,
      grandSales: grandEarnings,
      pendingCount: pendingAppointments.length,
      confirmedCount: confirmedAppointments.length,
      popularServices,
    };
  }, [payments, appointments]);

  // Handle Quick Sale Submission
  const handleQuickCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || selectedServices.length === 0) {
      alert('Please select a customer and at least one service!');
      return;
    }

    const customerObj = customers.find(c => c.id === selectedCustomerId);
    if (!customerObj) return;

    // Resolve service names and cumulative cost
    const chosenServicesObj = services.filter(s => selectedServices.includes(s.id));
    const serviceNames = chosenServicesObj.map(s => s.name);
    const totalAmt = chosenServicesObj.reduce((sum, s) => sum + s.price, 0);

    const barbers: Record<string, string> = {
      'u1': 'Owner Admin',
      'u2': 'Samir Barber',
      'u3': 'Haris Stylist',
    };

    addPayment({
      customerId: customerObj.id,
      customerName: customerObj.name,
      customerPhone: customerObj.phone,
      serviceNames,
      totalAmount: totalAmt,
      paymentMethod: payMethod,
      status: 'Paid',
      barberId: selectedBarber,
      barbersName: barbers[selectedBarber] || 'Samir Barber',
    });

    setCheckoutSuccess(true);
    triggerNotification(
      'Payment Recorded',
      `Quick checkout of Rs. ${totalAmt} filed successfully for ${customerObj.name}.`,
      'success'
    );

    // Reset checkout form
    setTimeout(() => {
      setSelectedServices([]);
      setSelectedCustomerId('');
      setCheckoutSuccess(false);
    }, 2500);
  };

  // Toggle Services Selection
  const handleServiceToggle = (id: string) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter(s => s !== id));
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  // Send Manual Simulated Push Notice
  const handleSimulateAlert = () => {
    if (!alertText.trim()) return;
    triggerNotification(
      'Urgent Notice Posted',
      alertText,
      'urgent'
    );
    // Local Notification simulating system push
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 Barber CRM - Urgent Alert', {
        body: alertText,
      });
    } else {
      // Prompt permissions if needed
      try {
        Notification.requestPermission();
      } catch (e) {}
    }
    setAlertText('');
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-emerald-55 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg">
              {userRole} Workspace
            </span>
            {isOffline && (
              <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 rounded-full animate-pulse flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 inline-block"></span>
                Offline Mode Enabled
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-800 dark:text-slate-100 mt-2">
            Welcome Back, Owner!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Real-time analytics and staff overview for your barber business operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">Current Time</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">
              {new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Sales Current Month */}
        <div id="stat-monthly-sales" className="bg-white dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {new Date().toLocaleString('default', { month: 'long' })} Earnings
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-emerald-500 dark:text-emerald-400 font-mono">
                Rs. {stats.monthlySales}
              </span>
              <span className="text-emerald-500 text-[10px] font-bold flex items-center bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-1 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +14.2%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Live updated today</p>
          </div>
          <div className="p-2 w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Pending Appointments */}
        <div id="stat-pending-appointments" className="bg-white dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Pending Bookings
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-amber-500 font-mono">
                {stats.pendingCount}
              </span>
              <span className="text-amber-500 text-[9px] font-bold bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">
                Awaiting Check
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Awaiting your action</p>
          </div>
          <div className="p-2 w-10 h-10 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-lg flex items-center justify-center shrink-0 animate-pulse">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Active Salon Bookings */}
        <div id="stat-confirmed-slots" className="bg-white dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Confirmed Slots
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-sky-500 dark:text-sky-400 font-mono">
                {stats.confirmedCount}
              </span>
              <span className="text-sky-600 dark:text-sky-400 text-[9px] font-bold bg-sky-50 dark:bg-sky-500/10 px-1.5 py-0.5 rounded">
                Active Today
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Stylists fully booked</p>
          </div>
          <div className="p-2 w-10 h-10 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-lg flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Historical Earning */}
        <div id="stat-grand-sales" className="bg-white dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Lifetime Sales Ledger
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-slate-700 dark:text-slate-100 font-mono">
                Rs. {stats.grandSales}
              </span>
              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 px-1.5 py-0.5 rounded">
                All-time
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Including offline transactions</p>
          </div>
          <div className="p-2 w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Dashboard Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Charts and Urgent Alerts (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Aesthetic SVG Sales Trend Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display">
                  Weekly Sales Analytics (Simulated)
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Visual projection of sales performance and peak hourly client visits.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700">
                Weekly Summary
              </span>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="h-48 w-full relative pt-2">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="h-px bg-slate-100 dark:bg-slate-800/80 w-full"></div>
                <div className="h-px bg-slate-100 dark:bg-slate-800/80 w-full"></div>
                <div className="h-px bg-slate-100 dark:bg-slate-800/80 w-full"></div>
                <div className="h-px bg-slate-100 dark:bg-slate-800/80 w-full"></div>
              </div>

              {/* Chart SVG */}
              <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible">
                {/* Gradient area */}
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area path */}
                <path
                  d="M 10,110 L 10,65 Q 90,30 170,85 T 330,25 Q 410,75 490,40 L 490,110 Z"
                  fill="url(#chartGrad)"
                />

                {/* Smooth spline path */}
                <path
                  d="M 10,65 Q 90,30 170,85 T 330,25 Q 410,75 490,40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                <circle cx="10" cy="65" r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="170" cy="85" r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="330" cy="25" r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="490" cy="40" r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              </svg>

              {/* X Axis Labels */}
              <div className="flex justify-between mt-3 px-2 text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
                <span>FRI</span>
                <span>SAT</span>
                <span>SUN</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4">
              <div className="text-center">
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase leading-normal">
                  Highest Sales Day
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                  Friday (Rs. 1,450)
                </p>
              </div>
              <div className="text-center border-x border-slate-100 dark:border-slate-800/80">
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase leading-normal">
                  Avg Ticket Value
                </p>
                <p className="text-sm font-bold text-emerald-500 dark:text-emerald-400 mt-0.5">
                  Rs. 280
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase leading-normal">
                  Idle Wait Time
                </p>
                <p className="text-sm font-bold text-emerald-500 mt-0.5">
                  &lt; 10 min
                </p>
              </div>
            </div>
          </div>

          {/* Quick Push Notification Trigger Component */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display flex items-center gap-2">
                <Zap className="text-amber-500 w-5 h-5 fill-amber-500" />
                Broadcast Urgent Push Notification / Alert
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Generate dynamic real-time system alerts and browser native push notifications.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="urgent-alert-input"
                type="text"
                value={alertText}
                onChange={(e) => setAlertText(e.target.value)}
                placeholder="Write urgent emergency alert text..."
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                id="btn-simulate-alert"
                onClick={handleSimulateAlert}
                className="cursor-pointer bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 py-2.5 px-4 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                Trigger Alert Now
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              *Requires granting notification permission. Alerts are automatically added to the Activity Log & Alerts system widget.
            </p>
          </div>

          {/* Quick Schedule Pending Appointments Quick Look */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display">
                  Pending Bookings (Awaiting Alert Confirmations)
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Owner can quickly send pre-composed template reminders via direct WhatsApp.
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 cursor-pointer hover:underline">
                View All Schedule
              </span>
            </div>

            {/* List limit to 3 */}
            <div className="space-y-3">
              {appointments.filter(a => a.status === 'pending').slice(0, 3).map((appt) => {
                const waMessage = getAppointmentReminderMsg(appt);
                const waLink = formatWhatsAppLink(appt.customerPhone, waMessage);

                return (
                  <div key={appt.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/45 rounded-xl border border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:translate-x-1 transition-transform">
                    <div className="flex gap-3">
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-605 dark:text-emerald-400 rounded-lg h-fit">
                        <Clock className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {appt.customerName}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          Phone: +{appt.customerPhone}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                            💈 {appt.serviceName}
                          </span>
                          <span className="text-[9px] bg-slate-200/60 dark:bg-slate-800 text-slate-500 px-1 rounded">
                            {appt.barbersName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-none text-center bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 leading-tight"
                      >
                        <Send className="w-3 h-3 text-emerald-600" />
                        WhatsApp Alert
                      </a>
                    </div>
                  </div>
                );
              })}

              {appointments.filter(a => a.status === 'pending').length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs">
                  ✨ No pending appointments scheduled!
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Quick Sale Entry and Services Popularity (Span 1) */}
        <div className="space-y-6">

          {/* Quick Sale Checkout Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex items-center space-x-2.5 mb-2">
              <PlusCircle className="text-emerald-500 dark:text-emerald-400 w-5 h-5" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display">
                Quick Service Checkout
              </h3>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              Instantly file service completions and collect payments safely on backend.
            </p>

            <form onSubmit={handleQuickCheckoutSubmit} className="space-y-3.5">
              {/* Select Customer */}
              <div className="space-y-1">
                <label htmlFor="quick-cust-select" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Select Customer
                </label>
                <select
                  id="quick-cust-select"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  required
                >
                  <option value="">-- Choose Client --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              {/* Select Services Checklist */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
                  Select Services Done
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-850 p-2 rounded-xl border border-slate-200 dark:border-slate-755">
                  {services.map(s => {
                    const checked = selectedServices.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => handleServiceToggle(s.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs leading-none transition-all ${
                          checked 
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20' 
                            : 'text-slate-600 dark:text-slate-450 hover:bg-slate-100 border border-transparent'
                        }`}
                      >
                        <span>{s.name}</span>
                        <span className="font-mono text-slate-400 font-bold">Rs. {s.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Select */}
              <div className="grid grid-cols-3 gap-2">
                {(['Cash', 'Card', 'UPI/Online'] as const).map(method => (
                  <button
                    type="button"
                    key={method}
                    onClick={() => setPayMethod(method)}
                    className={`cursor-pointer py-1.5 px-2 text-[11px] font-bold rounded-lg border text-center transition-all ${
                      payMethod === method
                        ? 'bg-emerald-600 text-white border-emerald-600 font-extrabold'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-55'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {/* Select Barber */}
              <div className="space-y-1">
                <label htmlFor="quick-barber-select" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Assigned Stylist
                </label>
                <select
                  id="quick-barber-select"
                  value={selectedBarber}
                  onChange={(e) => setSelectedBarber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="u2">Samir Barber (Primary)</option>
                  <option value="u3">Haris Stylist (Alternate)</option>
                  <option value="u1">Owner Admin</option>
                </select>
              </div>

              {checkoutSuccess && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center justify-center gap-1.5 animate-bounce">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Logged successfully! Cashbox refiled.</span>
                </div>
              )}

              {/* Submit Checkout */}
              <button
                type="submit"
                id="btn-quick-checkout"
                className="cursor-pointer w-full bg-emerald-600 hover:bg-emerald-750 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/15 active:scale-95 transition-transform"
              >
                📝 File & Checkout Bill
              </button>
            </form>
          </div>

          {/* Popular Services Analytics */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-display">
              Popular Barber Services
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              Client choice distributions and ticket count in the database.
            </p>

            <div className="space-y-3.5">
              {stats.popularServices.map((srv, idx) => {
                const colors = ['bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-amber-500'];
                return (
                  <div key={srv.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {idx + 1}. {srv.name}
                      </span>
                      <span className="font-mono text-slate-400 font-bold">
                        {srv.count} orders
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[idx % colors.length] || 'bg-emerald-500'} rounded-full`}
                        style={{ width: `${Math.min(100, (srv.count / 5) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {stats.popularServices.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">
                  Checkout some billing tickets to see results!
                </p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

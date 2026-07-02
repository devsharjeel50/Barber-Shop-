import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  Wifi, 
  WifiOff, 
  Menu, 
  X, 
  Sliders, 
  CheckCheck, 
  Volume2, 
  VolumeX,
  History,
  TrendingUp,
  Clock,
  Scissors,
  Users,
  DollarSign,
  Grid,
  Calendar
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import AppointmentsView from './components/AppointmentsView';
import CustomersView from './components/CustomersView';
import ServicesView from './components/ServicesView';
import EarningReportView from './components/EarningReportView';
import { Customer, Appointment, Payment, Service, SystemNotification, UserRole } from './types';

// Mock values fallback
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_SERVICES, 
  INITIAL_PAYMENTS, 
  INITIAL_NOTIFICATIONS 
} from './data/mockData';

export default function App() {
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Mobile menu display toggling
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sound Alerts Preference State
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Notification Pane display
  const [showNotificationPane, setShowNotificationPane] = useState(false);

  // Global Core Data states loaded from Local Storage
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Simulator Access States
  const [userRole, setUserRole] = useState<UserRole>('Staff'); // Default secure access role: Staff (requires pin '1955' to go Admin)
  const [isOffline, setIsOffline] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const cachedTheme = localStorage.getItem('barber_theme');
    if (cachedTheme === 'dark') return true;
    if (cachedTheme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Counter of offline ledger records waiting for online network
  const [syncPendingCount, setSyncPendingCount] = useState(0);

  // --- INITIAL COMPILATION ---
  useEffect(() => {
    // 1. Fetch or seed database from localStorage
    const storedCustomers = localStorage.getItem('barber_customers');
    if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
    else {
      setCustomers(INITIAL_CUSTOMERS);
      localStorage.setItem('barber_customers', JSON.stringify(INITIAL_CUSTOMERS));
    }

    const storedAppointments = localStorage.getItem('barber_appointments');
    if (storedAppointments) setAppointments(JSON.parse(storedAppointments));
    else {
      setAppointments(INITIAL_APPOINTMENTS);
      localStorage.setItem('barber_appointments', JSON.stringify(INITIAL_APPOINTMENTS));
    }

    const storedPayments = localStorage.getItem('barber_payments');
    if (storedPayments) setPayments(JSON.parse(storedPayments));
    else {
      setPayments(INITIAL_PAYMENTS);
      localStorage.setItem('barber_payments', JSON.stringify(INITIAL_PAYMENTS));
    }

    const storedServices = localStorage.getItem('barber_services');
    if (storedServices) setServices(JSON.parse(storedServices));
    else {
      setServices(INITIAL_SERVICES);
      localStorage.setItem('barber_services', JSON.stringify(INITIAL_SERVICES));
    }

    const storedNotifications = localStorage.getItem('barber_notifications');
    if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
    else {
      setNotifications(INITIAL_NOTIFICATIONS);
      localStorage.setItem('barber_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
    }

    // Browser Online state synchronization listeners
    const handleOnline = () => {
      setIsOffline(false);
      triggerNotification('Network Restored', 'Auto-sync completed. Local database updated on backend.', 'success');
      setSyncPendingCount(0);
    };

    const handleOffline = () => {
      setIsOffline(true);
      triggerNotification('Offline mode activated', 'No network detected. Entries will save to offline ledger.', 'alert');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- DARK MODE THEME SYNC ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('barber_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('barber_theme', 'light');
    }
  }, [darkMode]);

  // --- PLAY AUDIO SOUND REMINDERS ---
  const playAlertSound = (type: SystemNotification['type']) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'urgent') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(350, audioCtx.currentTime); 
        oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.4);
      } else {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
      }
    } catch (e) {
      console.log('Oscillator failed (expected iframe security blocks):', e);
    }
  };

  // --- TRIGGER IN APP NOTIFICATION ---
  const triggerNotification = (
    title: string, 
    message: string, 
    type: SystemNotification['type']
  ) => {
    const newNotice: SystemNotification = {
      id: 'n_' + Date.now(),
      title,
      message,
      type,
      isRead: false,
      timestamp: new Date().toISOString(),
    };

    setNotifications(prev => {
      const updated = [newNotice, ...prev].slice(0, 25);
      localStorage.setItem('barber_notifications', JSON.stringify(updated));
      return updated;
    });

    playAlertSound(type);

    // Browser platform notification integration (when simulated or urgent)
    if (type === 'urgent' && 'Notification' in window && window.Notification.permission === 'granted') {
      try {
        new window.Notification(title, { body: message });
      } catch (err) {}
    }
  };

  // --- ACTION: REGISTER CUSTOMER ---
  const addCustomer = (custData: Omit<Customer, 'id' | 'totalSpent' | 'createdAt'>) => {
    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const newCust: Customer = {
      ...custData,
      id: 'c_' + Date.now(),
      totalSpent: 0,
      createdAt: localDateStr,
    };

    const updated = [newCust, ...customers];
    setCustomers(updated);
    localStorage.setItem('barber_customers', JSON.stringify(updated));
  };

  // --- ACTION: LOG BILL DIRECT CHECKOUT ---
  const addPayment = (payData: Omit<Payment, 'id' | 'date' | 'time'>) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const newPayment: Payment = {
      ...payData,
      id: 'p_' + Date.now().toString().slice(-6),
      date: dateStr,
      time: timeStr,
    };

    // Update customer spends ledger
    const revisedCustomers = customers.map(c => {
      if (c.id === payData.customerId) {
        return {
          ...c,
          totalSpent: c.totalSpent + payData.totalAmount,
          lastVisit: dateStr,
        };
      }
      return c;
    });

    setCustomers(revisedCustomers);
    localStorage.setItem('barber_customers', JSON.stringify(revisedCustomers));

    const revisedPayments = [newPayment, ...payments];
    setPayments(revisedPayments);
    localStorage.setItem('barber_payments', JSON.stringify(revisedPayments));

    if (isOffline) {
      setSyncPendingCount(prev => prev + 1);
    }
  };

  // --- ACTION: RECORD APPOINTMENT ---
  const addAppointment = (apptData: Omit<Appointment, 'id'>) => {
    const newAppt: Appointment = {
      ...apptData,
      id: 'a_' + Date.now(),
    };

    const updated = [newAppt, ...appointments];
    setAppointments(updated);
    localStorage.setItem('barber_appointments', JSON.stringify(updated));
  };

  // --- ACTION: SWITCH APPOINTIENT STATUS ---
  // If status is flipped to 'completed', we automatically checkout billing in transactions table!
  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    let billedDetails = '';

    const updated = appointments.map(appt => {
      if (appt.id === id) {
        if (status === 'completed' && appt.status !== 'completed') {
          // Trigger dynamic automatic Checkout Payment
          addPayment({
            customerId: appt.customerId,
            customerName: appt.customerName,
            customerPhone: appt.customerPhone,
            serviceNames: [appt.serviceName],
            totalAmount: appt.price,
            paymentMethod: 'Cash', // Default checkout to Cash
            status: 'Paid',
            barberId: appt.barberId,
            barbersName: appt.barbersName,
          });

          billedDetails = `Auto-billed cash receipt of Rs. ${appt.price} filed for ${appt.customerName}.`;
        }
        return { ...appt, status };
      }
      return appt;
    });

    setAppointments(updated);
    localStorage.setItem('barber_appointments', JSON.stringify(updated));

    if (status === 'completed') {
      triggerNotification('Appointment Competed!', billedDetails || 'Service completed successfully.', 'success');
    } else {
      triggerNotification('Schedule Updated', `Appointment set status to: ${status.toUpperCase()}`, 'info');
    }
  };

  // --- ACTION: DELETE APPOINTMENT ---
  const deleteAppointment = (id: string) => {
    const appt = appointments.find(a => a.id === id);
    const updated = appointments.filter(a => a.id !== id);
    setAppointments(updated);
    localStorage.setItem('barber_appointments', JSON.stringify(updated));
    triggerNotification('Appointment Deleted', `Appointment for ${appt?.customerName || 'customer'} has been permanently deleted.`, 'alert');
  };

  // --- ACTION: INSERT SERVICE CATALOG MENU ---
  const addService = (srvData: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...srvData,
      id: 's_' + Date.now(),
    };

    const updated = [...services, newService];
    setServices(updated);
    localStorage.setItem('barber_services', JSON.stringify(updated));
  };

  // --- ACTION: UPDATE SERVICE BILL PRICE ---
  const updateServicePrice = (id: string, price: number) => {
    const updated = services.map(s => {
      if (s.id === id) return { ...s, price };
      return s;
    });
    setServices(updated);
    localStorage.setItem('barber_services', JSON.stringify(updated));
  };

  // --- DISMISS/READ ALL NOTIFICATIONS ---
  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    localStorage.setItem('barber_notifications', JSON.stringify(updated));
    triggerNotification('Alerts Clear', 'All incoming alarm states acknowledged.', 'success');
  };

  // Count unread logs
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
      
      {/* 1. Large Screen Sidebar View */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          userRole={userRole}
          setUserRole={setUserRole}
          isOffline={isOffline}
          setIsOffline={setIsOffline}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          syncPendingCount={syncPendingCount}
        />
      </div>

      {/* 2. Main Content Container Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Sticky Mobile-Responsive Top Bar */}
        <header id="header-bar" className="bg-white dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-205 dark:border-slate-800/80 px-6 py-3.5 flex items-center justify-between shadow-xs shrink-0 z-40 transition-colors">
          <div className="flex items-center space-x-3.5">
            <button
               id="btn-mobile-menu"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
            <h1 className="text-sm font-bold md:text-lg text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
              <span className="text-emerald-500 font-extrabold">👑 Royal Cuts</span>
              <span className="hidden leading-none sm:inline-block border-l border-slate-200 dark:border-slate-800 px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono uppercase tracking-widest">
                CRM Platform
              </span>
            </h1>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Quick sound toggle feedback */}
            <button
              id="btn-toggle-sound"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-850 text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400 rounded-lg cursor-pointer border border-transparent dark:border-slate-800/55"
              title={soundEnabled ? 'Mute micro-beep audio warnings' : 'Enable audio alarm warning triggers'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* In-app Notification Trigger Dropdown Toggle */}
            <div className="relative">
              <button
                id="btn-notification-pane-toggle"
                onClick={() => setShowNotificationPane(!showNotificationPane)}
                className="relative p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 rounded-lg cursor-pointer border border-transparent dark:border-slate-800/55"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping"></span>
                )}
              </button>

              {/* Notification Overlay Popover */}
              {showNotificationPane && (
                <div className="absolute right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-80 sm:w-96 rounded-xl shadow-lg z-50 overflow-hidden text-xs">
                  <div className="p-3.5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
                    <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      ⚠️ Shop Service Notifications ({unreadCount} unread)
                    </span>
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-emerald-550 dark:text-emerald-400 hover:underline cursor-pointer font-bold uppercase"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${!n.isRead ? 'bg-emerald-50/10 dark:bg-emerald-950/5' : ''}`}>
                        <div className="flex justify-between items-start gap-1">
                          <p className="font-bold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                            {n.type === 'success' && '🟢'}
                            {n.type === 'urgent' && '🔴'}
                            {n.type === 'alert' && '⚠️'}
                            {n.title}
                          </p>
                          <span className="text-[9px] text-slate-455 font-mono">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-505 dark:text-slate-400 mt-1 text-[11px] leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="py-6 text-center text-slate-400 italic">
                        No alarms generated.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Offline/Online Mini Toggle view for mobile */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-lg text-[10px] font-mono font-bold">
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-rose-500">OFFLINE</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-bold">ONLINE</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic active notification urgent message strip (glowing effect) */}
        {notifications.length > 0 && !notifications[0].isRead && notifications[0].type === 'urgent' && (
          <div className="bg-rose-600 text-white text-xs px-6 py-2.5 font-bold flex items-center justify-between shadow-md relative z-35 animate-bounce">
            <span className="flex items-center gap-2">
              🚨 <span className="uppercase tracking-widest font-mono text-[10px] bg-rose-800 px-1.5 py-0.5 rounded">Urgent Announcement</span> 
              <span>{notifications[0].title}: {notifications[0].message}</span>
            </span>
            <button
              onClick={() => {
                const refreshed = [...notifications];
                refreshed[0].isRead = true;
                setNotifications(refreshed);
                localStorage.setItem('barber_notifications', JSON.stringify(refreshed));
              }}
              className="text-rose-200 hover:text-white font-mono uppercase text-[10px] cursor-pointer"
            >
              Dismiss alert
            </button>
          </div>
        )}

        {/* Main Tab Rendering Page Outlet with padding constraints */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 bg-slate-50 dark:bg-slate-950/40 text-slate-750 relative overflow-hidden">
          
          {/* Ambient Glassmorphism Glow Highlights */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 glow-blur -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/5 dark:bg-amber-400/5 glow-blur translate-x-1/2 translate-y-1/2 pointer-events-none" />
          
          <div className="h-full max-w-7xl mx-auto space-y-6 relative z-10">
            
            {activeTab === 'dashboard' && (
              <DashboardView
                customers={customers}
                appointments={appointments}
                payments={payments}
                services={services}
                userRole={userRole}
                addPayment={addPayment}
                triggerNotification={triggerNotification}
                isOffline={isOffline}
              />
            )}

            {activeTab === 'appointments' && (
              <AppointmentsView
                appointments={appointments}
                customers={customers}
                services={services}
                addAppointment={addAppointment}
                updateAppointmentStatus={updateAppointmentStatus}
                deleteAppointment={deleteAppointment}
                triggerNotification={triggerNotification}
                userRole={userRole}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersView
                customers={customers}
                payments={payments}
                addCustomer={addCustomer}
                triggerNotification={triggerNotification}
                userRole={userRole}
              />
            )}

            {activeTab === 'services' && (
              <ServicesView
                services={services}
                userRole={userRole}
                addService={addService}
                updateServicePrice={updateServicePrice}
                triggerNotification={triggerNotification}
              />
            )}

            {activeTab === 'reports' && (
              <EarningReportView
                payments={payments}
                userRole={userRole}
                triggerNotification={triggerNotification}
              />
            )}

          </div>
        </main>
      </div>

      {/* 3. Sliding Overlay Navigation Drawer for Mobile Access Devices */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex">
          <div className="animate-in slide-in-from-left duration-250 w-full max-w-sm h-full flex flex-col">
            {/* Header control within drawer */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-205 py-4 px-6 flex justify-between items-center">
              <span className="font-black text-slate-800 dark:text-slate-100 font-display">💈 ROYAL CUTS NAVIGATION</span>
              <button
                id="btn-close-mobile-menu"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-650 bg-slate-50 dark:bg-slate-800 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Injected navigation */}
            <div className="flex-1 bg-white dark:bg-slate-900">
              <Sidebar
                activeTab={activeTab}
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  setMobileMenuOpen(false);
                }}
                userRole={userRole}
                setUserRole={setUserRole}
                isOffline={isOffline}
                setIsOffline={setIsOffline}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                syncPendingCount={syncPendingCount}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Bottom Tab Bar specifically optimized for mobile-only users */}
      <nav id="bottom-tab-bar" className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-2.5 z-40 shadow-lg px-2 text-[10px] font-medium text-slate-500">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`cursor-pointer flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-emerald-500 font-extrabold' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <Grid className="w-4.5 h-4.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`cursor-pointer flex flex-col items-center gap-1 ${activeTab === 'appointments' ? 'text-emerald-500 font-extrabold' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <Calendar className="w-4.5 h-4.5" />
          <span>Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`cursor-pointer flex flex-col items-center gap-1 ${activeTab === 'customers' ? 'text-emerald-500 font-extrabold' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <Users className="w-4.5 h-4.5" />
          <span>Clients</span>
        </button>

        {userRole === 'Admin' && (
          <button
            onClick={() => setActiveTab('reports')}
            className={`cursor-pointer flex flex-col items-center gap-1 ${activeTab === 'reports' ? 'text-emerald-500 font-extrabold' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <DollarSign className="w-4.5 h-4.5" />
            <span>Earnings</span>
          </button>
        )}
      </nav>
    </div>
  );
}

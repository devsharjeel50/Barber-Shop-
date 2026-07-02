import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Check, 
  Trash2, 
  Plus, 
  Send, 
  SlidersHorizontal, 
  Search, 
  X,
  User,
  Scissors,
  DollarSign,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Appointment, Customer, Service } from '../types';
import { exportAppointmentsCSV } from '../utils/export';
import { formatWhatsAppLink, getAppointmentReminderMsg, getUrgentAlertMsg } from '../utils/whatsapp';

interface AppointmentsViewProps {
  appointments: Appointment[];
  customers: Customer[];
  services: Service[];
  addAppointment: (appt: Omit<Appointment, 'id'>) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  deleteAppointment: (id: string) => void;
  triggerNotification: (title: string, message: string, type: 'info' | 'urgent' | 'success' | 'alert') => void;
  userRole: string;
}

export default function AppointmentsView({
  appointments,
  customers,
  services,
  addAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  triggerNotification,
  userRole,
}: AppointmentsViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [barberFilter, setBarberFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formServiceId, setFormServiceId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formBarber, setFormBarber] = useState('u2'); // Samir Barber
  const [formNotes, setFormNotes] = useState('');

  // Reschedule alert states
  const [rescheduleReason, setRescheduleReason] = useState('Stylist offline due to urgent emergency.');

  // Filtering list
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      const matchBarber = barberFilter === 'all' || a.barberId === barberFilter;
      const matchSearch = a.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchBarber && matchSearch;
    });
  }, [appointments, statusFilter, barberFilter, searchTerm]);

  // Handle book submission
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerId || !formServiceId || !formDate || !formTime) {
      alert('Fill all form fields first!');
      return;
    }

    const customerObj = customers.find(c => c.id === formCustomerId);
    const serviceObj = services.find(s => s.id === formServiceId);
    if (!customerObj || !serviceObj) return;

    const barbers: Record<string, string> = {
      'u1': 'Owner Admin',
      'u2': 'Samir Barber',
      'u3': 'Haris Stylist',
    };

    const combinedDateTime = `${formDate}T${formTime}:00Z`;

    addAppointment({
      customerId: customerObj.id,
      customerName: customerObj.name,
      customerPhone: customerObj.phone,
      serviceId: serviceObj.id,
      serviceName: serviceObj.name,
      price: serviceObj.price,
      dateTime: combinedDateTime,
      status: 'pending',
      barberId: formBarber,
      barbersName: barbers[formBarber] || 'Samir Barber',
      notes: formNotes,
    });

    triggerNotification(
      'Appointment Booked',
      `Booking for ${customerObj.name} Scheduled successfully.`,
      'success'
    );

    // Reset Form
    setFormCustomerId('');
    setFormServiceId('');
    setFormDate('');
    setFormTime('');
    setFormNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* View Header with scheduling reports */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5.5 h-5.5 text-emerald-500" />
            Salon Appointment Calendar & Schedule
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            View salon booking grids, toggle status confirmations, and generate rapid communication alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export CSV Schedules */}
          <button
            id="btn-export-appointments"
            onClick={() => exportAppointmentsCSV(appointments)}
            className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-201 text-xs font-semibold py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Schedule
          </button>

          <button
            id="btn-open-booking-modal"
            onClick={() => setShowAddModal(true)}
            className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/10 active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Book Barber Slot
          </button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full md:w-1/3">
          <Search className="absolute inset-y-0 left-3 mt-2.5 w-4 h-4 text-slate-450" />
          <input
            id="search-appointments-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search bookings by client, service..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-xl focus:outline-none"
          />
        </div>

        {/* Status Tab buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all border ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {st === 'all' ? 'All Schedules' : st}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

        {/* Barber Filter */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <select
            id="barber-filter-select"
            value={barberFilter}
            onChange={(e) => setBarberFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="all">Every Stylist</option>
            <option value="u2">Samir Barber Only</option>
            <option value="u3">Haris Stylist Only</option>
          </select>
        </div>
      </div>

      {/* Appointments List Render */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAppointments.map((appt) => {
          // Generate customized WhatsApp texts
          const reminderMsg = getAppointmentReminderMsg(appt);
          const reminderLink = formatWhatsAppLink(appt.customerPhone, reminderMsg);

          const rescheduleMsg = getUrgentAlertMsg(appt, rescheduleReason);
          const rescheduleLink = formatWhatsAppLink(appt.customerPhone, rescheduleMsg);

          return (
            <div
              key={appt.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-5 hover:shadow-md flex flex-col justify-between space-y-4 ${
                appt.status === 'completed'
                  ? 'border-emerald-100 dark:border-emerald-900/40 bg-emerald-500/[0.01]'
                  : appt.status === 'cancelled'
                  ? 'border-rose-100 dark:border-rose-900/40 opacity-75'
                  : 'border-slate-205 dark:border-slate-800'
              }`}
            >
              {/* Card top row */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
                      {appt.customerName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {appt.customerName}
                      </h4>
                      <p className="text-[10px] text-slate-405 font-mono">+{appt.customerPhone}</p>
                    </div>
                  </div>

                  {/* Status Badges & Delete */}
                  <div className="flex items-center gap-1.5">
                    {deletingId === appt.id ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-xl border border-rose-200 dark:border-rose-900/50 animate-pulse">
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Delete?</span>
                        <button
                          onClick={() => {
                            deleteAppointment(appt.id);
                            setDeletingId(null);
                            triggerNotification('Appointment Deleted', `Deleted booking for ${appt.customerName}`, 'success');
                          }}
                          className="text-[10px] font-bold text-white bg-rose-650 hover:bg-rose-700 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          appt.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                            : appt.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                            : appt.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-450'
                        }`}>
                          {appt.status}
                        </span>
                        <button
                          onClick={() => setDeletingId(appt.id)}
                          className="cursor-pointer p-1 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Delete Appointment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Service Details */}
                <div className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Service</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">💈 {appt.serviceName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Stylist</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">👨‍🦱 {appt.barbersName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 font-medium">Timing</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ⏱️ {new Date(appt.dateTime).toLocaleString('en-US', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-800 dark:text-slate-200 border-t border-dashed border-slate-200 dark:border-slate-700">
                    <span className="font-medium text-slate-550">Bill price</span>
                    <span className="font-black text-sm">Rs. {appt.price}</span>
                  </div>
                </div>

                {appt.notes && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic leading-relaxed">
                    📝 Note: &ldquo;{appt.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                {/* Status Toggle buttons if pending/confirmed */}
                {(appt.status === 'pending' || appt.status === 'confirmed') && (
                  <div className="grid grid-cols-2 gap-2">
                    {appt.status === 'pending' && (
                      <button
                        onClick={() => updateAppointmentStatus(appt.id, 'confirmed')}
                        className="cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/45 dark:text-blue-300 py-1.5 rounded-lg text-xs font-semibold text-center"
                      >
                        Confirm Slot ✔️
                      </button>
                    )}
                    {(appt.status === 'confirmed' || appt.status === 'pending') && (
                      <button
                        onClick={() => updateAppointmentStatus(appt.id, 'completed')}
                        className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700 py-1.5 rounded-lg text-xs font-bold text-center"
                      >
                        Check & Bill 👍
                      </button>
                    )}
                    <button
                      onClick={() => updateAppointmentStatus(appt.id, 'cancelled')}
                      className="cursor-pointer bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/45 dark:text-rose-350 py-1.5 rounded-lg text-xs font-semibold text-center"
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}

                {/* WhatsApp Integration Row */}
                <div className="flex items-center gap-2">
                  <a
                    href={reminderLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-300 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1 transition-all border border-emerald-100/40 text-[10px]"
                    title="Send WhatsApp appointment prompt reminder to customer"
                  >
                    <Send className="w-3 h-3 text-emerald-500 shrink-0" />
                    Appt Reminder WA
                  </a>

                  {appt.status === 'pending' && (
                    <a
                      href={rescheduleLink}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1 transition-all border border-amber-100/40 text-[10px]"
                      title="Send WhatsApp alert requesting user to reschedule slot"
                    >
                      <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                      Delay/Change Alert
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredAppointments.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No Barber appointments found matching the selected filters.
          </div>
        )}
      </div>

      {/* Booking Add-Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-xl overflow-hidden transition-all animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/15">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-display">
                <Calendar className="w-5 h-5 text-emerald-500" />
                Book New Stylist Appointment
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 bg-slate-150 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="p-6 space-y-4 text-xs">
                {/* Select Registered Customer */}
                <div className="space-y-1">
                  <label htmlFor="appt-cust-select" className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">
                    Select Customer Record *
                  </label>
                  <select
                    id="appt-cust-select"
                    required
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Select Active Client --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (+{c.phone})</option>
                    ))}
                  </select>
                </div>

                {/* Select Service Type */}
                <div className="space-y-1">
                  <label htmlFor="appt-service-select" className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">
                    Required Barber Service *
                  </label>
                  <select
                    id="appt-service-select"
                    required
                    value={formServiceId}
                    onChange={(e) => setFormServiceId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Choose Cut / Combos --</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} - Rs. {s.price} ({s.duration} mins)</option>
                    ))}
                  </select>
                </div>

                {/* Date and Time Fields row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="appt-date-input" className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">
                      Booking Date *
                    </label>
                    <input
                      id="appt-date-input"
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="appt-time-input" className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">
                      Hour *
                    </label>
                    <input
                      id="appt-time-input"
                      type="time"
                      required
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                {/* Select Barber Stylist */}
                <div className="space-y-1">
                  <label htmlFor="appt-barber-select" className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">
                    Assign Stylist/Barber
                  </label>
                  <select
                    id="appt-barber-select"
                    value={formBarber}
                    onChange={(e) => setFormBarber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl"
                  >
                    <option value="u2">Samir Barber (Masters Grade)</option>
                    <option value="u3">Haris Stylist (Hair coloring specialist)</option>
                    <option value="u1">Owner Admin</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label htmlFor="appt-notes-input" className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">
                    Stylist notes
                  </label>
                  <input
                    id="appt-notes-input"
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="E.g. Wants beard shape treatment oil"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/15 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="cursor-pointer bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold py-2 px-4 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-add-booking"
                  className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-4 rounded-xl active:scale-95 transition-transform"
                >
                  Secure Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

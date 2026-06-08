import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Send, 
  Download, 
  UserPlus, 
  CreditCard, 
  Check, 
  PhoneCall, 
  X,
  FileSpreadsheet,
  Settings,
  MessageSquare
} from 'lucide-react';
import { Customer, Payment } from '../types';
import { exportCustomersCSV } from '../utils/export';
import { formatWhatsAppLink, getGeneralPromoMsg } from '../utils/whatsapp';

interface CustomersViewProps {
  customers: Customer[];
  payments: Payment[];
  addCustomer: (cust: Omit<Customer, 'id' | 'totalSpent' | 'createdAt'>) => void;
  triggerNotification: (title: string, message: string, type: 'info' | 'urgent' | 'success' | 'alert') => void;
  userRole: string;
}

export default function CustomersView({
  customers,
  payments,
  addCustomer,
  triggerNotification,
  userRole,
}: CustomersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Filtering Customer Roster
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchName = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPhone = c.phone.includes(searchTerm);
      const matchEmail = (c.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchName || matchPhone || matchEmail;
    });
  }, [customers, searchTerm]);

  // Submit New Customer Registration
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Name and Phone are state requirements!');
      return;
    }

    addCustomer({
      name: newName,
      phone: newPhone.replace(/\s+/g, ''),
      email: newEmail,
      notes: newNotes,
    });

    triggerNotification(
      'New Customer Added',
      `${newName} registered with database ledger securely.`,
      'success'
    );

    // Reset Form
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewNotes('');
    setShowAddModal(false);
  };

  // Resolve Customer Visits History
  const getCustomerVisits = (custId: string) => {
    return payments.filter(p => p.customerId === custId);
  };

  return (
    <div className="space-y-6">
      {/* Title Header and Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5.5 h-5.5 text-emerald-500" />
            Customer ledger & Outreach Engine
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Maintain visitor records, track styling habits and conduct customizable WhatsApp reminders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Excel Export Button */}
          <button
            id="btn-export-customers"
            onClick={() => exportCustomersCSV(customers)}
            className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
            title="Download Excel Compatible CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Excel
          </button>

          {/* New Registration Button */}
          <button
            id="btn-register-customer-modal"
            onClick={() => setShowAddModal(true)}
            className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/10 active:scale-95 transition-transform"
          >
            <UserPlus className="w-4 h-4" />
            Add New Customer
          </button>
        </div>
      </div>

      {/* Roster Search Filters */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          id="search-customers-input"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by customer name, styling preference, or mobile phone..."
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
        />
      </div>

      {/* Customers Data Table Ledger Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/55 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] uppercase font-bold font-mono tracking-wider">
                <th className="py-4 px-6">Customer Particulars</th>
                <th className="py-4 px-6">Phone Number</th>
                <th className="py-4 px-6">Outstanding spends</th>
                <th className="py-4 px-6">Last visit logged</th>
                <th className="py-4 px-6 text-center">WhatsApp Messaging</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {filteredCustomers.map((cust) => {
                const promoMsg = getGeneralPromoMsg(cust);
                const waPromoLink = formatWhatsAppLink(cust.phone, promoMsg);

                return (
                  <tr key={cust.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    {/* Customer Main Card */}
                    <td className="py-4.5 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl flex items-center justify-center text-sm shadow-xs uppercase">
                          {cust.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{cust.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">{cust.email || 'No email saved'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone Column */}
                    <td className="py-4.5 px-6 font-mono text-slate-600 dark:text-slate-400">
                      +{cust.phone}
                    </td>

                    {/* Spend Value */}
                    <td className="py-4.5 px-6 font-bold text-slate-800 dark:text-slate-200 font-mono">
                      Rs. {cust.totalSpent}
                    </td>

                    {/* Last Visited Date */}
                    <td className="py-4.5 px-6 text-slate-500 dark:text-slate-400">
                      {cust.lastVisit ? (
                        <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md py-0.5 px-2 font-medium">
                          📅 {cust.lastVisit}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No visit data</span>
                      )}
                    </td>

                    {/* WhatsApp Action */}
                    <td className="py-4.5 px-6">
                      <div className="flex justify-center">
                        <a
                          href={waPromoLink}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-300 py-1.5 px-3 rounded-lg font-bold flex items-center gap-1 shadow-xs border border-emerald-100/50 transition-all text-[11px]"
                          title="Generate Discount Offer WhatsApp Message"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          Promo coupon
                        </a>
                      </div>
                    </td>

                    {/* Detail Actions */}
                    <td className="py-4.5 px-6 text-right">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="cursor-pointer text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-350 font-bold hover:underline"
                      >
                        View Folder 📂
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    No customers found matching search terms.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Customer Folder Detail View (Modal) */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-xl overflow-hidden my-8">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/15">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 text-white font-extrabold rounded-xl flex items-center justify-center text-base uppercase">
                  {selectedCustomer.name.substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-xs text-slate-400">Registered on {selectedCustomer.createdAt}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-120 overflow-y-auto">
              {/* Core Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100">
                  <span className="text-slate-400 uppercase tracking-widest font-mono text-[9px]">Mobile Phone</span>
                  <p className="font-mono text-slate-700 dark:text-slate-200 text-sm font-bold mt-1">+{selectedCustomer.phone}</p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100">
                  <span className="text-slate-400 uppercase tracking-widest font-mono text-[9px]">Grand Ledger</span>
                  <p className="font-mono text-emerald-600 dark:text-emerald-400 text-sm font-bold mt-1">Rs. {selectedCustomer.totalSpent}</p>
                </div>
              </div>

              {/* Preferences & Notes Section */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">
                  Stylist Instructions / Hair Preferences
                </h4>
                <div className="p-4 bg-amber-500/5 dark:bg-amber-950/10 text-amber-900 dark:text-amber-300 rounded-xl border border-amber-500/10 text-xs leading-relaxed italic">
                  &ldquo;{selectedCustomer.notes || 'No custom preferences recorded yet. Keep check of comments during upcoming haircuts.'}&rdquo;
                </div>
              </div>

              {/* Render Payment logs specifically for this customer */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">
                  Transaction Receipts History
                </h4>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {getCustomerVisits(selectedCustomer.id).map(visit => (
                    <div key={visit.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-200">
                          {visit.serviceNames.join(' + ')}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Invoice #{visit.id} • {visit.date} • {visit.time}
                        </p>
                      </div>
                      <span className="font-black text-slate-700 dark:text-slate-200 font-mono">
                        Rs. {visit.totalAmount}
                      </span>
                    </div>
                  ))}

                  {getCustomerVisits(selectedCustomer.id).length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">
                      No matching payments found for this customer.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/10 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="cursor-pointer bg-slate-850 text-white hover:bg-slate-800 px-4 py-2 text-xs font-semibold rounded-xl"
              >
                Close Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-xl overflow-hidden transition-all animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/15">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-display">
                <UserPlus className="w-5 h-5 text-emerald-500" />
                Register New Customer Ledger
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
                {/* Name */}
                <div className="space-y-1">
                  <label htmlFor="modal-cust-name" className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">
                    Full Name *
                  </label>
                  <input
                    id="modal-cust-name"
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter customer first & last name"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label htmlFor="modal-cust-phone" className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">
                    Mobile Number (With Country Code, e.g. 919876543210) *
                  </label>
                  <input
                    id="modal-cust-phone"
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="E.g. 923001234567"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400">Required for direct WhatsApp reminders.</p>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label htmlFor="modal-cust-email" className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">
                    Email ID (Optional)
                  </label>
                  <input
                    id="modal-cust-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="E.g. customer@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Styling preferences */}
                <div className="space-y-1">
                  <label htmlFor="modal-cust-notes" className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">
                    Premium Cut Styling instructions / notes
                  </label>
                  <textarea
                    id="modal-cust-notes"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Mention custom haircut specifications, clipper lengths or sensitivities"
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/15 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="cursor-pointer bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2 px-4 rounded-xl text-xs hover:bg-slate-35"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-add-customer"
                  className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-4 rounded-xl text-xs active:scale-95 transition-transform"
                >
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

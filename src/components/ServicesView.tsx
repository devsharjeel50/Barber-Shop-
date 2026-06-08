import React, { useState } from 'react';
import { Scissors, Plus, X, Pencil, DollarSign, Clock, ShieldAlert } from 'lucide-react';
import { Service, UserRole } from '../types';

interface ServicesViewProps {
  services: Service[];
  userRole: UserRole;
  addService: (srv: Omit<Service, 'id'>) => void;
  updateServicePrice: (id: string, price: number) => void;
  triggerNotification: (title: string, message: string, type: 'info' | 'urgent' | 'success' | 'alert') => void;
}

export default function ServicesView({
  services,
  userRole,
  addService,
  updateServicePrice,
  triggerNotification,
}: ServicesViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // Form states
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDuration, setNewDuration] = useState('30');
  const [newCategory, setNewCategory] = useState<'Haircut' | 'Beard' | 'Treatments' | 'Combo' | 'Other'>('Haircut');

  // RBAC Privileges Checking
  const isReadOnly = userRole !== 'Admin';

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      alert('Only Admin/Owner can modify the premium service list catalog!');
      return;
    }

    if (!newName.trim() || !newPrice.trim()) {
      alert('Fill catalog fields!');
      return;
    }

    addService({
      name: newName,
      price: Number(newPrice),
      duration: Number(newDuration),
      category: newCategory,
    });

    triggerNotification(
      'Service Menu Added',
      `Premium service "${newName}" has been listed in standard catalog successfully.`,
      'success'
    );

    // Reset
    setNewName('');
    setNewPrice('');
    setNewDuration('30');
    setShowAddModal(false);
  };

  const handleStartEdit = (srv: Service) => {
    if (isReadOnly) {
      triggerNotification('Access Denied', 'Your current role Receptionist is restricted from modifying premium menu prices.', 'alert');
      return;
    }
    setEditingServiceId(srv.id);
    setTempPrice(String(srv.price));
  };

  const handleSavePrice = (id: string) => {
    const parsedPrice = Number(tempPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Enter valid catalog price!');
      return;
    }

    updateServicePrice(id, parsedPrice);
    triggerNotification('Price Modified', 'Pricing table modified in direct database sync.', 'info');
    setEditingServiceId(null);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Scissors className="w-5.5 h-5.5 text-emerald-500" />
            Barber Shop Premium Services Menu
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Admin/Owner can adjust charges, configure combos, or add active grooming services.
          </p>
        </div>

        {!isReadOnly && (
          <button
            id="btn-open-service-modal"
            onClick={() => setShowAddModal(true)}
            className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/10 active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Add To Catalog
          </button>
        )}
      </div>

      {/* Security alert for receptionist view */}
      {isReadOnly && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/25 rounded-2xl border border-amber-250 text-amber-800 dark:text-amber-400 flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-650 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Role-Based Restriction Active (Receptionist Access Mode)</p>
            <p className="text-slate-500 dark:text-amber-305/70 mt-0.5">
              You possess search capabilities regarding services but cannot edit pricing catalogs or add new services. Please request the Owner for adjustments.
            </p>
          </div>
        </div>
      )}

      {/* Services Grid Catalog displaying available items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {services.map((srv) => {
          const isEditing = editingServiceId === srv.id;

          return (
            <div key={srv.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:translate-y-[-1px] transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    srv.category === 'Combo'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                      : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                  }`}>
                    {srv.category}
                  </span>
                  
                  <span className="text-xs font-mono font-bold text-slate-400">⏱️ {srv.duration} mins</span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display">
                    {srv.name}
                  </h4>
                  <p className="text-[11px] text-slate-450 mt-1 lines-clamp-2">
                    Premium professional treatment styled explicitly with standard tools.
                  </p>
                </div>
              </div>

              {/* Price Editor Row */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between gap-1">
                <div className="flex items-center">
                  <span className="text-emerald-600 text-sm font-mono font-black font-semibold">
                    Rs. 
                  </span>
                  {isEditing ? (
                    <input
                      id={`edit-price-input-${srv.id}`}
                      type="number"
                      value={tempPrice}
                      onChange={(e) => setTempPrice(e.target.value)}
                      className="w-20 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-emerald-500 rounded font-mono text-sm text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  ) : (
                    <span className="text-base font-black text-slate-800 dark:text-slate-100 font-mono ml-0.5">
                      {srv.price}
                    </span>
                  )}
                </div>

                {!isReadOnly && (
                  <div className="flex items-center gap-1.5">
                    {isEditing ? (
                      <button
                        onClick={() => handleSavePrice(srv.id)}
                        className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white rounded px-2 py-1 text-[10px] font-bold"
                      >
                        Save Price
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(srv)}
                        className="cursor-pointer p-1.5 bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800/70 dark:hover:bg-slate-700 hover:text-emerald-600 dark:text-slate-450 rounded-lg transition-colors"
                        title="Edit Price"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Catalog Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/15">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-display">
                <Scissors className="w-5 h-5 text-emerald-500" />
                List Premium Service In Catalog
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 bg-slate-150 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="p-6 space-y-4 text-xs">
                {/* Service Name */}
                <div className="space-y-1">
                  <label htmlFor="srv-name-input" className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">
                    Service / Combo Title *
                  </label>
                  <input
                    id="srv-name-input"
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="E.g. Hot Towel Facial & Beard combo"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Price */}
                  <div className="space-y-1">
                    <label htmlFor="srv-price-input" className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">
                      Standard Price (INR/PKR) *
                    </label>
                    <input
                      id="srv-price-input"
                      type="number"
                      required
                      min={10}
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="E.g. 350"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  {/* Duration */}
                  <div className="space-y-1">
                    <label htmlFor="srv-duration-input" className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">
                      Duration (Minutes)
                    </label>
                    <input
                      id="srv-duration-input"
                      type="number"
                      required
                      min={5}
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      placeholder="30"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                {/* Category Selection options */}
                <div className="space-y-1">
                  <label htmlFor="srv-category-select" className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">
                    Category Tag
                  </label>
                  <select
                    id="srv-category-select"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="Haircut">💇‍♂️ Haircut</option>
                    <option value="Beard">🧔 Beard Grooming</option>
                    <option value="Treatments">🧴 Facial Treatments</option>
                    <option value="Combo">🌟 Special Salon Combo</option>
                    <option value="Other">🛠️ General Other services</option>
                  </select>
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
                  id="btn-confirm-add-service"
                  className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-4 rounded-xl active:scale-95 transition-transform"
                >
                  File To Menu Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  Filter, 
  Download, 
  Printer, 
  CreditCard, 
  ChevronRight, 
  CheckCircle, 
  Info,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Payment, UserRole } from '../types';
import { exportPaymentsCSV } from '../utils/export';
import { formatWhatsAppLink, getPaymentReceiptMsg } from '../utils/whatsapp';

interface EarningReportViewProps {
  payments: Payment[];
  userRole: UserRole;
  triggerNotification: (title: string, message: string, type: 'info' | 'urgent' | 'success' | 'alert') => void;
}

export default function EarningReportView({
  payments,
  userRole,
  triggerNotification,
}: EarningReportViewProps) {
  // Generate past 12 months starting from July 2026 backwards
  const monthsList = useMemo(() => {
    const list = [];
    const baseDate = new Date('2026-07-01'); // centered around current app date context
    let year = baseDate.getFullYear();
    let month = baseDate.getMonth();

    for (let i = 0; i < 12; i++) {
      const displayMonth = month + 1;
      const monthStr = displayMonth < 10 ? `0${displayMonth}` : `${displayMonth}`;
      const value = `${year}-${monthStr}`;
      const label = new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
      list.push({ value, label });
      
      month--;
      if (month < 0) {
        month = 11;
        year--;
      }
    }
    return list;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(monthsList[0]?.value || '2026-07');
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // Authenticate Admin access (defensive RBAC checking)
  if (userRole !== 'Admin') {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-950 max-w-lg mx-auto mt-10">
        <Info className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">
          🔒 Unauthorized Access Level
        </h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Your active user account role ({userRole}) does not possess adequate permissions to read financial sheets, ledger statements or monthly profit-loss reporting tables.
        </p>
      </div>
    );
  }

  // Filter Payments by selected month
  const filteredPayments = useMemo(() => {
    return payments.filter(p => p.date.startsWith(selectedMonth));
  }, [payments, selectedMonth]);

  // Compute Metrics for the report
  const reportStats = useMemo(() => {
    const totalRev = filteredPayments.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const volume = filteredPayments.length;
    const avgTicket = volume > 0 ? Math.round(totalRev / volume) : 0;

    // Payment Methods Breakdown
    let cash = 0;
    let card = 0;
    let online = 0;

    filteredPayments.forEach(p => {
      if (p.paymentMethod === 'Cash') cash += p.totalAmount;
      else if (p.paymentMethod === 'Card') card += p.totalAmount;
      else if (p.paymentMethod === 'UPI/Online') online += p.totalAmount;
    });

    return {
      totalRev,
      volume,
      avgTicket,
      cash,
      card,
      online,
    };
  }, [filteredPayments]);

  // Compute month-over-month growth rate dynamically
  const growthStats = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    let year = parseInt(yearStr);
    let month = parseInt(monthStr); // 1-indexed

    // Decrement month to get previous month
    month--;
    if (month === 0) {
      month = 12;
      year--;
    }
    const prevMonthStr = `${year}-${month < 10 ? '0' + month : month}`;

    const currentMonthRev = reportStats.totalRev;
    const prevMonthPayments = payments.filter(p => p.date.startsWith(prevMonthStr));
    const prevMonthRev = prevMonthPayments.reduce((acc, curr) => acc + curr.totalAmount, 0);

    let percentageChange = 0;
    let isPositive = true;
    let label = '';

    if (prevMonthRev === 0) {
      if (currentMonthRev === 0) {
        percentageChange = 0;
        isPositive = true;
        label = '0% change';
      } else {
        percentageChange = 100;
        isPositive = true;
        label = 'New month peak (+100%)';
      }
    } else {
      const change = ((currentMonthRev - prevMonthRev) / prevMonthRev) * 100;
      percentageChange = Math.abs(Number(change.toFixed(1)));
      isPositive = change >= 0;
      label = `${isPositive ? '+' : '-'}${percentageChange}% vs previous month`;
    }

    return {
      prevMonthRev,
      percentageChange,
      isPositive,
      label,
    };
  }, [selectedMonth, reportStats.totalRev, payments]);

  // Compute payment method percentages
  const methodPercentages = useMemo(() => {
    const total = reportStats.totalRev;
    if (total === 0) {
      return { cashPct: 0, cardPct: 0, onlinePct: 0 };
    }
    return {
      cashPct: Math.round((reportStats.cash / total) * 100),
      cardPct: Math.round((reportStats.card / total) * 100),
      onlinePct: Math.round((reportStats.online / total) * 100),
    };
  }, [reportStats]);

  const handlePrintReceipt = (receipt: Payment) => {
    triggerNotification('Receipt Generated', `Printing Invoice summary receipt #${receipt.id}...`, 'info');
    // Simulated print block
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice Receipt #${receipt.id}</title>
            <style>
              body { font-family: 'Courier New', monospace; padding: 30px; line-height: 1.5; color: #333; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h2 { margin: 5px 0; letter-spacing: 2px; }
              .divider { border-bottom: 2px dashed #333; margin: 15px 0; }
              .row { display: flex; justify-content: space-between; margin: 5px 0; }
              .total { font-size: 18px; font-weight: bold; }
              .footer { text-align: center; margin-top: 40px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>💈 ROYAL CUTS 💈</h2>
              <p>Premium Barber Salon & Styling Studio</p>
              <p>Phone: +${receipt.customerPhone}</p>
            </div>
            <div class="divider"></div>
            <div class="row"><span>Invoice ID:</span><span>#${receipt.id}</span></div>
            <div class="row"><span>Date/Time:</span><span>${receipt.date} ${receipt.time}</span></div>
            <div class="row"><span>Customer:</span><span>${receipt.customerName}</span></div>
            <div class="row"><span>Stylist Barber:</span><span>${receipt.barbersName}</span></div>
            <div class="divider"></div>
            <h3>Rendered Services:</h3>
            ${receipt.serviceNames.map(s => `<div class="row"><span>- ${s}</span><span>Included</span></div>`).join('')}
            <div class="divider"></div>
            <div class="row total"><span>GRAND TOTAL PAID:</span><span>Rs. ${receipt.totalAmount}</span></div>
            <div class="row"><span>Mode:</span><span>${receipt.paymentMethod}</span></div>
            <div class="divider"></div>
            <div class="footer">
              <p>Thank you for your visit!</p>
              <p>Loved our treatment? Review us on Maps! ⭐⭐⭐⭐⭐</p>
              <p>Printed on ${new Date().toLocaleString()}</p>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title block with Export Options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5.5 h-5.5 text-emerald-500" />
            Monthly Balance Sheets & Earning Reports
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Compare monthly sales progress, evaluate payment channels, generate cashbook files, and print physical customer invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Select Month and Year Filter */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 border border-slate-200 dark:border-slate-705 rounded-xl text-xs gap-1">
            <Filter className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <select
              id="report-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none text-slate-700 dark:text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              {monthsList.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-export-reports"
            onClick={() => exportPaymentsCSV(filteredPayments)}
            className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/10 transition-transform active:scale-95"
            title="Download CSV report of the active month"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            Export Monthly Excel
          </button>
        </div>
      </div>

      {/* KPI Cards section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Total Monthly Earnings
          </p>
          <p className="text-3xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1">
            Rs. {reportStats.totalRev}
          </p>
          <div className={`flex items-center gap-1 text-xs font-bold mt-2 ${
            growthStats.percentageChange === 0
              ? 'text-slate-400'
              : growthStats.isPositive 
              ? 'text-emerald-550 dark:text-emerald-400' 
              : 'text-rose-500 dark:text-rose-450'
          }`}>
            {growthStats.isPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{growthStats.label}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Client visits completed
          </p>
          <p className="text-3xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1">
            {reportStats.volume}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-505 mt-2.5">
            Average Rs. {reportStats.avgTicket} per ticket spend
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Payment Methods Breakdown
          </p>
          <div className="space-y-3 mt-2.5">
            {/* Cash */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-medium mb-1">
                <span className="text-slate-450 text-[11px] flex items-center gap-1">💵 Cash:</span>
                <span className="text-slate-755 dark:text-slate-200 font-bold">
                  Rs. {reportStats.cash} <span className="text-slate-400 font-normal text-[10px]">({methodPercentages.cashPct}%)</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${methodPercentages.cashPct}%` }}
                />
              </div>
            </div>

            {/* Card */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-medium mb-1">
                <span className="text-slate-455 text-[11px] flex items-center gap-1">💳 Card:</span>
                <span className="text-slate-755 dark:text-slate-200 font-bold">
                  Rs. {reportStats.card} <span className="text-slate-400 font-normal text-[10px]">({methodPercentages.cardPct}%)</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${methodPercentages.cardPct}%` }}
                />
              </div>
            </div>

            {/* UPI/Online */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-medium mb-1">
                <span className="text-slate-455 text-[11px] flex items-center gap-1">📱 UPI/Online:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Rs. {reportStats.online} <span className="text-slate-400 font-normal text-[10px]">({methodPercentages.onlinePct}%)</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${methodPercentages.onlinePct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout containing payments records */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-display">
            Invoiced Transaction Books ({new Date(selectedMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })})
          </h3>
          <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-150">
            {filteredPayments.length} invoices registered
          </span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-slate-950/15 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 font-bold font-mono uppercase tracking-widest">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Services</th>
                <th className="py-4 px-6 font-mono">Date & Time</th>
                <th className="py-4 px-6 font-mono">Payment Mode</th>
                <th className="py-4 px-6 text-right">Invoice Sum</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredPayments.map(p => {
                const waTxt = getPaymentReceiptMsg(p);
                const waLink = formatWhatsAppLink(p.customerPhone, waTxt);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 px-6 font-mono text-slate-400 font-bold">#{p.id}</td>
                    <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-200">{p.customerName}</td>
                    <td className="py-4 px-6 max-w-xs truncate text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {p.serviceNames.join(' + ')}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-500 dark:text-slate-400">{p.date} {p.time}</td>
                    <td className="py-4 px-6">
                      <span className="py-0.5 px-2 rounded-md bg-slate-105 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-650 dark:text-slate-300">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-black font-mono text-slate-850 dark:text-slate-100">
                      Rs. {p.totalAmount}
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5 flex justify-end">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-300 py-1 px-2 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-all"
                        title="Share Digital Bill Invoice directly via WhatsApp"
                      >
                        Share Bill 📲
                      </a>
                      <button
                        onClick={() => handlePrintReceipt(p)}
                        className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 py-1 px-2 rounded-lg text-[10px] font-bold inline-flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3 text-slate-400" /> Print
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    No transactions reported for the selected month cycle.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

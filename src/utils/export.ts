import { Customer, Appointment, Payment } from '../types';

/**
 * Utility to convert an array of objects/records to a CSV format and trigger user download.
 * Compatible with Microsoft Excel.
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  headers: { key: keyof T; label: string }[],
  fileName: string
) {
  if (data.length === 0) {
    alert('No data to export.');
    return;
  }

  // Generate CSV Header
  const headerRow = headers.map(h => `"${String(h.label).replace(/"/g, '""')}"`).join(',');

  // Generate CSV Rows
  const rows = data.map(item => {
    return headers
      .map(h => {
        const val = item[h.key];
        const formattedVal = val === undefined || val === null ? '' : String(val);
        // Escape quotes to prevent CSV breakdown
        return `"${formattedVal.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
      })
      .join(',');
  });

  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\n'); // Prepend BOM for UTF-8 Support in Excel

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportCustomersCSV(customers: Customer[]) {
  const headers: { key: keyof Customer; label: string }[] = [
    { key: 'name', label: 'Customer Name' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'email', label: 'Email Address' },
    { key: 'totalSpent', label: 'Total Sales (INR / PKR)' },
    { key: 'lastVisit', label: 'Last Visit Date' },
    { key: 'notes', label: 'Notes / Preferences' },
    { key: 'createdAt', label: 'Registered Date' },
  ];
  exportToCSV(customers, headers, `barber_customers_${new Date().toISOString().split('T')[0]}`);
}

export function exportAppointmentsCSV(appointments: Appointment[]) {
  const headers: { key: keyof Appointment; label: string }[] = [
    { key: 'customerName', label: 'Customer' },
    { key: 'customerPhone', label: 'Phone' },
    { key: 'serviceName', label: 'Service' },
    { key: 'dateTime', label: 'Appointment Time' },
    { key: 'barbersName', label: 'Staff Barber' },
    { key: 'price', label: 'Price' },
    { key: 'status', label: 'Booking Status' },
    { key: 'notes', label: 'Special Instructions' },
  ];
  exportToCSV(appointments, headers, `barber_appointments_${new Date().toISOString().split('T')[0]}`);
}

export function exportPaymentsCSV(payments: Payment[]) {
  const headers: { key: keyof Payment; label: string }[] = [
    { key: 'id', label: 'Invoice ID' },
    { key: 'customerName', label: 'Customer' },
    { key: 'customerPhone', label: 'Customer Phone' },
    { key: 'serviceNames', label: 'Services Rendered' },
    { key: 'totalAmount', label: 'Paid Amount' },
    { key: 'paymentMethod', label: 'Payment Mode' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    { key: 'barbersName', label: 'Staff Serviced' },
  ];

  // We need to pre-format array-based serviceNames for easier reading in CSV
  const preppedData = payments.map(p => ({
    ...p,
    serviceNames: p.serviceNames.join(' + '),
  }));

  exportToCSV(preppedData, headers, `barber_payments_${new Date().toISOString().split('T')[0]}`);
}

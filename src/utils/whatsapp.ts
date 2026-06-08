import { Appointment, Customer, Payment } from '../types';

/**
 * Universal utility to construct a WhatsApp send link.
 * Automatically formats local numbers if they are missing regional codes (defaults to Pakistan/India prefix if reasonable,
 * but handles pre-formatted numbers).
 */
export function formatWhatsAppLink(phone: string, message: string): string {
  // Clean phone number (leave only digits)
  let cleaned = phone.replace(/\D/g, '');
  
  // If phone is simple local (starting with 0, e.g. 03001234567), we can transform to 92 or 91
  // By default we assume the mock country codes provided. If they already have a country prefix (like 92 or 91), use directly
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    // E.g. Pakistan 0300 -> 92300
    cleaned = '92' + cleaned.slice(1);
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    // E.g. India standard local has 10 digits
    cleaned = '91' + cleaned;
  }
  
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encodedText}`;
}

export function getAppointmentReminderMsg(appt: Appointment): string {
  const dateFormatted = new Date(appt.dateTime).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  
  return `Hello *${appt.customerName}*! 👋 

This is a friendly reminder for your upcoming appointment at *Barber Shop*:
💈 *Service*: ${appt.serviceName}
📅 *Date & Time*: ${dateFormatted}
💇‍♂️ *Stylist*: ${appt.barbersName}
💰 *Est. Price*: Rs. ${appt.price}

Please let us know if you need to reschedule. Looking forward to grooming you! ✂️`;
}

export function getUrgentAlertMsg(appt: Appointment, reason: string): string {
  return `⚠️ *Urgent Alert from Barber Shop* ⚠️

Hello *${appt.customerName}*, 
We apologize or notify you that we need to reschedule your appointment for *${appt.serviceName}* on *${new Date(appt.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}*.

Reason: ${reason || 'Staff scheduling change'}

Please click this chat or call us back to select another convenient time slot. We deeply regret the inconvenience! 🙏`;
}

export function getPaymentReceiptMsg(pay: Payment): string {
  const dateFormatted = new Date(pay.date + 'T' + pay.time).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  
  return `Thank you for visiting *Barber Shop*! 💈✂️

Here is your digital invoice summary:
🧾 *Invoice ID*: #${pay.id}
📅 *Date/Time*: ${dateFormatted}
💁‍♂️ *Customer Name*: ${pay.customerName}
🛠️ *Services*: ${pay.serviceNames.join(' + ')}
💰 *Total Paid*: Rs. ${pay.totalAmount} (via ${pay.paymentMethod})
Status: *PAID & COMPLETED* ✅

We hope you loved our service! Looking forward to your next visit. Have an amazing day! ⭐⭐⭐⭐⭐`;
}

export function getGeneralPromoMsg(cust: Customer): string {
  return `Hello *${cust.name}*! 👋💈

We haven't seen you since *${cust.lastVisit || 'some time'}*. 
It is time for your fresh premium haircut & shape! Book your appointment today and avail a special flat 10% off on Combos.

Reply to this message to secure your preferred slot! ✂️`;
}

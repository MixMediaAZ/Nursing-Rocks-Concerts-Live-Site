/**
 * ARCHIVED EMAIL TEMPLATES — saved before May 2026 thank-you update
 *
 * These were the original ticket-confirmation and ticket-issued email bodies
 * used in approveAndSendTicketEmail() and buildTicketEmailHtml() in server/services/email.ts.
 * Preserved here for reference. Not imported anywhere.
 */

// ─── ORIGINAL buildTicketEmailHtml body ──────────────────────────────────────
// Subject: "Your Free Nursing Rocks Ticket is Ready! 🎸"
//
// <!DOCTYPE html>
// <html>
// <head>
//   <meta charset="utf-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <style>
//     * { margin: 0; padding: 0; box-sizing: border-box; }
//     body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; ... }
//     .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); ... }
//     ...
//   </style>
// </head>
// <body>
//   Hi {userName},
//   Welcome to the Nursing Rocks community! We're thrilled to have verified you.
//   You now have a free ticket — our way of saying thank you for all you do.
//   [Event details: title, date, time, location]
//   [QR code image]
//   [Ticket code]
//   "This ticket is exclusively yours and single-use. Once scanned at the event, it cannot be used again."
//   Contact: {SUPPORT_EMAIL}
// </body>
// </html>

// ─── ORIGINAL approveAndSendTicketEmail body ─────────────────────────────────
// Subject: "Your Nursing Rocks! Ticket for {event.title}"
//
// Hi {nurseName},
// "Thank you for purchasing your ticket to the Nursing Rocks! Concert Series!
//  We're excited to see you at the event."
// [Event details card: title, date, time, location, ticket type, price]
// [Ticket code block]
// [QR code image (if available)]
// "Important: Please bring this email with you. Staff can scan the QR code or enter your ticket code."
// "See you at the show! — The Nursing Rocks! Team"

export {};

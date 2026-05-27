import nodemailer from "nodemailer";

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.mailtrap.io",
    port: parseInt(process.env.EMAIL_PORT || "2525"),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  static async sendBookingConfirmation(to: string, booking: { id: string }, pdfBuffer: Buffer) {
    const mailOptions = {
      from: '"SkyBooking" <noreply@skybooking.com>',
      to,
      subject: `Booking Confirmation - ${booking.id}`,
      text: `Thank you for booking with SkyBooking. Your booking reference is ${booking.id}. Please find your e-ticket attached.`,
      html: `
        <h1>Booking Confirmation</h1>
        <p>Thank you for choosing SkyBooking.</p>
        <p><strong>Booking Reference:</strong> ${booking.id}</p>
        <p>Your e-ticket is attached to this email.</p>
      `,
      attachments: [
        {
          filename: `Ticket-${booking.id}.pdf`,
          content: pdfBuffer,
        },
      ],
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Confirmation email sent to ${to}`);
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  }
}

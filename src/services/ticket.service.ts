import { jsPDF } from "jspdf";
import "jspdf-autotable";

export class TicketService {
  static async generateTicketPDF(booking: any): Promise<Buffer> {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.text("E-TICKET / BOOKING CONFIRMATION", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Booking Reference: ${booking.id}`, 20, 40);
    doc.text(`Status: ${booking.status}`, 20, 50);
    doc.text(`Date: ${new Date(booking.createdAt).toLocaleDateString()}`, 20, 60);

    // Passenger Info
    doc.setFontSize(16);
    doc.text("Passenger Details", 20, 80);
    
    const passengerData = booking.passengers.map((p: any) => [
      `${p.firstName} ${p.lastName}`,
      p.passportNumber || "N/A",
      p.nationality || "N/A",
      p.ticket?.ticketNumber || "PENDING"
    ]);

    (doc as any).autoTable({
      startY: 85,
      head: [["Name", "Passport", "Nationality", "Ticket No"]],
      body: passengerData,
    });

    // Flight Info
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(16);
    doc.text("Flight Details", 20, finalY);

    const flightData = booking.flight.segments.map((s: any) => [
      s.departureAirport.code,
      s.arrivalAirport.code,
      new Date(s.departureTime).toLocaleString(),
      new Date(s.arrivalTime).toLocaleString(),
      booking.flight.flightNumber
    ]);

    (doc as any).autoTable({
      startY: finalY + 5,
      head: [["From", "To", "Departure", "Arrival", "Flight"]],
      body: flightData,
    });

    return Buffer.from(doc.output("arraybuffer"));
  }
}

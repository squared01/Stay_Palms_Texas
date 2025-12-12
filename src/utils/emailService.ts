import { Customer, Reservation } from '../types';
import { formatDate } from './reservationUtils';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export const generateConfirmationEmail = (reservation: Reservation, customer: Customer): EmailTemplate => {
  const checkInDate = formatDate(reservation.checkInDate);
  const checkOutDate = formatDate(reservation.checkOutDate);

  const subject = `Booking Confirmation - ${customer.firstName} ${customer.lastName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .highlight { background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a; }
          .amenities { background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Booking Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${customer.firstName} ${customer.lastName},</p>

          <p>Thank you for choosing Stay Palms Texas! We're delighted to confirm your reservation and look forward to welcoming you.</p>

          <div class="details">
            <h3>Reservation Details:</h3>
            <div class="detail-row">
              <span class="detail-label">Reservation Number:</span>
              <span>${reservation.id}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-in Date:</span>
              <span>${checkInDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-out Date:</span>
              <span>${checkOutDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Room Type:</span>
              <span>${reservation.roomType.charAt(0).toUpperCase() + reservation.roomType.slice(1)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Number of Guests:</span>
              <span>${reservation.numberOfGuests}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Amount:</span>
              <span>$${reservation.totalAmount.toFixed(2)}</span>
            </div>
            ${reservation.specialRequests ? `
            <div class="detail-row">
              <span class="detail-label">Special Requests:</span>
              <span>${reservation.specialRequests}</span>
            </div>
            ` : ''}
          </div>

          <div class="highlight">
            <p><strong>Check-in & Check-out Information:</strong></p>
            <ul>
              <li><strong>Check-in time:</strong> 3:00 PM</li>
              <li><strong>Check-out time:</strong> 11:00 AM</li>
              <li><strong>What to bring:</strong> Valid photo ID and credit card</li>
            </ul>
          </div>

          <div class="amenities">
            <p><strong>Hotel Amenities:</strong></p>
            <ul>
              <li>Free WiFi throughout the property</li>
              <li>Complimentary parking</li>
              <li>Air conditioning in all rooms</li>
              <li>24/7 front desk assistance</li>
            </ul>
          </div>

          <p>If you need to modify or cancel your reservation, or if you have any questions, please don't hesitate to contact us.</p>

          <p>We can't wait to host you!</p>

          <div class="footer">
            <p><strong>Stay Palms Texas</strong></p>
            <p>316 1st St, Normangee, TX 77871</p>
            <p>Phone: (281) 520-8440</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Booking Confirmation - ${customer.firstName} ${customer.lastName}

Dear ${customer.firstName} ${customer.lastName},

Thank you for choosing Stay Palms Texas! We're delighted to confirm your reservation and look forward to welcoming you.

Reservation Details:
- Reservation Number: ${reservation.id}
- Check-in Date: ${checkInDate}
- Check-out Date: ${checkOutDate}
- Room Type: ${reservation.roomType.charAt(0).toUpperCase() + reservation.roomType.slice(1)}
- Number of Guests: ${reservation.numberOfGuests}
- Total Amount: $${reservation.totalAmount.toFixed(2)}
${reservation.specialRequests ? `- Special Requests: ${reservation.specialRequests}` : ''}

Check-in & Check-out Information:
- Check-in time: 3:00 PM
- Check-out time: 11:00 AM
- What to bring: Valid photo ID and credit card

Hotel Amenities:
- Free WiFi throughout the property
- Complimentary parking
- Air conditioning in all rooms
- 24/7 front desk assistance

If you need to modify or cancel your reservation, or if you have any questions, please don't hesitate to contact us.

We can't wait to host you!

Best regards,
Stay Palms Texas
316 1st St, Normangee, TX 77871
Phone: (281) 520-8440
  `.trim();

  return { subject, html, text };
};

export const generateReminderEmail = (reservation: Reservation, customer: Customer): EmailTemplate => {
  const checkInDate = formatDate(reservation.checkInDate);
  const checkOutDate = formatDate(reservation.checkOutDate);
  
  // If reservation is cancelled, generate cancellation confirmation email
  if (reservation.status === 'cancelled') {
    const subject = `Reservation Cancellation Confirmation - ${customer.firstName} ${customer.lastName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reservation Cancelled</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #555; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reservation Cancelled</h1>
          </div>
          <div class="content">
            <p>Dear ${customer.firstName} ${customer.lastName},</p>
            
            <p>This email confirms that your reservation has been cancelled.</p>
            
            <div class="details">
              <h3>Cancelled Reservation Details:</h3>
              <div class="detail-row">
                <span class="detail-label">Reservation Number:</span>
                <span>${reservation.id}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Original Check-in:</span>
                <span>${checkInDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Original Check-out:</span>
                <span>${checkOutDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Room Type:</span>
                <span>${reservation.roomType.charAt(0).toUpperCase() + reservation.roomType.slice(1)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Guests:</span>
                <span>${reservation.numberOfGuests}</span>
              </div>
              ${reservation.cancellationComment ? `
              <div class="detail-row">
                <span class="detail-label">Cancellation Reason:</span>
                <span>${reservation.cancellationComment}</span>
              </div>
              ` : ''}
            </div>
            
            <p>If you have any questions about this cancellation or need to make a new reservation, please don't hesitate to contact us.</p>
            
            <p>Thank you for choosing our hotel.</p>
            
            <div class="footer">
              <p><strong>Stay Palms Texas Management Team</strong></p>
              <p>316 1st St, Normangee, TX 77871</p>
              <p>Phone: (281) 520-8440</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const text = `
Reservation Cancellation Confirmation - ${customer.firstName} ${customer.lastName}

Dear ${customer.firstName} ${customer.lastName},

This email confirms that your reservation has been cancelled.

Cancelled Reservation Details:
- Reservation Number: ${reservation.id}
- Original Check-in: ${checkInDate}
- Original Check-out: ${checkOutDate}
- Room Type: ${reservation.roomType.charAt(0).toUpperCase() + reservation.roomType.slice(1)}
- Guests: ${reservation.numberOfGuests}
${reservation.cancellationComment ? `- Cancellation Reason: ${reservation.cancellationComment}` : ''}

If you have any questions about this cancellation or need to make a new reservation, please don't hesitate to contact us.

Thank you for choosing our hotel.

Best regards,
Stay Palms Texas Management Team
316 1st St, Normangee, TX 77871
Phone: (281) 520-8440
    `.trim();
    
    return { subject, html, text };
  }
  
  // Generate reminder email for confirmed reservations
  const subject = `Reservation Reminder - ${customer.firstName} ${customer.lastName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reservation Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .highlight { background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reservation Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${customer.firstName} ${customer.lastName},</p>
          
          <p>This is a friendly reminder about your upcoming reservation at Stay Palms Texas.</p>
          
          <div class="details">
            <h3>Reservation Details:</h3>
            <div class="detail-row">
              <span class="detail-label">Reservation Number:</span>
              <span>${reservation.id}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-in:</span>
              <span>${checkInDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Check-out:</span>
              <span>${checkOutDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Room Type:</span>
              <span>${reservation.roomType.charAt(0).toUpperCase() + reservation.roomType.slice(1)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Guests:</span>
              <span>${reservation.numberOfGuests}</span>
            </div>
          </div>
          
          <div class="highlight">
            <p><strong>Important Information:</strong></p>
            <ul>
              <li>Check-in time: 3:00 PM</li>
              <li>Check-out time: 11:00 AM</li>
              <li>Please bring a valid ID and credit card</li>
              <li>Free WiFi and parking available</li>
            </ul>
          </div>
          
          <p>We look forward to welcoming you soon! If you have any questions or special requests, please don't hesitate to contact us.</p>
          
          <div class="footer">
            <p><strong>Stay Palms Texas Management Team</strong></p>
            <p>316 1st St, Normangee, TX 77871</p>
            <p>Phone: (281) 520-8440</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  const text = `
Reservation Reminder - ${customer.firstName} ${customer.lastName}

Dear ${customer.firstName} ${customer.lastName},

This is a friendly reminder about your upcoming reservation at Stay Palms Texas.

Reservation Details:
- Reservation Number: ${reservation.id}
- Check-in: ${checkInDate}
- Check-out: ${checkOutDate}
- Room Type: ${reservation.roomType.charAt(0).toUpperCase() + reservation.roomType.slice(1)}
- Guests: ${reservation.numberOfGuests}

Important Information:
- Check-in time: 3:00 PM
- Check-out time: 11:00 AM
- Please bring a valid ID and credit card
- Free WiFi and parking available

We look forward to welcoming you soon! If you have any questions or special requests, please don't hesitate to contact us.

Best regards,
Stay Palms Texas Management Team
316 1st St, Normangee, TX 77871
Phone: (281) 520-8440
  `.trim();
  
  return { subject, html, text };
};

export const sendEmail = async (to: string, template: EmailTemplate, fromEmail?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    console.log('Sending email to:', to);
    console.log('From email:', fromEmail);
    console.log('Using Supabase URL:', supabaseUrl);

    const payload = {
      to,
      from: fromEmail || undefined,
      subject: template.subject,
      html: template.html,
      text: template.text,
    };

    console.log('Email payload:', payload);

    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      const errorMessage = errorData.error || errorData.details || errorText || 'Failed to send email';
      console.error('Parsed error:', errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
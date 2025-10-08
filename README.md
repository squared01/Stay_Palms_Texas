# Stay Palms Hotel - Reservation Management System

A comprehensive hotel reservation management system built with React, TypeScript, and Tailwind CSS, featuring real-time email notifications via Supabase Edge Functions.

## Features

### Core Functionality
- **Customer Management**: Create, edit, and manage customer profiles with detailed information
- **Reservation System**: Full booking management with room availability checking
- **Room Management**: Configure room types, pricing, and individual room settings
- **Dashboard Analytics**: Real-time insights into bookings, revenue, and occupancy
- **Email Notifications**: Automated reminder emails and cancellation confirmations

### Advanced Features
- **Smart Availability Checking**: Prevents overbooking with time-aware room allocation
- **Auto-Cancellation**: Automatically cancels no-show reservations
- **Progressive Enhancement**: Works offline with graceful degradation
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase Edge Functions
- **Email Service**: Resend API
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Hosting**: Bolt Hosting

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Resend account (for email functionality)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stay-palms-hotel
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase Edge Function:
```bash
# Deploy the send-email function
supabase functions deploy send-email

# Set the Resend API key as a secret
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

5. Start the development server:
```bash
npm run dev
```

## Email Configuration

### Setting up Resend

1. Sign up for a [Resend account](https://resend.com)
2. Verify your domain or use the sandbox domain for testing
3. Get your API key from the Resend dashboard
4. Add the API key to your Supabase secrets:
```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

### Email Templates

The system includes professionally designed HTML email templates for:
- **Reservation Reminders**: Sent 3 days before check-in
- **Cancellation Confirmations**: Sent when reservations are cancelled
- **Custom Notifications**: Extensible template system

### Email Features
- HTML and plain text versions
- Responsive design for all devices
- Professional branding
- Automatic retry on failure
- Delivery status tracking

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AccessibleDataTable.tsx
│   ├── AccessibleDropdown.tsx
│   ├── CustomerCard.tsx
│   ├── CustomerForm.tsx
│   ├── Dashboard.tsx
│   ├── EmailService.tsx
│   ├── HotelSettings.tsx
│   ├── Modal.tsx
│   ├── ProgressiveEnhancement.tsx
│   ├── ReservationForm.tsx
│   ├── ReservationList.tsx
│   └── RoomPricingSettings.tsx
├── hooks/               # Custom React hooks
│   ├── useAutoCancellation.ts
│   └── useLocalStorage.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
│   ├── emailService.ts
│   └── reservationUtils.ts
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles

supabase/
├── functions/
│   └── send-email/     # Edge function for email sending
│       └── index.ts
└── migrations/         # Database migrations
```

## Key Components

### Dashboard
- Real-time metrics and KPIs
- Upcoming reservations overview
- Quick action buttons
- Revenue tracking

### Customer Management
- Comprehensive customer profiles
- Reservation history
- Contact information management
- Notes and preferences

### Reservation System
- Room availability checking
- Conflict prevention
- Status management (confirmed, checked-in, checked-out, cancelled)
- Special requests handling

### Email Service
- Automated reminder system
- Template-based emails
- Delivery tracking
- Error handling and retry logic

## Configuration

### Hotel Settings
- Hotel name and branding
- Check-in/check-out times
- Room configuration
- Pricing management

### Room Types
- Standard, Deluxe, Suite, Family rooms
- Custom pricing per room type
- Amenities management
- Availability controls

### Notification Settings
- Email notification preferences
- Recipient management
- Template customization

## Data Management

The application uses Supabase for data persistence with real-time synchronization and automatic backups. Data is stored in PostgreSQL with Row Level Security enabled.

### Data Models
- **Customer**: Personal information, contact details, preferences (stored in `customers` table)
- **Reservation**: Booking details, dates, room assignments, status (stored in `reservations` table)
- **Room**: Physical room configuration and amenities
- **RoomType**: Room categories and pricing

### Database Schema

The application uses the following database tables:

#### Customers Table
```sql
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text NOT NULL,
  address jsonb NOT NULL,
  number_of_kids integer DEFAULT 0,
  comments text,
  created_at timestamptz DEFAULT now()
);
```

#### Reservations Table
```sql
CREATE TABLE reservations (
  id text PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  room_type text NOT NULL,
  specific_room_id text,
  number_of_guests integer NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  status text NOT NULL CHECK (status IN ('confirmed', 'checked-in', 'checked-out', 'cancelled')),
  special_requests text,
  reminder_sent boolean DEFAULT false,
  reminder_date timestamptz,
  cancellation_comment text,
  created_at timestamptz DEFAULT now()
);
```

## Accessibility Features

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Reduced motion preferences
- Focus management
- Semantic HTML structure

## Performance Optimizations

- Lazy loading of components
- Optimized re-renders with React.memo
- Efficient state management
- Progressive image loading
- Code splitting
- Bundle optimization

## Security Features

- Input validation and sanitization
- XSS protection
- CSRF protection
- Secure API communication
- Environment variable protection
- Rate limiting on email sending

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Deployment

The application is optimized for deployment on:
- Bolt Hosting (recommended)
- Vercel
- Netlify
- Any static hosting service

### Environment Variables for Production
```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

## Roadmap

- [ ] Multi-language support
- [ ] Advanced reporting and analytics
- [ ] Integration with payment processors
- [ ] Mobile app development
- [ ] API for third-party integrations
- [ ] Advanced room management features
- [ ] Loyalty program integration
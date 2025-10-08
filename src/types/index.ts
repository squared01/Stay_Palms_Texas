export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  numberOfKids: number;
  comments?: string;
  createdAt: Date;
}

export interface Reservation {
  id: string;
  customerId: string;
  checkInDate: Date;
  checkOutDate: Date;
  roomType: string;
  specificRoomId?: string;
  numberOfGuests: number;
  totalAmount: number;
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  specialRequests?: string;
  createdAt: Date;
  reminderSent: boolean;
  reminderDate?: Date;
  cancellationComment?: string;
}

export interface RoomType {
  id: string;
  name: string;
  basePrice: number;
  description?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  isActive: boolean;
  amenities?: string[];
}

export interface HotelSettings {
  totalRooms: number;
  hotelName: string;
  rooms: Room[];
  checkInTime: string;
  checkOutTime: string;
}

export interface CustomerWithReservations extends Customer {
  reservations: Reservation[];
}

export interface NotificationSettings {
  fromEmail: string;
  priceChangeNotifications: {
    enabled: boolean;
    emailAddresses: string[];
  };
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Driver {
  id: string;
  name: string;
  vehiclePlate: string;
  isOnline: boolean;
  currentLocation: LatLng;
}

export interface Order {
  id: string;
  trackingCode: string;
  customerName: string;
  status: OrderStatus;
  driverId?: string;
  pickup: {
    address: string;
    coords: LatLng;
  };
  destination: {
    address: string;
    coords: LatLng;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AppContextType {
  orders: Order[];
  drivers: Driver[];
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  updateDriverLocation: (driverId: string, location: LatLng) => void;
  toggleDriverStatus: (driverId: string) => void;
}

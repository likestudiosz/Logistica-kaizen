
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Order, Driver, OrderStatus, LatLng, AppContextType } from '../types';

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Carlos Oliveira', vehiclePlate: 'BRA-2E19', isOnline: true, currentLocation: { lat: -23.5505, lng: -46.6333 } },
  { id: 'd2', name: 'Ana Souza', vehiclePlate: 'KRT-4412', isOnline: true, currentLocation: { lat: -23.5555, lng: -46.6395 } },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'o1',
    trackingCode: 'B2B-7721-XP',
    customerName: 'LogiCorp S.A.',
    status: OrderStatus.IN_TRANSIT,
    driverId: 'd1',
    pickup: { address: 'Centro de Distribuição Norte', coords: { lat: -23.5329, lng: -46.6395 } },
    destination: { address: 'Avenida Paulista, 1000, São Paulo', coords: { lat: -23.5611, lng: -46.6559 } },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'o2',
    trackingCode: 'B2B-9942-LX',
    customerName: 'TechParts Ltda',
    status: OrderStatus.PENDING,
    driverId: 'd2',
    pickup: { address: 'Galpão Principal', coords: { lat: -23.5489, lng: -46.6388 } },
    destination: { address: 'Rua Augusta, 500, São Paulo', coords: { lat: -23.5532, lng: -46.6521 } },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);

  const updateOrder = useCallback((orderId: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o));
  }, []);

  const updateDriverLocation = useCallback((driverId: string, location: LatLng) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, currentLocation: location } : d));
  }, []);

  const toggleDriverStatus = useCallback((driverId: string) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, isOnline: !d.isOnline } : d));
  }, []);

  return (
    <AppContext.Provider value={{ orders, drivers, updateOrder, updateDriverLocation, toggleDriverStatus }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used within an AppProvider');
  return context;
};

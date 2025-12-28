
import React, { useState, useEffect } from 'react';
import { useAppState } from '../lib/store';
import { OrderStatus, LatLng } from '../types';
import { MapPin, Navigation, Package, CheckCircle2, Power, Play, RotateCcw, Map as MapIcon } from 'lucide-react';
import MapView from '../components/MapView';

const DriverDashboard: React.FC = () => {
  const driverId = 'd1'; // Mock logged driver
  const { orders, drivers, updateDriverLocation, toggleDriverStatus, updateOrder } = useAppState();
  const [isSimulating, setIsSimulating] = useState(false);
  
  const driver = drivers.find(d => d.id === driverId);
  const myOrders = orders.filter(o => o.driverId === driverId && o.status !== OrderStatus.DELIVERED);
  const activeOrder = myOrders[0];

  // Simulation Logic: Interpolate movement towards destination
  useEffect(() => {
    if (!isSimulating || !activeOrder || !driver?.isOnline) return;

    const interval = setInterval(() => {
      const current = driver.currentLocation;
      const target = activeOrder.destination.coords;
      
      // Basic linear interpolation to simulate truck movement
      const step = 0.0005; 
      const newLat = current.lat + (target.lat > current.lat ? step : -step);
      const newLng = current.lng + (target.lng > current.lng ? step : -step);

      // Check if arrived (roughly)
      if (Math.abs(newLat - target.lat) < 0.001 && Math.abs(newLng - target.lng) < 0.001) {
        setIsSimulating(false);
        // Ensure final position is broadcasted
        updateDriverLocation(driverId, target);
        return;
      }

      // This updates global state AND broadcasts to "Supabase Realtime" simulation
      updateDriverLocation(driverId, { lat: newLat, lng: newLng });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating, activeOrder, driver, updateDriverLocation]);

  if (!driver) return null;

  const currentCoords: [number, number] = [driver.currentLocation.lat, driver.currentLocation.lng];
  const destCoords: [number, number] = activeOrder ? [activeOrder.destination.coords.lat, activeOrder.destination.coords.lng] : [0, 0];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-4 shrink-0 flex items-center justify-between shadow-xl z-20">
        <div>
          <h1 className="text-xl font-black">Olá, {driver.name.split(' ')[0]}</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{driver.vehiclePlate}</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
            onClick={() => toggleDriverStatus(driverId)}
            className={`p-3 rounded-2xl transition-all ${driver.isOnline ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20 text-white' : 'bg-slate-700 text-slate-400'}`}
          >
            <Power size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col relative">
        {!driver.isOnline ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4 px-6 bg-slate-50">
            <div className="bg-slate-200 p-8 rounded-full text-slate-400">
              <Power size={48} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Você está offline</h2>
            <p className="text-slate-500 max-w-[240px]">Fique online para receber e gerenciar suas entregas industriais.</p>
          </div>
        ) : (
          <>
            {/* Real-time Map Area */}
            <div className="flex-1 relative">
              <MapView 
                center={currentCoords} 
                zoom={15} 
                markers={[
                  { id: 'driver', position: currentCoords, label: 'Sua Posição', type: 'truck' },
                  ...(activeOrder ? [{ id: 'dest', position: destCoords, label: 'Entrega Final', type: 'destination' as const }] : [])
                ]}
                showRoute={activeOrder && isSimulating ? { start: currentCoords, end: destCoords } : undefined}
              />
              
              {/* Floating Instruction Overlay */}
              {activeOrder && (
                <div className="absolute top-4 left-4 right-4 z-[1000] animate-in slide-in-from-top-4">
                  <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-slate-100 flex items-center gap-4">
                    <div className="bg-slate-900 p-3 rounded-2xl text-white">
                      <Navigation size={24} className={isSimulating ? 'animate-pulse' : ''} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Próximo Destino</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{activeOrder.destination.address}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Card Area */}
            <div className="bg-white rounded-t-[40px] shadow-[0_-12px_40px_rgba(0,0,0,0.08)] p-6 pb-8 shrink-0 z-10 border-t border-slate-100">
              {activeOrder ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Entrega Ativa</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{activeOrder.trackingCode}</span>
                  </div>

                  <div className="flex gap-4 items-center p-4 bg-slate-50 rounded-2xl">
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                       <Package size={20} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                       <p className="text-sm font-bold text-slate-900">{activeOrder.customerName}</p>
                       <p className="text-xs text-slate-500">2.4km • 15 min aprox.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setIsSimulating(!isSimulating)}
                      className={`flex items-center justify-center gap-2 py-4 rounded-3xl font-black text-sm transition-all ${isSimulating ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'}`}
                    >
                      {isSimulating ? <RotateCcw size={18} /> : <Play size={18} />}
                      {isSimulating ? 'Simulando...' : 'Iniciar Rota'}
                    </button>
                    <button 
                      onClick={() => {
                        updateOrder(activeOrder.id, { status: OrderStatus.DELIVERED });
                        setIsSimulating(false);
                      }}
                      className="flex items-center justify-center gap-2 py-4 rounded-3xl bg-emerald-600 text-white font-black text-sm shadow-lg shadow-emerald-600/20"
                    >
                      <CheckCircle2 size={18} /> Confirmar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="bg-slate-50 p-6 rounded-full text-slate-300">
                    <MapIcon size={40} />
                  </div>
                  <h3 className="font-bold text-slate-800">Sem entregas pendentes</h3>
                  <p className="text-xs text-slate-500">Aguarde novas atribuições da central.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DriverDashboard;

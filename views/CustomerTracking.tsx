
import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../lib/store';
import MapView from '../components/MapView';
import { OrderStatus, LatLng } from '../types';
import { getDeliveryEstimate } from '../services/gemini';
import { Search, MapPin, Truck, CheckCircle, Package, Info, ExternalLink, Navigation, Clock, Gauge, ArrowRight } from 'lucide-react';

const CustomerTracking: React.FC = () => {
  const { orders, drivers, updateDriverLocation } = useAppState();
  const [search, setSearch] = useState('');
  const [activeOrder, setActiveOrder] = useState<typeof orders[0] | null>(null);
  const [estimate, setEstimate] = useState<{ text: string, groundingChunks: any[] }>({ text: '', groundingChunks: [] });
  
  // Simulated Telemetrics
  const [speed, setSpeed] = useState(0);
  const [eta, setEta] = useState(0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = orders.find(o => o.trackingCode.toLowerCase() === search.toLowerCase());
    if (found) {
      setActiveOrder(found);
      // Reset speed and eta when a new order is loaded
      setSpeed(Math.floor(Math.random() * 20) + 40); // 40-60 km/h
      setEta(Math.floor(Math.random() * 15) + 5); // 5-20 min
    } else {
      setActiveOrder(null);
    }
  };

  const currentDriver = activeOrder ? drivers.find(d => d.id === activeOrder.driverId) : null;
  const currentLoc = currentDriver?.currentLocation;

  /**
   * REAL-TIME SIMULATION LOGIC
   * This effect simulates the truck moving toward the destination.
   * In a real app, this would be replaced by a Supabase Realtime subscription.
   */
  useEffect(() => {
    if (!activeOrder || activeOrder.status !== OrderStatus.IN_TRANSIT || !currentDriver) return;

    // Simulation Interval (updates every 2 seconds)
    const interval = setInterval(() => {
      const current = currentDriver.currentLocation;
      const target = activeOrder.destination.coords;
      
      // Calculate a small step towards the destination
      const step = 0.0002; 
      const deltaLat = target.lat - current.lat;
      const deltaLng = target.lng - current.lng;
      const distance = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);

      // If we are very close, stop moving and set to delivered (for demo purposes)
      if (distance < 0.001) {
        setSpeed(0);
        setEta(0);
        clearInterval(interval);
        return;
      }

      // Calculate new coordinates
      const ratio = step / distance;
      const newLat = current.lat + deltaLat * ratio;
      const newLng = current.lng + deltaLng * ratio;

      // UPDATE GLOBAL STATE
      // This is where you would normally listen to:
      // supabase.channel('locations').on('postgres_changes', ...).subscribe()
      updateDriverLocation(currentDriver.id, { lat: newLat, lng: newLng });

      // Jitter the speed and eta for realism
      setSpeed(prev => Math.max(30, Math.min(80, prev + (Math.random() * 4 - 2))));
      setEta(prev => Math.max(1, prev - (Math.random() * 0.1)));
    }, 2000);

    return () => clearInterval(interval);
  }, [activeOrder?.id, activeOrder?.status, currentDriver?.id, updateDriverLocation]);

  // Fetch AI Insights whenever the location or status changes
  useEffect(() => {
    if (activeOrder) {
      const fetchEstimate = async () => {
        const data = await getDeliveryEstimate(
          activeOrder.status, 
          activeOrder.destination.address,
          currentLoc ? { lat: currentLoc.lat, lng: currentLoc.lng } : undefined
        );
        setEstimate(data);
      };
      fetchEstimate();
    }
  }, [activeOrder?.id, activeOrder?.status, currentLoc?.lat]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl shadow-lg">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <span className="font-black text-slate-900 tracking-tighter text-xl">TMS <span className="text-blue-600">FLOW</span></span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">B2B Logistics</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#" className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest">Suporte</a>
            <a href="#" className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest">FAQ</a>
            <button className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600">Empresarial</button>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {!activeOrder ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-xl w-full text-center space-y-10 py-20">
              <div className="space-y-4">
                <div className="inline-flex bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-bounce">
                  Rastreamento em Tempo Real
                </div>
                <h1 className="text-5xl font-black text-slate-900 leading-[1.1] tracking-tighter">Onde está sua carga industrial?</h1>
                <p className="text-slate-500 font-medium text-lg max-w-md mx-auto">Visualize o deslocamento da sua frota B2B com precisão via Google Maps.</p>
              </div>

              <form onSubmit={handleSearch} className="relative group max-w-md mx-auto">
                <div className="absolute inset-0 bg-blue-600/10 rounded-[40px] blur-2xl group-focus-within:bg-blue-600/20 transition-all"></div>
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Insira seu Código de Rastreio"
                  className="relative w-full bg-white border-2 border-slate-100 rounded-[32px] py-8 px-16 text-xl font-bold shadow-2xl focus:ring-0 focus:border-blue-500 transition-all outline-none placeholder:text-slate-300"
                />
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={28} />
                <button 
                  type="submit"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  RASTREAR
                </button>
              </form>

              <div className="grid grid-cols-3 gap-6 pt-12">
                {[
                  { icon: Truck, label: 'GPS Ativo', color: 'text-blue-600' },
                  { icon: CheckCircle, label: 'B2B Seguro', color: 'text-emerald-500' },
                  { icon: Navigation, label: 'Rotas Otimizadas', color: 'text-amber-500' }
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="mx-auto w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                      <item.icon size={20} className={item.color} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[calc(100vh-80px)]">
            {/* Sidebar Details */}
            <div className="lg:col-span-4 xl:col-span-3 bg-white border-r border-slate-100 overflow-y-auto z-20 shadow-2xl">
              <div className="p-8 space-y-8">
                <button onClick={() => setActiveOrder(null)} className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-slate-900 transition-colors">
                  <ArrowRight size={14} className="rotate-180" /> Nova Pesquisa
                </button>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Pedido ID: {activeOrder.trackingCode}</p>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                      {activeOrder.status === OrderStatus.IN_TRANSIT ? 'Carga em Trânsito' : 
                       activeOrder.status === OrderStatus.DELIVERED ? 'Carga Entregue' : 'Processando'}
                    </h2>
                  </div>

                  {/* Telemetrics Card */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Gauge size={14} className="text-blue-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Velocidade</span>
                      </div>
                      <p className="text-xl font-black text-slate-900">{Math.round(speed)} <span className="text-xs font-bold text-slate-400">km/h</span></p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={14} className="text-amber-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Chegada</span>
                      </div>
                      <p className="text-xl font-black text-slate-900">~{Math.round(eta)} <span className="text-xs font-bold text-slate-400">min</span></p>
                    </div>
                  </div>

                  {/* AI Content */}
                  {estimate.text && (
                    <div className="bg-blue-600 p-6 rounded-[32px] shadow-xl text-white relative overflow-hidden group">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                      <div className="flex items-center gap-2 mb-4">
                        <Info size={16} className="text-blue-200" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Relatório da Rota (Google Maps AI)</p>
                      </div>
                      <p className="text-sm font-bold leading-relaxed opacity-95">
                        "{estimate.text}"
                      </p>
                      {estimate.groundingChunks.length > 0 && (
                        <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
                          {estimate.groundingChunks.map((chunk, idx) => chunk.maps && (
                            <a key={idx} href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-md rounded-xl text-[10px] font-bold hover:bg-white/20 transition-all border border-white/5">
                              <span className="truncate max-w-[140px]">{chunk.maps.title}</span>
                              <ExternalLink size={12} className="shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tracking Timeline */}
                  <div className="pt-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Linha do Tempo</h3>
                    <div className="relative pl-8 space-y-10">
                      <div className="absolute left-[3px] top-1 bottom-1 w-[2px] bg-slate-100" />
                      
                      <div className="relative">
                        <div className={`absolute -left-[32px] w-5 h-5 rounded-full border-4 border-white shadow-md ${activeOrder.status !== OrderStatus.PENDING ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Coleta Efetuada</p>
                        <p className="text-sm font-black text-slate-900">Distribuidora LogiCorp</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(activeOrder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • 0 km</p>
                      </div>

                      <div className="relative">
                        <div className={`absolute -left-[32px] w-5 h-5 rounded-full border-4 border-white shadow-md ${activeOrder.status === OrderStatus.IN_TRANSIT ? 'bg-amber-500 animate-pulse' : activeOrder.status === OrderStatus.DELIVERED ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Em Trânsito</p>
                        <p className="text-sm font-black text-slate-900">Rota Direta B2B</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Motorista: {currentDriver?.name}</p>
                      </div>

                      <div className="relative">
                        <div className={`absolute -left-[32px] w-5 h-5 rounded-full border-4 border-white shadow-md ${activeOrder.status === OrderStatus.DELIVERED ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Destino Final</p>
                        <p className="text-sm font-black text-slate-900">{activeOrder.customerName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{activeOrder.destination.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Immersive Map Area */}
            <div className="lg:col-span-8 xl:col-span-9 relative bg-slate-100 h-full">
              <MapView 
                center={currentLoc ? [currentLoc.lat, currentLoc.lng] : [activeOrder.destination.coords.lat, activeOrder.destination.coords.lng]} 
                zoom={15}
                markers={[
                  { 
                    id: 'truck', 
                    position: [currentLoc?.lat || 0, currentLoc?.lng || 0] as [number, number], 
                    label: "Sua Carga", 
                    type: 'truck' as const 
                  },
                  { 
                    id: 'dest', 
                    position: [activeOrder.destination.coords.lat, activeOrder.destination.coords.lng] as [number, number], 
                    label: "Destino Industrial", 
                    type: 'destination' as const 
                  },
                  { 
                    id: 'pickup', 
                    position: [activeOrder.pickup.coords.lat, activeOrder.pickup.coords.lng] as [number, number], 
                    label: "Origem", 
                    type: 'pickup' as const 
                  }
                ].filter(m => m.position[0] !== 0)}
                showRoute={activeOrder.status === OrderStatus.IN_TRANSIT && currentLoc ? {
                  start: [currentLoc.lat, currentLoc.lng],
                  end: [activeOrder.destination.coords.lat, activeOrder.destination.coords.lng]
                } : undefined}
              />

              {/* Status Floating Overlay */}
              <div className="absolute top-6 left-6 right-6 lg:left-auto lg:right-6 lg:w-96 flex flex-col gap-3">
                <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[32px] shadow-2xl border border-slate-100/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-500 w-3 h-3 rounded-full animate-ping" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GPS Satélite</p>
                      <p className="text-xs font-bold text-slate-900">Transmissão em Tempo Real</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Veículo</p>
                    <p className="text-xs font-black text-slate-900">{currentDriver?.vehiclePlate}</p>
                  </div>
                </div>
              </div>

              {/* Legal/Context Footer Overlay */}
              <div className="absolute bottom-8 left-8 bg-slate-900/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                <p className="text-[9px] font-bold text-white uppercase tracking-widest opacity-80">Google Maps Engine v4.1 • © 2025 TMS Flow B2B</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerTracking;

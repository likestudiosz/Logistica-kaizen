
import React, { useState, useEffect } from 'react';
import { useAppState } from '../lib/store';
import MapView from '../components/MapView';
import { OrderStatus } from '../types';
import { getDeliveryEstimate } from '../services/gemini';
import { Search, MapPin, Truck, CheckCircle, Package, Info, ExternalLink } from 'lucide-react';

const CustomerTracking: React.FC = () => {
  const { orders, drivers } = useAppState();
  const [search, setSearch] = useState('');
  const [activeOrder, setActiveOrder] = useState<typeof orders[0] | null>(null);
  const [estimate, setEstimate] = useState<{ text: string, groundingChunks: any[] }>({ text: '', groundingChunks: [] });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = orders.find(o => o.trackingCode.toLowerCase() === search.toLowerCase());
    setActiveOrder(found || null);
  };

  const getDriverLocation = (driverId?: string) => {
    if (!driverId) return null;
    return drivers.find(d => d.id === driverId)?.currentLocation;
  };

  const currentLoc = activeOrder ? getDriverLocation(activeOrder.driverId) : null;

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Package size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">TMS Tracker</span>
          </div>
          <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase">Ajuda</a>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 space-y-8">
        {!activeOrder ? (
          <div className="max-w-md mx-auto py-12 text-center space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-slate-900 leading-tight">Siga sua carga em tempo real.</h1>
              <p className="text-slate-500 font-medium">Insira o código de rastreamento enviado por e-mail.</p>
            </div>

            <form onSubmit={handleSearch} className="relative group">
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ex: B2B-XXXX-XX"
                className="w-full bg-white border border-slate-200 rounded-3xl py-6 px-14 text-lg font-bold shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
              />
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={24} />
              <button 
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all"
              >
                Rastrear
              </button>
            </form>

            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-100 text-left">
                <Truck size={20} className="text-blue-600 mb-2" />
                <p className="text-xs font-bold text-slate-900">Entrega Expressa</p>
                <p className="text-[10px] text-slate-400">Monitoramento 24h por dia via GPS.</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-100 text-left">
                <CheckCircle size={20} className="text-emerald-500 mb-2" />
                <p className="text-xs font-bold text-slate-900">Garantia B2B</p>
                <p className="text-[10px] text-slate-400">Seguro total para cargas industriais.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Order Sidebar */}
            <div className="space-y-6">
              <button onClick={() => setActiveOrder(null)} className="text-slate-400 text-xs font-bold uppercase flex items-center gap-2 hover:text-slate-900">
                &larr; Voltar
              </button>
              
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status do Pedido</p>
                  <h2 className="text-2xl font-black text-slate-900">
                    {activeOrder.status === OrderStatus.IN_TRANSIT ? 'Caminho Seguro' : 
                     activeOrder.status === OrderStatus.DELIVERED ? 'Entregue' : 'Em Preparação'}
                  </h2>
                </div>

                {estimate.text && (
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Info size={14} className="text-emerald-600" />
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">AI Delivery Context</p>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed italic">
                      "{estimate.text}"
                    </p>
                    {estimate.groundingChunks.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {estimate.groundingChunks.map((chunk, idx) => chunk.maps && (
                          <a key={idx} href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 bg-white rounded-lg border border-emerald-100 text-[9px] text-emerald-700 hover:bg-emerald-100 transition-colors">
                            <span className="truncate">{chunk.maps.title}</span>
                            <ExternalLink size={8} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="relative pl-6 space-y-8">
                  <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-slate-100" />
                  
                  <div className="relative">
                    <div className={`absolute -left-[27px] w-3 h-3 rounded-full border-2 border-white ${activeOrder.status !== OrderStatus.PENDING ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]' : 'bg-slate-300'}`} />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coleta</p>
                    <p className="text-sm font-bold text-slate-900">Coletado no Galpão</p>
                    <p className="text-xs text-slate-400">{new Date(activeOrder.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="relative">
                    <div className={`absolute -left-[27px] w-3 h-3 rounded-full border-2 border-white ${activeOrder.status === OrderStatus.IN_TRANSIT ? 'bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.1)]' : activeOrder.status === OrderStatus.DELIVERED ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Em Trânsito</p>
                    <p className="text-sm font-bold text-slate-900">A caminho do destino</p>
                  </div>

                  <div className="relative">
                    <div className={`absolute -left-[27px] w-3 h-3 rounded-full border-2 border-white ${activeOrder.status === OrderStatus.DELIVERED ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]' : 'bg-slate-300'}`} />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entrega</p>
                    <p className="text-sm font-bold text-slate-900">Finalizado</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Detalhes de Destino</p>
                  <div className="flex gap-3 items-start">
                    <MapPin size={18} className="text-slate-300 shrink-0" />
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{activeOrder.destination.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Map */}
            <div className="lg:col-span-2 h-[600px] bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-xl relative">
              <MapView 
                center={currentLoc ? [currentLoc.lat, currentLoc.lng] : [activeOrder.destination.coords.lat, activeOrder.destination.coords.lng]} 
                zoom={14}
                markers={[
                  { id: 'truck', position: [currentLoc?.lat || 0, currentLoc?.lng || 0] as [number, number], label: "Seu Pedido", type: 'truck' as const },
                  { id: 'dest', position: [activeOrder.destination.coords.lat, activeOrder.destination.coords.lng] as [number, number], label: "Destino", type: 'destination' as const }
                ].filter(m => m.position[0] !== 0)}
              />
              {activeOrder.status === OrderStatus.IN_TRANSIT && (
                <div className="absolute top-4 left-4 z-[1000] bg-white px-4 py-2 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900">Rastreamento ao vivo ativo</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerTracking;

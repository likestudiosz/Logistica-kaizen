
import React, { useState, useEffect } from 'react';
import { useAppState } from '../lib/store';
import MapView from '../components/MapView';
import { OrderStatus } from '../types';
import { getLogisticsInsights } from '../services/gemini';
import { LayoutDashboard, Users, Package, MoreVertical, TrendingUp, AlertTriangle, CheckCircle2, Info, ExternalLink, Map as MapIcon } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { orders, drivers } = useAppState();
  const [activeTab, setActiveTab] = useState<'map' | 'orders'>('map');
  const [insights, setInsights] = useState<{ text: string, groundingChunks: any[] }>({ text: 'Carregando insights com Google Maps...', groundingChunks: [] });

  useEffect(() => {
    const fetchInsights = async () => {
      const data = await getLogisticsInsights(orders, drivers);
      setInsights(data);
    };
    fetchInsights();
  }, [orders.length, drivers.length]);

  const stats = [
    { label: 'Entregas Hoje', value: orders.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Motoristas Online', value: drivers.filter(d => d.isOnline).length, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Em Trânsito', value: orders.filter(o => o.status === OrderStatus.IN_TRANSIT).length, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Atrasos', value: 0, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const mapMarkers = [
    ...drivers.filter(d => d.isOnline).map(d => ({
      id: d.id,
      position: [d.currentLocation.lat, d.currentLocation.lng] as [number, number],
      label: `Motorista: ${d.name} (${d.vehiclePlate})`,
      type: 'truck' as const
    })),
    ...orders.filter(o => o.status === OrderStatus.IN_TRANSIT).map(o => ({
      id: `dest-${o.id}`,
      position: [o.destination.coords.lat, o.destination.coords.lng] as [number, number],
      label: `Destino: ${o.customerName}`,
      type: 'destination' as const
    }))
  ];

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-100 flex flex-col hidden lg:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-xl">
            <Package className="text-white" size={20} />
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-lg">TMS Flow</span>
        </div>

        <nav className="px-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-900 bg-slate-50 rounded-lg font-medium">
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-medium transition-colors">
            <Users size={18} /> Frota Ativa
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-medium transition-colors">
            <Package size={18} /> Pedidos B2B
          </button>
        </nav>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-500 rounded-lg">
                <MapIcon size={14} className="text-white" />
              </div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Google Maps Grounding</h3>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line mb-4 font-medium italic">
              "{insights.text}"
            </p>
            {insights.groundingChunks.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <p className="text-[9px] font-black text-slate-500 uppercase">Pontos de Referência Próximos:</p>
                {insights.groundingChunks.map((chunk, idx) => chunk.maps && (
                  <a key={idx} href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 bg-slate-800 rounded-xl text-[10px] text-slate-300 hover:bg-slate-700 transition-all group">
                    <span className="truncate max-w-[160px]">{chunk.maps.title}</span>
                    <ExternalLink size={10} className="text-slate-500 group-hover:text-blue-400" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Status do Sistema</p>
            <p className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Torre de Controle Conectada
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-black text-slate-900">Visão Geral de Frota</h1>
            <span className="text-[10px] px-2.5 py-1 bg-slate-100 rounded-lg text-slate-500 font-bold">LIVE GPS</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('map')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'map' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
              >
                Mapa Satélite
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'orders' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
              >
                Lista
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className={`${stat.bg} ${stat.color} p-2.5 rounded-2xl`}>
                    <stat.icon size={20} />
                  </div>
                  <MoreVertical size={16} className="text-slate-300" />
                </div>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>

          {activeTab === 'map' ? (
            <div className="h-[calc(100vh-320px)] min-h-[500px] border border-slate-100 rounded-[40px] overflow-hidden shadow-2xl">
              <MapView center={[-23.5505, -46.6333]} zoom={13} markers={mapMarkers} />
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Código de Rastreio</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Cliente B2B</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Logradouro Final</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Status Operacional</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                      <td className="p-6 text-sm font-bold text-slate-900">{order.trackingCode}</td>
                      <td className="p-6 text-sm text-slate-600 font-medium">{order.customerName}</td>
                      <td className="p-6 text-sm text-slate-500 font-medium truncate max-w-xs">{order.destination.address}</td>
                      <td className="p-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${
                          order.status === OrderStatus.IN_TRANSIT ? 'bg-amber-100 text-amber-700' :
                          order.status === OrderStatus.DELIVERED ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {order.status === OrderStatus.IN_TRANSIT && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

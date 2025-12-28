
import React, { useState } from 'react';
import AdminDashboard from './views/AdminDashboard';
import DriverDashboard from './views/DriverDashboard';
import CustomerTracking from './views/CustomerTracking';
import { AppProvider } from './lib/store';

const App: React.FC = () => {
  const [view, setView] = useState<'admin' | 'driver' | 'customer'>('customer');

  return (
    <AppProvider>
      <div className="h-screen w-full font-sans antialiased">
        {/* Environment Switcher */}
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 scale-90 md:scale-100">
          <p className="text-[10px] font-black text-slate-400 bg-white/90 px-3 py-1 rounded-full border border-slate-100 shadow-sm backdrop-blur uppercase tracking-tighter">Ambiente Demo</p>
          <div className="flex bg-slate-900 p-1.5 rounded-2xl shadow-2xl border border-white/10">
            <button 
              onClick={() => setView('admin')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${view === 'admin' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >Torre Admin</button>
            <button 
              onClick={() => setView('driver')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${view === 'driver' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >App Motorista</button>
            <button 
              onClick={() => setView('customer')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${view === 'customer' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >Cliente Final</button>
          </div>
        </div>

        {view === 'admin' && <AdminDashboard />}
        {view === 'driver' && <DriverDashboard />}
        {view === 'customer' && <CustomerTracking />}
      </div>
    </AppProvider>
  );
};

export default App;

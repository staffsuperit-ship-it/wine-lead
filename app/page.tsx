"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Footer from '@/components/Footer';
import { Wine, CheckCircle2, ChevronRight, Lock, LogOut } from 'lucide-react';

function FormContent() {
  const searchParams = useSearchParams();
  const wineryId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [wineryData, setWineryData] = useState<any>(null);
  const [fairName, setFairName] = useState('');
  const [fairId, setFairId] = useState<string | null>(null);
  const [wines, setWines] = useState<any[]>([]);

  useEffect(() => { 
    if (wineryId) fetchData();
    else setLoading(false);
  }, [wineryId]);

  async function fetchData() {
    setLoading(true);
    const { data: winery } = await supabase.from('wineries').select('name').eq('id', wineryId).single();
    if (winery) setWineryData(winery);
    const { data: fair } = await supabase.from('fairs').select('id, fair_name').eq('winery_id', wineryId).single();
    if (fair) { setFairName(fair.fair_name); setFairId(fair.id); }
    const { data: winesList } = await supabase.from('wines').select('*').eq('winery_id', wineryId).order('wine_name', { ascending: true });
    if (winesList) setWines(winesList);
    setLoading(false);
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    // ... (logica di invio che già conosciamo)
    setSubmitted(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400 italic">Caricamento... 🍷</div>;

  // SCHERMATA DI ERRORE CON SBLOCCO TOTALE
  if (!wineryId) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center bg-white font-sans">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col items-center max-w-sm">
        <Wine size={64} className="text-red-600 mb-6" />
        <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Wine Link</h1>
        <p className="text-slate-400 mt-4 text-sm font-medium">Link non valido. Scannerizza il QR Code per accedere al form.</p>
        
        {/* TASTO LOGIN FORZATO (TAG <a>) */}
        <a 
          href="/login" 
          className="mt-10 w-full bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-lg"
        >
          <Lock size={16} /> ACCEDI COME CANTINA
        </a>

        {/* TASTO LOGOUT PER "PULIRE" LA SESSIONE */}
        <button 
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
          className="mt-4 text-[10px] font-bold text-slate-300 hover:text-red-400 uppercase tracking-widest flex items-center gap-2"
        >
          <LogOut size={12} /> Reset Sessione / Esci
        </button>
      </div>
    </div>
  );

  // ... (tutto il resto del codice del form rimane uguale)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <main className="flex-grow p-4 max-w-xl mx-auto w-full">
         <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 mb-6 mt-4 text-center">
          <h1 className="text-2xl font-black tracking-tight">{wineryData?.name || 'Benvenuto'} 🍷</h1>
          <p className="text-red-600 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 italic">{fairName || 'In degustazione'}</p>
        </div>
        {/* ... (resto del form) */}
        <p className="text-center text-xs text-slate-400 mt-4 italic">Modulo di acquisizione contatti Wine Link</p>
      </main>
      <Footer />
    </div>
  );
}

export default function LeadForm() {
  return <Suspense fallback={<div>Caricamento...</div>}><FormContent /></Suspense>;
}
"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Footer from '@/components/Footer';
import { Wine, CheckCircle2, ChevronRight, Lock } from 'lucide-react';

function FormContent() {
  const searchParams = useSearchParams();
  const wineryId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [wineryData, setWineryData] = useState<any>(null);
  const [fairName, setFairName] = useState('');
  const [fairId, setFairId] = useState<string | null>(null);
  const [wines, setWines] = useState<any[]>([]);
  
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ruolo, setRuolo] = useState('');
  const [noteGenerali, setNoteGenerali] = useState('');
  const [viniScelti, setViniScelti] = useState<any[]>([]);

  useEffect(() => { 
    if (wineryId) fetchData();
    else setLoading(false);
  }, [wineryId]);

  async function fetchData() {
    setLoading(true);
    try {
        const { data: winery } = await supabase.from('wineries').select('name').eq('id', wineryId).single();
        if (winery) setWineryData(winery);
        const { data: fair } = await supabase.from('fairs').select('id, fair_name').eq('winery_id', wineryId).single();
        if (fair) { setFairName(fair.fair_name); setFairId(fair.id); }
        const { data: winesList } = await supabase.from('wines').select('*').eq('winery_id', wineryId).order('wine_name', { ascending: true });
        if (winesList) setWines(winesList);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const toggleVino = (id: string) => {
    if (viniScelti.find(v => v.id === id)) setViniScelti(viniScelti.filter(v => v.id !== id));
    else setViniScelti([...viniScelti, { id, nota: '' }]);
  };

  const handleNotaVino = (id: string, nota: string) => {
    setViniScelti(viniScelti.map(v => v.id === id ? { ...v, nota } : v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wineryId || !fairId) return;
    const { data: lead, error: leadError } = await supabase.from('leads').insert([{
        first_name: nome, last_name: cognome, phone: '+39' + telefono,
        role: ruolo, general_notes: noteGenerali, fair_id: fairId
      }]).select().single();
    if (leadError) { alert(leadError.message); return; }
    if (viniScelti.length > 0) {
      const tastings = viniScelti.map(v => ({ lead_id: lead.id, wine_id: v.id, note: v.nota }));
      await supabase.from('tastings').insert(tastings);
    }
    setSubmitted(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400 italic bg-white">Caricamento Stand... 🍷</div>;

  if (!wineryId) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center bg-slate-50 font-sans">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 flex flex-col items-center max-w-sm">
        <Wine size={64} className="text-red-600 mb-6" />
        <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Wine Link</h1>
        <p className="text-slate-400 mt-4 text-sm font-medium">Link non valido. Scannerizza il QR Code della cantina.</p>
        <a href="/accesso" className="mt-10 w-full bg-slate-900 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl">
          <Lock size={18} /> AREA RISERVATA
        </a>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <CheckCircle2 size={80} className="text-green-500 mb-4" />
      <h1 className="text-2xl font-bold">Grazie!</h1>
      <p className="text-slate-600 mt-2">La tua visita è stata registrata.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800 font-sans pb-10">
      <main className="flex-grow p-4 max-w-xl mx-auto w-full">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 mb-6 mt-4 text-center">
          <h1 className="text-2xl font-black">{wineryData?.name || 'Wine Link'} 🍷</h1>
          <p className="text-red-600 font-bold uppercase text-[10px] tracking-widest mt-2">{fairName}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border space-y-4">
            <input required type="text" placeholder="Nome" className="p-4 bg-slate-50 rounded-2xl w-full border-none outline-none" onChange={e => setNome(e.target.value)} />
            <input required type="text" placeholder="Cognome" className="p-4 bg-slate-50 rounded-2xl w-full border-none outline-none" onChange={e => setCognome(e.target.value)} />
            <input required type="tel" placeholder="Cellulare" className="p-4 bg-slate-50 rounded-2xl w-full border-none outline-none" onChange={e => setTelefono(e.target.value)} />
            <select required className="p-4 bg-slate-50 rounded-2xl w-full outline-none" onChange={e => setRuolo(e.target.value)}>
              <option value="">Ruolo...</option>
              <option value="Sommelier">Sommelier</option>
              <option value="Ristoratore">Ristorante</option>
              <option value="Buyer">Buyer</option>
              <option value="Appassionato">Appassionato</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-red-600 text-white font-black py-6 rounded-[2.5rem] shadow-xl">INVIA DEGUSTAZIONE</button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

export default function LeadForm() {
  return <Suspense fallback={<div>Caricamento...</div>}><FormContent /></Suspense>;
}
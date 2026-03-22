"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Footer from '@/components/Footer';
import { Wine, CheckCircle2 } from 'lucide-react';

function FormContent() {
  const searchParams = useSearchParams();
  const wineryId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [wineryData, setWineryData] = useState<any>(null);
  const [fairName, setFairName] = useState('');
  const [wines, setWines] = useState<any[]>([]);
  
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ruolo, setRuolo] = useState('');
  const [noteGenerali, setNoteGenerali] = useState('');
  const [viniScelti, setViniScelti] = useState<any[]>([]);

  useEffect(() => { 
    if (wineryId) {
      fetchWineryData();
    } else {
      setLoading(false); // <--- CORREZIONE: Smette di caricare se non c'è l'ID
    }
  }, [wineryId]);

  async function fetchWineryData() {
    setLoading(true);
    try {
      const { data: winery } = await supabase.from('wineries').select('name').eq('id', wineryId).single();
      if (winery) setWineryData(winery);
      const { data: fair } = await supabase.from('fairs').select('id, fair_name').eq('winery_id', wineryId).single();
      if (fair) setFairName(fair.fair_name);
      const { data: winesList } = await supabase.from('wines').select('*').eq('winery_id', wineryId);
      if (winesList) setWines(winesList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const toggleVino = (id: string) => {
    if (viniScelti.find(v => v.id === id)) {
      setViniScelti(viniScelti.filter(v => v.id !== id));
    } else {
      setViniScelti([...viniScelti, { id, nota: '' }]);
    }
  };

  const handleNotaVino = (id: string, nota: string) => {
    setViniScelti(viniScelti.map(v => v.id === id ? { ...v, nota } : v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wineryId) return;

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert([{
        first_name: nome,
        last_name: cognome,
        phone: '+39' + telefono,
        role: ruolo,
        general_notes: noteGenerali,
        fair_id: (await supabase.from('fairs').select('id').eq('winery_id', wineryId).single()).data?.id
      }])
      .select()
      .single();

    if (leadError) { alert(leadError.message); return; }

    if (viniScelti.length > 0) {
      const tastings = viniScelti.map(v => ({
        lead_id: lead.id,
        wine_id: v.id,
        note: v.nota
      }));
      await supabase.from('tastings').insert(tastings);
    }

    setSubmitted(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold italic text-slate-400">
      Caricamento in corso... 🍷
    </div>
  );

  if (!wineryId) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 text-center">
      <Wine size={60} className="text-red-200 mb-4" />
      <h1 className="text-xl font-bold text-slate-800">Link non valido</h1>
      <p className="text-slate-500 mt-2">Scannerizza il QR Code della cantina per accedere al form.</p>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <CheckCircle2 size={80} className="text-green-500 mb-4" />
      <h1 className="text-2xl font-bold text-slate-800">Grazie {nome}!</h1>
      <p className="text-slate-600 mt-2">La tua degustazione è stata registrata correttamente.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans">
      <main className="flex-grow p-4 max-w-xl mx-auto w-full">
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 mb-6 mt-4 text-center">
          <h1 className="text-2xl font-bold">{wineryData?.name || 'Benvenuto'} 🍷</h1>
          <p className="text-red-600 font-medium italic uppercase text-xs tracking-widest">{fairName || 'In degustazione'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border space-y-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">I tuoi contatti</h2>
            <div className="grid grid-cols-2 gap-4">
              <input required type="text" placeholder="Nome" className="p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-red-500 w-full" onChange={e => setNome(e.target.value)} />
              <input required type="text" placeholder="Cognome" className="p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-red-500 w-full" onChange={e => setCognome(e.target.value)} />
            </div>
            <div className="space-y-1">
              <div className="flex bg-slate-50 border rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-red-500">
                <span className="p-4 bg-slate-200 text-slate-500 font-bold border-r text-sm">+39</span>
                <input required type="tel" placeholder="Cellulare" className="p-4 bg-transparent outline-none w-full" onChange={e => setTelefono(e.target.value)} />
              </div>
            </div>
            <select required className="p-4 bg-slate-50 border rounded-2xl w-full outline-none text-sm" onChange={e => setRuolo(e.target.value)}>
              <option value="">Il tuo Ruolo...</option>
              <option value="Sommelier">Sommelier</option>
              <option value="Ristoratore">Ristorante / Bistrot</option>
              <option value="Ente/Buyer">Azienda / Buyer</option>
              <option value="Appassionato">Appassionato</option>
            </select>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border space-y-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vini assaggiati</h2>
            {wines.map((v) => (
              <div key={v.id} className="border-b border-slate-50 pb-3 last:border-0">
                <label className="flex items-center gap-3 cursor-pointer py-2">
                  <input type="checkbox" className="w-6 h-6 rounded-lg accent-red-600 shadow-sm" onChange={() => toggleVino(v.id)} />
                  <span className="font-medium text-slate-700">{v.wine_name}</span>
                </label>
                {viniScelti.find(x => x.id === v.id) && (
                  <input type="text" placeholder="Cosa ne pensi?" className="mt-1 text-sm p-3 w-full bg-red-50 border border-red-100 rounded-xl outline-none" onChange={(e) => handleNotaVino(v.id, e.target.value)} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border space-y-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Note extra</h2>
            <textarea placeholder="Eventuali riflessioni finali..." className="w-full p-4 bg-slate-50 border rounded-2xl h-28 outline-none focus:ring-2 focus:ring-red-500" onChange={e => setNoteGenerali(e.target.value)}></textarea>
          </div>

          <button type="submit" className="w-full bg-red-600 text-white font-bold py-5 rounded-[2rem] shadow-xl active:scale-95 transition-all text-lg flex items-center justify-center gap-2">
            INVIA DEGUSTAZIONE <Wine size={20}/>
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

export default function LeadForm() {
  return <Suspense fallback={<div className="p-20 text-center">Caricamento...</div>}><FormContent /></Suspense>;
}
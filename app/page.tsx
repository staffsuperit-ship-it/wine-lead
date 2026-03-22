export const dynamic = 'force-dynamic';

"use client";
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
    } catch (err) {
        console.error("Errore caricamento:", err);
    }
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

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert([{
        first_name: nome, last_name: cognome, phone: '+39' + telefono,
        role: ruolo, general_notes: noteGenerali, fair_id: fairId
      }])
      .select().single();

    if (leadError) { alert("Errore: " + leadError.message); return; }

    if (viniScelti.length > 0) {
      const tastings = viniScelti.map(v => ({ lead_id: lead.id, wine_id: v.id, note: v.nota }));
      await supabase.from('tastings').insert(tastings);
    }
    setSubmitted(true);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-bold text-slate-400 italic bg-white">
      Caricamento Stand... 🍷
    </div>
  );

  // SCHERMATA SE IL LINK NON È VALIDO (SENZA ID)
  if (!wineryId) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center bg-[#f8fafc] font-sans">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 flex flex-col items-center max-w-sm">
        <div className="bg-red-50 p-6 rounded-full mb-8">
            <Wine size={48} className="text-red-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Wine Link</h1>
        <p className="text-slate-400 mt-4 text-sm font-medium leading-relaxed">
            Link non valido. Scannerizza il QR Code della cantina per accedere.
        </p>
        
        {/* TASTO DI SBLOCCO PER ANDARE AL LOGIN */}
        <button 
          onClick={() => window.location.href = '/login'}
          className="mt-10 w-full bg-slate-900 text-white font-bold py-5 rounded-3xl flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-xl active:scale-95"
        >
          <Lock size={18} /> AREA RISERVATA CANTINE
        </button>
      </div>
      <p className="mt-8 text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">Wine Link Platform</p>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <CheckCircle2 size={80} className="text-green-500 mb-4" />
      <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Grazie!</h1>
      <p className="text-slate-600 mt-2">La tua visita presso <strong>{wineryData?.name}</strong> è stata registrata.</p>
      <button onClick={() => window.location.reload()} className="mt-8 text-red-600 font-bold underline uppercase text-xs">Nuovo Inserimento</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800 font-sans pb-10">
      <main className="flex-grow p-4 max-w-xl mx-auto w-full">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 mb-6 mt-4 text-center">
          <h1 className="text-2xl font-black tracking-tight uppercase italic">{wineryData?.name || 'Wine Link'}</h1>
          <p className="text-red-600 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 italic">{fairName || 'In degustazione'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border space-y-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">I tuoi contatti</h2>
            <div className="grid grid-cols-2 gap-3">
              <input required type="text" placeholder="Nome" className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 w-full text-slate-800" onChange={e => setNome(e.target.value)} />
              <input required type="text" placeholder="Cognome" className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 w-full text-slate-800" onChange={e => setCognome(e.target.value)} />
            </div>
            <div className="flex bg-slate-50 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-red-500">
                <span className="p-4 bg-slate-200 text-slate-500 font-black text-xs flex items-center">+39</span>
                <input required type="tel" placeholder="Cellulare" className="p-4 bg-transparent outline-none w-full text-slate-800" onChange={e => setTelefono(e.target.value)} />
            </div>
            <select required className="p-4 bg-slate-50 rounded-2xl w-full outline-none text-sm appearance-none text-slate-800 font-medium" onChange={e => setRuolo(e.target.value)}>
              <option value="">Il tuo Ruolo...</option>
              <option value="Sommelier">Sommelier</option>
              <option value="Ristoratore">Ristorante / Bistrot</option>
              <option value="Ente/Buyer">Azienda / Buyer</option>
              <option value="Appassionato">Appassionato</option>
            </select>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border space-y-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Degustazione</h2>
            {wines.length === 0 ? <p className="text-center text-slate-300 italic py-4">Nessun vino in lista</p> : 
              wines.map((v) => (
                <div key={v.id} className="border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                  <label className="flex items-center gap-4 cursor-pointer py-1">
                    <div className="relative">
                        <input type="checkbox" className="w-7 h-7 rounded-full accent-red-600 appearance-none border-2 border-slate-200 checked:bg-red-600 checked:border-red-600 transition-all cursor-pointer shadow-sm" onChange={() => toggleVino(v.id)} />
                        {viniScelti.find(x => x.id === v.id) && <div className="absolute inset-0 flex items-center justify-center text-white pointer-events-none text-[10px] font-bold">OK</div>}
                    </div>
                    <span className={`font-bold italic transition-all ${viniScelti.find(x => x.id === v.id) ? 'text-red-600' : 'text-slate-700'}`}>{v.wine_name}</span>
                  </label>
                  {viniScelti.find(x => x.id === v.id) && (
                    <input type="text" placeholder="Cosa ne pensi?" className="mt-3 text-sm p-4 w-full bg-red-50 border border-red-100 rounded-2xl outline-none text-slate-800" onChange={(e) => handleNotaVino(v.id, e.target.value)} />
                  )}
                </div>
              ))
            }
          </div>

          <button type="submit" className="w-full bg-red-600 text-white font-black py-6 rounded-[2.5rem] shadow-2xl shadow-red-200 active:scale-95 transition-all text-lg flex items-center justify-center gap-3">
            REGISTRA VISITA <ChevronRight size={20}/>
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

export default function LeadForm() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-bold">Inizializzazione Stand...</div>}>
      <FormContent />
    </Suspense>
  );
}
"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, LogOut, FileSpreadsheet, Wine, Share2, Copy, Check, Users, MessageCircle, Save, Archive, Settings } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leads'); 
  const [wines, setWines] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [newWine, setNewWine] = useState('');
  const [fairName, setFairName] = useState('');
  const [wineryName, setWineryName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => { checkUser(); }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
    else { setUserId(user.id); fetchData(user.id); }
  }

  async function fetchData(uid: string) {
    setLoading(true);
    
    // 1. Carica Profilo Cantina
    const { data: winery } = await supabase.from('wineries').select('*').eq('id', uid).maybeSingle();
    if (winery) { setWineryName(winery.name || ''); }

    // 2. Carica Fiera Attiva
    const { data: fairData } = await supabase.from('fairs').select('id, fair_name').eq('winery_id', uid).maybeSingle();
    if (fairData) setFairName(fairData.fair_name);

    // 3. Carica Vini
    const { data: winesData } = await supabase.from('wines').select('*').eq('winery_id', uid).order('wine_name', { ascending: true });
    if (winesData) setWines(winesData);

    // 4. Carica Leads con le note dei vini (Tastings)
    if (fairData) {
      const { data: leadsData } = await supabase
        .from('leads')
        .select(`
          *,
          tastings (
            note,
            wines (wine_name)
          )
        `)
        .eq('fair_id', fairData.id)
        .order('created_at', { ascending: false });
      
      if (leadsData) setLeads(leadsData);
    }
    setLoading(false);
  }

  const saveSettings = async () => {
    await supabase.from('wineries').upsert({ id: userId, name: wineryName });
    await supabase.from('fairs').upsert({ winery_id: userId, fair_name: fairName, is_active: true }, { onConflict: 'winery_id' });
    alert("Impostazioni salvate! 🍷");
    fetchData(userId!);
  };

  const archiveLead = async (id: string, state: boolean) => {
    await supabase.from('leads').update({ is_archived: state }).eq('id', id);
    fetchData(userId!);
  };

  const markAsContacted = async (id: string) => {
    await supabase.from('leads').update({ is_contacted: true }).eq('id', id);
    fetchData(userId!);
  };

  const addWine = async () => {
    if (!newWine) return;
    await supabase.from('wines').insert([{ wine_name: newWine, winery_id: userId }]);
    setNewWine(''); fetchData(userId!);
  };

  const deleteWine = async (id: string) => {
    if (confirm("Eliminare questo vino?")) {
      await supabase.from('wines').delete().eq('id', id);
      fetchData(userId!);
    }
  };

  // FUNZIONE WHATSAPP AUTOMATICA
  const getWaLink = (lead: any) => {
    const cleanPhone = lead.phone.replace('+', '').replace(/\s/g, '');
    const message = `Ciao ${lead.first_name}! Sono della cantina ${wineryName}. Grazie per averci visitato al ${fairName}. È stato un piacere conoscerti!`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const publicLink = typeof window !== 'undefined' ? `${window.location.origin}/?id=${userId}` : '';

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 italic">Aggiornamento cantina...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-24">
      <nav className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 text-red-700"><Wine size={24}/><h1 className="font-black text-xl tracking-tighter italic">WINE LINK</h1></div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="bg-slate-50 p-2 rounded-xl text-slate-400"><LogOut size={18}/></button>
      </nav>

      {/* Menu Tabs */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-2 py-2 rounded-3xl flex gap-1 shadow-2xl z-50 border border-white/10">
        <button onClick={() => setActiveTab('leads')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === 'leads' ? 'bg-red-600 shadow-lg' : 'opacity-60'}`}><Users size={16}/> LEAD</button>
        <button onClick={() => setActiveTab('config')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === 'config' ? 'bg-red-600 shadow-lg' : 'opacity-60'}`}><Settings size={16}/> STAND</button>
        <button onClick={() => setActiveTab('archive')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === 'archive' ? 'bg-red-600 shadow-lg' : 'opacity-60'}`}><Archive size={16}/> ARCHIVIO</button>
      </div>

      <main className="p-4 max-w-2xl mx-auto mt-4 space-y-6">

        {activeTab === 'leads' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-xl font-black italic px-2 flex justify-between items-center">
              NUOVI CONTATTI 
              <span className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full not-italic">{leads.filter(l => !l.is_archived).length}</span>
            </h2>
            
            {leads.filter(l => !l.is_archived).map(lead => (
              <div key={lead.id} className={`bg-white p-6 rounded-[2.5rem] shadow-sm border-2 transition-all ${lead.is_contacted ? 'border-green-100' : 'border-slate-100'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-slate-800 leading-none mb-2">{lead.first_name} {lead.last_name}</h3>
                    <div className="flex gap-2 items-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{lead.role}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{lead.phone}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => archiveLead(lead.id, true)} className="p-3 bg-slate-50 rounded-2xl text-slate-300 hover:text-amber-600 transition-colors"><Archive size={18}/></button>
                    <a 
                      href={getWaLink(lead)} 
                      onClick={() => markAsContacted(lead.id)}
                      target="_blank" 
                      className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-95 ${lead.is_contacted ? 'bg-green-100 text-green-700 shadow-none' : 'bg-green-500 text-white hover:bg-green-600'}`}
                    >
                      <MessageCircle size={18}/> {lead.is_contacted ? 'INVIATO' : 'SALUTA'}
                    </a>
                  </div>
                </div>
                
                {/* LISTA VINI ASSAGGIATI E NOTE */}
                <div className="bg-slate-50 rounded-[1.5rem] p-4 border border-slate-100 space-y-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Degustazione fiera:</p>
                  {lead.tastings && lead.tastings.length > 0 ? (
                    lead.tastings.map((t: any, idx: number) => (
                      <div key={idx} className="border-b border-slate-200/60 pb-2 last:border-0 last:pb-0">
                        <p className="text-sm font-bold text-slate-700 italic">🍷 {t.wines?.wine_name}</p>
                        {t.note && <p className="text-xs text-slate-500 ml-4 mt-1 bg-white/50 p-2 rounded-lg border border-slate-100">"{t.note}"</p>}
                      </div>
                    ))
                  ) : <p className="text-xs text-slate-400 italic">Nessun vino selezionato</p>}
                </div>

                {lead.general_notes && (
                  <div className="mt-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                    <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Note Generali:</p>
                    <p className="text-xs text-slate-600 italic">"{lead.general_notes}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab Configurazione Stand */}
        {activeTab === 'config' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="bg-slate-100/50 p-8 rounded-[3rem] border-2 border-white shadow-sm flex flex-col items-center gap-6 text-center">
              <div className="bg-white p-5 rounded-[2.5rem] shadow-2xl shadow-red-100">
                <QRCodeSVG value={publicLink} size={180} level="H" includeMargin={true} />
              </div>
              <div className="space-y-2 w-full">
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Link Pubblico Stand</p>
                <div className="flex gap-2 items-center bg-white p-3 rounded-2xl shadow-inner border border-slate-200">
                  <input readOnly value={publicLink} className="bg-transparent text-[11px] flex-grow outline-none px-2 font-mono" />
                  <button onClick={() => { navigator.clipboard.writeText(publicLink); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="bg-slate-800 text-white p-3 rounded-xl transition-all active:scale-90">
                    {copied ? <Check size={16}/> : <Copy size={16}/>}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-3">Dati della Cantina</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase ml-2 text-slate-400 tracking-widest">Nome Cantina</label>
                  <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-500" value={wineryName} onChange={e => setWineryName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase ml-2 text-slate-400 tracking-widest">Fiera Attiva</label>
                  <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-500" value={fairName} onChange={e => setFairName(e.target.value)} />
                </div>
                <button onClick={saveSettings} className="w-full bg-red-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-red-200 flex items-center justify-center gap-2 hover:bg-red-700 transition-all active:scale-95">
                  <Save size={20}/> AGGIORNA STAND
                </button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b pb-3">Vini in degustazione</h3>
              <div className="flex gap-3 mb-6">
                <input placeholder="Nome del vino..." className="flex-grow p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-500" value={newWine} onChange={e => setNewWine(e.target.value)} onKeyDown={e => e.key === 'Enter' && addWine()} />
                <button onClick={addWine} className="bg-slate-800 text-white p-4 rounded-2xl shadow-lg active:scale-90 transition-all"><Plus/></button>
              </div>
              <div className="grid gap-2">
                {wines.map(w => (
                  <div key={w.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                    <span className="text-sm font-bold italic text-slate-700 uppercase tracking-tight">{w.wine_name}</span>
                    <button onClick={() => deleteWine(w.id)} className="text-slate-200 hover:text-red-500 transition-colors p-2"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Archivio */}
        {activeTab === 'archive' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-xl font-black italic px-2 opacity-30 uppercase tracking-tighter">Archivio Lead</h2>
            {leads.filter(l => l.is_archived).map(lead => (
              <div key={lead.id} className="bg-white p-5 rounded-[2rem] opacity-70 flex justify-between items-center border border-slate-200">
                <div>
                  <p className="font-bold text-slate-800">{lead.first_name} {lead.last_name}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400">{new Date(lead.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => archiveLead(lead.id, false)} className="text-[10px] font-black tracking-widest text-red-600 p-3 bg-red-50 rounded-xl uppercase">Ripristina</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
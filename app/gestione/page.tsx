"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, LogOut, FileSpreadsheet, Wine, Share2, Copy, Check, Users, MessageCircle, Save, Archive, Settings, ExternalLink } from 'lucide-react';
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
  const [publicLink, setPublicLink] = useState('');
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => { checkUser(); }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) window.location.assign('/accesso');
    else { 
      setUserId(user.id); 
      setPublicLink(`${window.location.origin}/?id=${user.id}`);
      await supabase.from('wineries').upsert({ id: user.id });
      fetchData(user.id); 
    }
  }

  async function fetchData(uid: string) {
    setLoading(true);
    const { data: winery } = await supabase.from('wineries').select('*').eq('id', uid).maybeSingle();
    if (winery) setWineryName(winery.name || '');
    const { data: fairData } = await supabase.from('fairs').select('id, fair_name').eq('winery_id', uid).maybeSingle();
    let currentFairId = null;
    if (fairData) { setFairName(fairData.fair_name || ''); currentFairId = fairData.id; }
    const { data: winesData } = await supabase.from('wines').select('*').eq('winery_id', uid).order('wine_name', { ascending: true });
    if (winesData) setWines(winesData);
    if (currentFairId) {
      const { data: leadsData } = await supabase.from('leads').select('*, tastings (note, wines (wine_name))').eq('fair_id', currentFairId).order('created_at', { ascending: false });
      if (leadsData) setLeads(leadsData);
    }
    setLoading(false);
  }

  const saveSettings = async () => {
    if (!userId) return;
    await supabase.from('wineries').upsert({ id: userId, name: wineryName });
    await supabase.from('fairs').upsert({ winery_id: userId, fair_name: fairName, is_active: true }, { onConflict: 'winery_id' });
    alert("Impostazioni Salvate! 🍷");
    fetchData(userId);
  };

  const archiveLead = async (id: string, state: boolean) => {
    await supabase.from('leads').update({ is_archived: state }).eq('id', id);
    fetchData(userId!);
  };

  const addWine = async () => {
    if (!newWine) return;
    await supabase.from('wines').insert([{ wine_name: newWine, winery_id: userId }]);
    setNewWine(''); fetchData(userId!);
  };

  const deleteWine = async (id: string) => {
    if (confirm("Eliminare?")) {
      await supabase.from('wines').delete().eq('id', id);
      fetchData(userId!);
    }
  };

  const getWaLink = (lead: any) => {
    const phone = lead.phone ? lead.phone.replace(/\D/g, '') : '';
    const msg = `Ciao ${lead.first_name}! Sono della cantina ${wineryName}. Grazie per averci visitato al ${fairName}. È stato un piacere conoscerti!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 italic">Aggiornamento... 🍷</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-32">
      {/* NAVBAR */}
      <nav className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 text-red-700">
            <Wine size={24}/>
            <h1 className="font-black text-xl tracking-tighter italic uppercase leading-none text-slate-800">Wine Link</h1>
        </div>
        <div className="flex gap-2">
            <a href={publicLink} target="_blank" className="p-2 bg-slate-50 rounded-xl text-slate-400 border border-slate-100"><ExternalLink size={20}/></a>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.assign('/accesso'))} className="bg-slate-50 p-2 rounded-xl text-slate-400 border border-slate-100"><LogOut size={20}/></button>
        </div>
      </nav>

      {/* TABS MENU */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-slate-200 p-2 rounded-[2.5rem] flex gap-2 shadow-2xl z-50 w-[92%] max-w-sm">
        <button onClick={() => setActiveTab('leads')} className={`flex-1 flex flex-col items-center justify-center py-3 rounded-[2rem] transition-all ${activeTab === 'leads' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}>
            <Users size={18}/><span className="text-[9px] font-bold uppercase mt-1">Lead</span>
        </button>
        <button onClick={() => setActiveTab('config')} className={`flex-1 flex flex-col items-center justify-center py-3 rounded-[2rem] transition-all ${activeTab === 'config' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}>
            <Settings size={18}/><span className="text-[9px] font-bold uppercase mt-1">Stand</span>
        </button>
        <button onClick={() => setActiveTab('archive')} className={`flex-1 flex flex-col items-center justify-center py-3 rounded-[2rem] transition-all ${activeTab === 'archive' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}>
            <Archive size={18}/><span className="text-[9px] font-bold uppercase mt-1">Archivio</span>
        </button>
      </div>

      <main className="p-4 max-w-2xl mx-auto mt-4 space-y-6">

        {activeTab === 'leads' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black italic px-2">VISITE RICEVUTE</h2>
            {leads.filter(l => !l.is_archived).length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 italic font-medium">In attesa dei primi visitatori...</div>
            ) : (
              leads.filter(l => !l.is_archived).map(lead => (
                <div key={lead.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-xl leading-none mb-1 uppercase italic tracking-tighter">{lead.first_name} {lead.last_name}</h3>
                      <span className="text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{lead.role}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => archiveLead(lead.id, true)} className="p-3 bg-slate-50 rounded-2xl text-slate-300 hover:text-amber-600 transition-colors"><Archive size={18}/></button>
                      <a href={getWaLink(lead)} target="_blank" className="bg-green-500 text-white p-3 rounded-2xl shadow-lg active:scale-90 flex items-center gap-2 text-xs font-bold uppercase">
                        <MessageCircle size={18}/> SALUTA
                      </a>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-[1.5rem] p-4 border border-slate-100 space-y-3">
                    {lead.tastings?.map((t: any, idx: number) => (
                      <div key={idx} className="border-b border-slate-200/50 pb-2 last:border-0 last:pb-0">
                        <p className="text-sm font-bold text-slate-800 italic">🍷 {t.wines?.wine_name}</p>
                        {t.note && <p className="text-xs text-slate-500 ml-4 mt-1 border-l-2 border-slate-200 pl-2">"{t.note}"</p>}
                      </div>
                    ))}
                    {lead.general_notes && <p className="text-xs text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-100 italic font-medium"><strong>Memo:</strong> {lead.general_notes}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 flex flex-col items-center gap-6 shadow-sm">
              <QRCodeSVG value={publicLink} size={160} level="H" includeMargin={true} />
              <div className="flex gap-2 items-center bg-slate-50 p-3 rounded-2xl border border-slate-200 w-full">
                <input readOnly value={publicLink} className="bg-transparent text-[11px] flex-grow outline-none px-2 font-mono text-slate-400" />
                <button onClick={() => { navigator.clipboard.writeText(publicLink); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="bg-slate-800 text-white p-3 rounded-xl">{copied ? <Check size={16}/> : <Copy size={16}/>}</button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Stand e Fiera</h3>
                <input placeholder="Nome Cantina" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold" value={wineryName} onChange={e => setWineryName(e.target.value)} />
                <input placeholder="Fiera" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold" value={fairName} onChange={e => setFairName(e.target.value)} />
                <button onClick={saveSettings} className="w-full bg-red-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-red-200 uppercase tracking-widest">Aggiorna Stand</button>
            </div>

            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Vini nel modulo</h3>
              <div className="flex gap-2 mb-4">
                <input placeholder="Aggiungi vino..." className="flex-grow p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={newWine} onChange={e => setNewWine(e.target.value)} onKeyDown={e => e.key === 'Enter' && addWine()} />
                <button onClick={addWine} className="bg-slate-800 text-white p-4 rounded-2xl shadow-lg"><Plus/></button>
              </div>
              <div className="space-y-2">
                {wines.map(w => (
                  <div key={w.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                    <span className="text-sm font-bold italic">{w.wine_name}</span>
                    <button onClick={() => deleteWine(w.id)} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* TAB ARCHIVIO UGUALE */}
      </main>
    </div>
  );
}
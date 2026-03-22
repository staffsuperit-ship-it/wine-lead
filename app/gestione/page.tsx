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
    if (!user) router.push('/accesso');
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
    alert("Impostazioni Stand Salvate!");
    fetchData(userId);
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
    if (confirm("Eliminare?")) {
      await supabase.from('wines').delete().eq('id', id);
      fetchData(userId!);
    }
  };

  const getWaLink = (lead: any) => {
    const phone = lead.phone ? lead.phone.replace(/\D/g, '') : '';
    const msg = `Ciao ${lead.first_name}! Sono della cantina ${wineryName}. Grazie per averci visitato al ${fairName}.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 italic">Aggiornamento...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-32">
      <nav className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 text-red-700 font-black text-xl italic uppercase">Wine Link</div>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.assign('/accesso'))} className="bg-slate-50 p-2 rounded-xl text-slate-400"><LogOut size={20}/></button>
      </nav>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-slate-200 p-2 rounded-[2.5rem] flex gap-2 shadow-2xl z-50 w-[90%] max-w-sm">
        <button onClick={() => setActiveTab('leads')} className={`flex-1 flex flex-col items-center justify-center py-3 rounded-[2rem] transition-all ${activeTab === 'leads' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}><Users size={18}/><span className="text-[9px] font-bold uppercase mt-1">Lead</span></button>
        <button onClick={() => setActiveTab('config')} className={`flex-1 flex flex-col items-center justify-center py-3 rounded-[2rem] transition-all ${activeTab === 'config' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}><Settings size={18}/><span className="text-[9px] font-bold uppercase mt-1">Stand</span></button>
        <button onClick={() => setActiveTab('archive')} className={`flex-1 flex flex-col items-center justify-center py-3 rounded-[2rem] transition-all ${activeTab === 'archive' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}><Archive size={18}/><span className="text-[9px] font-bold uppercase mt-1">Archivio</span></button>
      </div>

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        {activeTab === 'leads' && (
          <div className="space-y-4">
            {leads.filter(l => !l.is_archived).map(lead => (
              <div key={lead.id} className={`bg-white p-6 rounded-[2.5rem] shadow-sm border-2 transition-all ${lead.is_contacted ? 'border-green-100' : 'border-slate-50'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div><h3 className="font-bold text-xl">{lead.first_name} {lead.last_name}</h3><span className="text-[9px] font-black uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{lead.role}</span></div>
                  <div className="flex gap-2">
                    <button onClick={() => archiveLead(lead.id, true)} className="p-3 bg-slate-50 rounded-2xl text-slate-300"><Archive size={18}/></button>
                    <a href={getWaLink(lead)} onClick={() => markAsContacted(lead.id)} target="_blank" className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs ${lead.is_contacted ? 'bg-green-100 text-green-700' : 'bg-green-500 text-white shadow-lg'}`}><MessageCircle size={18}/> {lead.is_contacted ? 'INVIATO' : 'SALUTA'}</a>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-[1.5rem] p-4 border border-slate-100 space-y-2">
                  {lead.tastings?.map((t: any, idx: number) => (
                    <div key={idx} className="border-b border-slate-200/50 pb-2 last:border-0 last:pb-0">
                      <p className="text-sm font-bold text-slate-800 italic">🍷 {t.wines?.wine_name}</p>
                      {t.note && <p className="text-xs text-slate-500 ml-4 mt-1 italic">"{t.note}"</p>}
                    </div>
                  ))}
                  {lead.general_notes && <p className="text-xs text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-100 italic"><strong>Memo:</strong> {lead.general_notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 flex flex-col items-center gap-6 shadow-sm">
              <QRCodeSVG value={publicLink} size={160} level="H" includeMargin={true} />
              <div className="w-full flex gap-2 items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <input readOnly value={publicLink} className="bg-transparent text-[11px] flex-grow outline-none px-2 font-mono" />
                <button onClick={() => { navigator.clipboard.writeText(publicLink); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="bg-slate-800 text-white p-3 rounded-xl">{copied ? <Check size={16}/> : <Copy size={16}/>}</button>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 space-y-4">
              <input placeholder="Nome Cantina" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={wineryName} onChange={e => setWineryName(e.target.value)} />
              <input placeholder="Fiera Attiva" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={fairName} onChange={e => setFairName(e.target.value)} />
              <button onClick={saveSettings} className="w-full bg-red-600 text-white font-black py-5 rounded-[2rem] shadow-xl uppercase">Salva Stand</button>
            </div>
          </div>
        )}
        
        {activeTab === 'archive' && (
          <div className="space-y-4 animate-in fade-in">
            {leads.filter(l => l.is_archived).map(lead => (
              <div key={lead.id} className="bg-white p-5 rounded-[2rem] opacity-70 flex justify-between items-center border border-slate-200">
                <div><p className="font-bold">{lead.first_name} {lead.last_name}</p><p className="text-[10px] uppercase text-slate-400">{new Date(lead.created_at).toLocaleDateString()}</p></div>
                <button onClick={() => archiveLead(lead.id, false)} className="text-[10px] font-black text-red-600 p-3 bg-red-50 rounded-xl uppercase tracking-widest">Ripristina</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
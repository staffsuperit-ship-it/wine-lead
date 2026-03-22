"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, LogOut, FileSpreadsheet, Wine, Share2, Copy, Check, Users, MessageCircle, Save, Archive, Settings, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leads'); // leads, wines, settings
  const [wines, setWines] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [newWine, setNewWine] = useState('');
  const [fairName, setFairName] = useState('');
  const [wineryName, setWineryName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [waMessage, setWaMessage] = useState('');
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
    const { data: winery } = await supabase.from('wineries').select('*').eq('id', uid).maybeSingle();
    if (winery) { 
      setWineryName(winery.name || ''); 
      setWaMessage(winery.whatsapp_welcome_link || ''); 
      setWebsiteUrl(winery.website_url || '');
    }
    const { data: winesData } = await supabase.from('wines').select('*').eq('winery_id', uid).order('created_at', { ascending: false });
    if (winesData) setWines(winesData);
    const { data: fairData } = await supabase.from('fairs').select('id, fair_name').eq('winery_id', uid).maybeSingle();
    if (fairData) setFairName(fairData.fair_name);
    if (fairData) {
      const { data: leadsData } = await supabase.from('leads').select('*, tastings(*, wines(*))').eq('fair_id', fairData.id).order('created_at', { ascending: false });
      if (leadsData) setLeads(leadsData);
    }
    setLoading(false);
  }

  const saveSettings = async () => {
    await supabase.from('wineries').upsert({ id: userId, name: wineryName, whatsapp_welcome_link: waMessage, website_url: websiteUrl });
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

  const getWaLink = (lead: any) => {
    const cleanPhone = lead.phone.replace('+', '').replace(/\s/g, '');
    const message = waMessage
      .replace('[NOME]', lead.first_name)
      .replace('[CANTINA]', wineryName)
      .replace('[SITO]', websiteUrl);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const publicLink = typeof window !== 'undefined' ? `${window.location.origin}/?id=${userId}` : '';

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 italic">Caricamento in corso...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-24">
      {/* Header */}
      <nav className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 text-red-700"><Wine size={24}/><h1 className="font-black text-xl tracking-tighter italic">WINE LINK</h1></div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="bg-slate-50 p-2 rounded-xl text-slate-400"><LogOut size={18}/></button>
      </nav>

      {/* Tabs Menu (Fisso in basso per mobile) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-2 py-2 rounded-3xl flex gap-1 shadow-2xl z-50 border border-white/10">
        <button onClick={() => setActiveTab('leads')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === 'leads' ? 'bg-red-600 shadow-lg scale-105' : 'opacity-60'}`}><Users size={16}/> LEAD</button>
        <button onClick={() => setActiveTab('config')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === 'config' ? 'bg-red-600 shadow-lg scale-105' : 'opacity-60'}`}><Settings size={16}/> STAND</button>
        <button onClick={() => setActiveTab('archive')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === 'archive' ? 'bg-red-600 shadow-lg scale-105' : 'opacity-60'}`}><Archive size={16}/> ARCHIVIO</button>
      </div>

      <main className="p-4 max-w-2xl mx-auto space-y-6">

        {/* --- TAB LEAD ATTIVI --- */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black italic px-2">NUOVI CONTATTI</h2>
            {leads.filter(l => !l.is_archived).length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 italic">Nessun lead attivo</div>
            ) : (
              leads.filter(l => !l.is_archived).map(lead => (
                <div key={lead.id} className={`bg-white p-5 rounded-[2rem] shadow-sm border-2 transition-all ${lead.is_contacted ? 'border-green-100' : 'border-slate-100'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 leading-none mb-1">{lead.first_name} {lead.last_name}</h3>
                      <span className="text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{lead.role}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => archiveLead(lead.id, true)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-amber-600 transition-colors"><Archive size={18}/></button>
                      <a 
                        href={getWaLink(lead)} 
                        onClick={() => markAsContacted(lead.id)}
                        target="_blank" 
                        className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-95 ${lead.is_contacted ? 'bg-green-100 text-green-700' : 'bg-green-500 text-white'}`}
                      >
                        <MessageCircle size={18}/> {lead.is_contacted ? 'CONTATTATO' : 'FOLLOW-UP'}
                      </a>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-3">
                    {lead.tastings?.map((t: any) => (
                      <div key={t.id} className="mb-2 last:mb-0 border-b border-slate-200 pb-1 last:border-0">
                        <p className="text-sm font-bold text-slate-700 italic">🍷 {t.wines?.wine_name}</p>
                        {t.note && <p className="text-xs text-slate-500 ml-5 italic">"{t.note}"</p>}
                      </div>
                    ))}
                  </div>
                  {lead.general_notes && <p className="text-xs text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-100 italic"><strong>Memo:</strong> {lead.general_notes}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* --- TAB ARCHIVIO --- */}
        {activeTab === 'archive' && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-black italic px-2 opacity-50 uppercase">Archivio Lead</h2>
            {leads.filter(l => l.is_archived).map(lead => (
              <div key={lead.id} className="bg-white p-4 rounded-3xl opacity-60 flex justify-between items-center border border-slate-200">
                <div>
                  <p className="font-bold text-slate-800">{lead.first_name} {lead.last_name}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400">{new Date(lead.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => archiveLead(lead.id, false)} className="text-xs font-bold text-red-600 p-3 bg-red-50 rounded-xl">RIPRISTINA</button>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB CONFIGURAZIONE --- */}
        {activeTab === 'config' && (
          <div className="space-y-6 animate-in slide-in-from-right">
            {/* Link e QR Code */}
            <div className="bg-slate-100/50 p-6 rounded-[2.5rem] border-2 border-white shadow-sm flex flex-col items-center gap-4 text-center">
              <div className="bg-white p-4 rounded-[2rem] shadow-xl">
                <QRCodeSVG value={publicLink} size={150} level="H" includeMargin={true} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Link Fiera</p>
                <div className="flex gap-2 items-center bg-white p-2 rounded-2xl shadow-inner border border-slate-200">
                  <input readOnly value={publicLink} className="bg-transparent text-[10px] w-40 outline-none px-2 font-mono" />
                  <button onClick={() => { navigator.clipboard.writeText(publicLink); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="bg-slate-800 text-white p-3 rounded-xl">
                    {copied ? <Check size={14}/> : <Copy size={14}/>}
                  </button>
                </div>
              </div>
            </div>

            {/* Impostazioni */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-tighter">Profilo e Messaggio WhatsApp</h3>
              <div className="space-y-3">
                <input placeholder="Nome Cantina" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={wineryName} onChange={e => setWineryName(e.target.value)} />
                <input placeholder="Fiera Attiva" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={fairName} onChange={e => setFairName(e.target.value)} />
                <input placeholder="Sito Web (es: https://cantina.it)" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} />
                <textarea placeholder="Messaggio WhatsApp... [NOME], [CANTINA], [SITO]" className="w-full p-4 bg-slate-50 rounded-2xl outline-none h-24 text-sm" value={waMessage} onChange={e => setWaMessage(e.target.value)}></textarea>
                <button onClick={saveSettings} className="w-full bg-red-600 text-white font-bold py-5 rounded-[2rem] shadow-lg shadow-red-200 flex items-center justify-center gap-2"><Save size={20}/> SALVA TUTTO</button>
              </div>
            </div>

            {/* Vini */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-4">Lista Vini in Fiera</h3>
              <div className="flex gap-2 mb-4">
                <input placeholder="Nuovo vino..." className="flex-grow p-4 bg-slate-50 rounded-2xl outline-none" value={newWine} onChange={e => setNewWine(e.target.value)} />
                <button onClick={addWine} className="bg-slate-800 text-white p-4 rounded-2xl"><Plus/></button>
              </div>
              <div className="space-y-2">
                {wines.map(w => (
                  <div key={w.id} className="p-3 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                    <span className="text-sm font-bold italic">{w.wine_name}</span>
                    <button onClick={() => deleteWine(w.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
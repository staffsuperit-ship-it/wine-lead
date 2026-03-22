export const dynamic = 'force-dynamic';

"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Wine, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password: password 
    });

    if (error) {
      alert("Errore Accesso: " + error.message);
      setLoading(false);
    } else {
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-10">
          <div className="bg-red-600 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
              <Wine className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Area Cantina</h1>
          <p className="text-slate-400 mt-2 font-medium">Accedi al tuo pannello Wine Link</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Email Aziendale</label>
            <input 
              required type="email" placeholder="esempio@cantina.it" 
              className="w-full p-5 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all text-slate-800 font-medium"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Password</label>
            <div className="relative">
                <input 
                  required type="password" placeholder="••••••••" 
                  className="w-full p-5 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all text-slate-800 font-medium"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${loading ? 'opacity-50' : 'hover:bg-red-700 shadow-red-200'}`}
          >
            {loading ? 'ACCESSO IN CORSO...' : 'ENTRA NEL PANNELLO'}
            <ArrowRight size={20} />
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest italic">Piattaforma protetta da Wine Link</p>
        </div>
      </div>
    </div>
  );
}
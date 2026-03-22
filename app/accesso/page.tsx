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
    if (error) { alert(error.message); setLoading(false); }
    else { window.location.assign('/gestione'); } // Usiamo assign per sicurezza
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-black text-slate-900 text-center uppercase italic">Accesso</h1>
        <form onSubmit={handleLogin} className="space-y-5 mt-8">
          <input required type="email" placeholder="Email" className="w-full p-5 bg-slate-100 rounded-2xl text-slate-800 outline-none" onChange={e => setEmail(e.target.value)} />
          <input required type="password" placeholder="Password" className="w-full p-5 bg-slate-100 rounded-2xl text-slate-800 outline-none" onChange={e => setPassword(e.target.value)} />
          <button type="submit" disabled={loading} className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl">
            {loading ? 'ENTRANDO...' : 'ACCEDI'}
          </button>
        </form>
      </div>
    </div>
  );
}
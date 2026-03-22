"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), // Rimuove eventuali spazi vuoti prima o dopo
      password: password 
    });

    if (error) {
      alert("Errore Accesso: " + error.message);
      setLoading(false);
    } else {
      console.log("Login effettuato con successo:", data);
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Area Cantina 🍷</h1>
          <p className="text-slate-500 mt-2">Inserisci le tue credenziali</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 ml-1">Email</label>
            <input 
              type="email" 
              placeholder="esempio@mail.com" 
              className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 ml-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 ${loading ? 'opacity-50' : 'hover:bg-red-700'}`}
          >
            {loading ? 'ACCESSO IN CORSO...' : 'ACCEDI AL PANNELLO'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm italic">Accesso riservato alle cantine partner</p>
        </div>
      </div>
    </div>
  );
}

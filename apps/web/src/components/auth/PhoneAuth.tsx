import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface PhoneAuthProps {
  onSubmit: (phone: string) => Promise<{ devCode?: string }>;
}

export function PhoneAuth({ onSubmit }: PhoneAuthProps) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDisplay = (value: string) => {
    const d = value.replace(/\D/g, '').slice(0, 9);
    if (d.length <= 3) return d;
    if (d.length <= 6) return d.slice(0, 3) + ' ' + d.slice(3);
    return d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + d.slice(6);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 9));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 9) { setError('Introduz um número de telemóvel válido'); return; }
    setLoading(true); setError('');
    try { await onSubmit(phone); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao enviar código'); }
    finally { setLoading(false); }
  };

  return (
    <div className="w-full">
      <h2 className="text-[2rem] font-black text-slate-900 mb-2 tracking-tight leading-tight">Entrar</h2>
      <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
        Introduz o teu número de telemóvel português.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2.5">
            Telemóvel
          </label>
          <div className={`flex items-stretch bg-white rounded-2xl overflow-hidden shadow-card border-2 transition-all ${
            error ? 'border-rose-400' : 'border-white focus-within:border-green-500'
          }`}>
            <div className="flex items-center gap-2 pl-4 pr-3.5 border-r border-slate-100 shrink-0 my-2">
              <span className="text-lg leading-none">🇵🇹</span>
              <span className="text-sm font-bold text-slate-400">+351</span>
            </div>
            <input
              type="tel"
              value={formatDisplay(phone)}
              onChange={handleChange}
              placeholder="9XX XXX XXX"
              className="flex-1 px-4 py-4 bg-transparent text-slate-900 placeholder-slate-300 outline-none text-lg font-semibold tracking-wide"
              autoComplete="tel"
            />
          </div>
          {error && <p className="text-rose-500 text-xs mt-2 font-semibold">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || phone.length < 9}
          className="w-full py-[15px] bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-[15px] transition-all active:scale-[0.98] shadow-lg shadow-green-200/70"
        >
          {loading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><span>Continuar</span><ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </form>
    </div>
  );
}

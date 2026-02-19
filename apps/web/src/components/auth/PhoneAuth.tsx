import { useState } from 'react';
import { Phone, ArrowRight, AlertCircle } from 'lucide-react';

interface PhoneAuthProps {
  onSubmit: (phone: string) => Promise<void>;
  loading: boolean;
}

export function PhoneAuth({ onSubmit, loading }: PhoneAuthProps) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 9);
    setPhone(formatPhone(raw));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 9) {
      setError('Introduza um numero de telefone valido com 9 digitos');
      return;
    }
    try {
      await onSubmit(digits);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar codigo');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">
          Numero de telemovel
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
            <Phone className="w-4 h-4" />
            <span className="text-sm font-medium text-slate-500">+351</span>
          </div>
          <input
            type="tel"
            value={phone}
            onChange={handleChange}
            placeholder="912 345 678"
            className="w-full pl-[5.5rem] pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
            autoFocus
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || phone.replace(/\D/g, '').length !== 9}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-all"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Enviar codigo
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}

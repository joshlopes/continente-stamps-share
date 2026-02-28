import { useState } from 'react';
import { ArrowRight, User, MapPin, Mail, Calendar, AlertCircle, Stamp } from 'lucide-react';
import { PORTUGAL_DISTRICTS } from '../lib/constants';

interface OnboardingPageProps {
  phone: string;
  onComplete: (data: { displayName: string; email: string; dateOfBirth: string; district: string }) => Promise<void>;
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [district, setDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (displayName.length < 2) {
      setError('O nome precisa de pelo menos 2 caracteres');
      return false;
    }
    if (!email.includes('@')) {
      setError('Introduz um email válido');
      return false;
    }
    if (!dateOfBirth) {
      setError('Seleciona a tua data de nascimento');
      return false;
    }
    if (!district) {
      setError('Seleciona o teu distrito');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await onComplete({ displayName, email, dateOfBirth, district });
    } catch (err: any) {
      setError(err.message || 'Erro ao guardar dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col">
      {/* Header */}
      <div className="p-4 pt-8">
        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Stamp className="w-7 h-7 text-green-600" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-900">Bem-vindo ao TrocaSelos!</h1>
          <p className="text-sm text-slate-500 mt-1">Completa o teu perfil para começar</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-4 pb-8">
        <div className="w-full max-w-sm mx-auto space-y-4">
          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-1.5">
              <User className="w-3.5 h-3.5" />
              Nome de utilizador
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
              placeholder="O teu nome"
              className="w-full py-3.5 px-4 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-1.5">
              <Mail className="w-3.5 h-3.5" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="email@exemplo.com"
              className="w-full py-3.5 px-4 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Data de nascimento
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => { setDateOfBirth(e.target.value); setError(''); }}
              max={new Date().toISOString().split('T')[0]}
              className="w-full py-3.5 px-4 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
            />
          </div>

          {/* District */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Distrito
            </label>
            <select
              value={district}
              onChange={(e) => { setDistrict(e.target.value); setError(''); }}
              className="w-full py-3.5 px-4 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
            >
              <option value="">Seleciona o teu distrito</option>
              {PORTUGAL_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-all mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Começar a usar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

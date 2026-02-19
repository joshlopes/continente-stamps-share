import { useState } from 'react';
import { ArrowRight, User, MapPin, Mail, Calendar, AlertCircle } from 'lucide-react';
import { PORTUGAL_DISTRICTS } from '../lib/constants';

interface OnboardingPageProps {
  phone: string;
  onComplete: (data: { displayName: string; email: string; dateOfBirth: string; district: string }) => Promise<void>;
}

export function OnboardingPage({ phone, onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [district, setDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    {
      title: 'Como te chamas?',
      subtitle: 'O nome que os outros utilizadores vao ver',
      icon: User,
      content: (
        <input
          type="text"
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
          placeholder="O teu nome"
          className="w-full py-3.5 px-4 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
          autoFocus
        />
      ),
      validate: () => {
        if (displayName.length < 2) { setError('O nome precisa de pelo menos 2 caracteres'); return false; }
        return true;
      },
    },
    {
      title: 'O teu email',
      subtitle: 'Para te contactarmos se necessario',
      icon: Mail,
      content: (
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder="email@exemplo.com"
          className="w-full py-3.5 px-4 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
          autoFocus
        />
      ),
      validate: () => {
        if (!email.includes('@')) { setError('Introduz um email valido'); return false; }
        return true;
      },
    },
    {
      title: 'Data de nascimento',
      subtitle: 'Para verificar a tua idade',
      icon: Calendar,
      content: (
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => { setDateOfBirth(e.target.value); setError(''); }}
          max={new Date().toISOString().split('T')[0]}
          className="w-full py-3.5 px-4 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
          autoFocus
        />
      ),
      validate: () => {
        if (!dateOfBirth) { setError('Seleciona a tua data de nascimento'); return false; }
        return true;
      },
    },
    {
      title: 'Onde moras?',
      subtitle: 'Para mostrar ofertas da tua zona',
      icon: MapPin,
      content: (
        <select
          value={district}
          onChange={(e) => { setDistrict(e.target.value); setError(''); }}
          className="w-full py-3.5 px-4 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
          autoFocus
        >
          <option value="">Seleciona o teu distrito</option>
          {PORTUGAL_DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      ),
      validate: () => {
        if (!district) { setError('Seleciona o teu distrito'); return false; }
        return true;
      },
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;
  const isLast = step === steps.length - 1;

  const handleNext = async () => {
    if (!currentStep.validate()) return;

    if (isLast) {
      setLoading(true);
      setError('');
      try {
        await onComplete({ displayName, email, dateOfBirth, district });
      } catch (err: any) {
        setError(err.message || 'Erro ao guardar dados');
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col">
      {/* Progress */}
      <div className="p-4">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= step ? 'bg-green-500' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 -mt-8">
        <div className="w-full max-w-sm space-y-6">
          {/* Icon */}
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
            <Icon className="w-7 h-7 text-green-600" />
          </div>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900">{currentStep.title}</h2>
            <p className="text-sm text-slate-500 mt-1">{currentStep.subtitle}</p>
          </div>

          {/* Input */}
          {currentStep.content}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Button */}
          <button
            onClick={handleNext}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLast ? 'Concluir' : 'Continuar'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

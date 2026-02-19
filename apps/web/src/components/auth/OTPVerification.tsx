import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react';

interface OTPVerificationProps {
  phone: string;
  onVerify: (code: string) => Promise<void>;
  onBack: () => void;
  loading: boolean;
  devCode?: string;
}

export function OTPVerification({ phone, onVerify, onBack, loading, devCode }: OTPVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];

    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6);
      for (let i = 0; i < 6; i++) {
        newCode[i] = digits[i] || '';
      }
      setCode(newCode);
      const nextEmpty = digits.length < 6 ? digits.length : 5;
      inputs.current[nextEmpty]?.focus();

      if (digits.length === 6) {
        handleSubmit(newCode.join(''));
      }
      return;
    }

    newCode[index] = value;
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (newCode.every((d) => d !== '') && newCode.join('').length === 6) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (codeStr?: string) => {
    const finalCode = codeStr || code.join('');
    if (finalCode.length !== 6) {
      setError('Introduza o codigo completo de 6 digitos');
      return;
    }
    try {
      await onVerify(finalCode);
    } catch (err: any) {
      setError(err.message || 'Codigo invalido');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    }
  };

  const formattedPhone = `+351 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Alterar numero
      </button>

      <div className="text-center space-y-1">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6 text-green-600" />
        </div>
        <p className="text-sm text-slate-500">
          Enviamos um codigo para
        </p>
        <p className="font-semibold text-slate-900">{formattedPhone}</p>
      </div>

      {devCode && (
        <div className="flex items-center justify-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-xs font-medium text-amber-700">DEV: {devCode}</span>
        </div>
      )}

      <div className="flex justify-center gap-2.5">
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-11 h-13 text-center text-lg font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
          />
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={() => handleSubmit()}
        disabled={loading || code.some((d) => !d)}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-all"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          'Verificar codigo'
        )}
      </button>
    </div>
  );
}

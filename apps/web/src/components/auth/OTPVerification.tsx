import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';

interface OTPVerificationProps {
  phone: string;
  devCode?: string;
  onVerify: (code: string) => Promise<void>;
  onBack: () => void;
  onResend?: () => Promise<void>;
}

export function OTPVerification({ phone, devCode, onVerify, onBack, onResend }: OTPVerificationProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      const filled = [...newDigits];
      pasted.split('').forEach((d, i) => { if (index + i < 6) filled[index + i] = d; });
      setDigits(filled);
      const nextEmpty = filled.findIndex((d) => d === '');
      inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
      const code = filled.join('');
      if (code.length === 6 && !filled.includes('')) handleVerify(code);
      return;
    }
    newDigits[index] = value;
    setDigits(newDigits);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    const code = newDigits.join('');
    if (code.length === 6 && !newDigits.includes('')) handleVerify(code);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async (code: string) => {
    setLoading(true); setError('');
    try { await onVerify(code); }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !onResend) return;
    setResendCooldown(30); setDigits(['', '', '', '', '', '']); setError('');
    try { await onResend(); }
    catch { setError('Erro ao reenviar código'); }
  };

  const maskedPhone = phone.slice(0, -4).replace(/\d/g, '•') + phone.slice(-4);

  return (
    <div className="w-full">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-medium mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mb-6">
        <Lock className="w-5 h-5 text-green-600" />
      </div>

      <h2 className="text-[2rem] font-black text-slate-900 mb-2 tracking-tight leading-tight">Verificar número</h2>
      <p className="text-slate-500 text-[15px] leading-relaxed mb-7">
        Enviámos um código para{' '}
        <span className="font-semibold text-slate-700">+351 {maskedPhone}</span>
      </p>

      {devCode && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6">
          <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest mb-1">Modo Dev</p>
          <p className="text-xl font-black text-amber-800 tracking-[0.3em]">{devCode}</p>
        </div>
      )}

      <div className="flex gap-2 mb-5 max-w-xs">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-12 h-12 text-center text-2xl font-black rounded-xl border-2 bg-white outline-none transition-all ${
              loading ? 'opacity-40' :
              digit ? 'border-green-500 text-green-700 bg-green-50' :
              'border-slate-200 text-slate-900 focus:border-green-400 focus:bg-green-50/30'
            }`}
            disabled={loading}
          />
        ))}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 mb-4">
          <p className="text-rose-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2.5 text-sm text-slate-500 mb-4">
          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <span>A verificar...</span>
        </div>
      )}

      {onResend && (
        <button onClick={handleResend} disabled={resendCooldown > 0}
          className="text-sm font-medium disabled:opacity-40 text-slate-400 hover:text-green-600 transition-colors">
          {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Não recebeste? Reenviar código'}
        </button>
      )}
    </div>
  );
}

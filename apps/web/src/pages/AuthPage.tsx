import { useState } from 'react';
import { Stamp } from 'lucide-react';
import { PhoneAuth } from '../components/auth/PhoneAuth';
import { OTPVerification } from '../components/auth/OTPVerification';

interface AuthPageProps {
  onSendOtp: (phone: string) => Promise<{ success: boolean; phone: string; devCode?: string }>;
  onVerifyOtp: (phone: string, code: string) => Promise<any>;
}

export function AuthPage({ onSendOtp, onVerifyOtp }: AuthPageProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [devCode, setDevCode] = useState<string | undefined>();

  const handleSendOtp = async (phone: string) => {
    const result = await onSendOtp(phone);
    setNormalizedPhone(result.phone);
    setDevCode(result.devCode);
    setStep('otp');
    return result;
  };

  const handleResend = async () => {
    const result = await onSendOtp(normalizedPhone);
    setDevCode(result.devCode);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-green-200/30 blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] rounded-full bg-amber-200/20 blur-3xl translate-y-1/2 -translate-x-1/4" />
      </div>

      <div className="flex-1 flex flex-col justify-between p-6 relative max-w-sm mx-auto w-full">
        <div className="pt-12">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-11 h-11 rounded-2xl bg-green-600 flex items-center justify-center shadow-lg shadow-green-300/40">
              <Stamp className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-black text-slate-900 text-lg tracking-tight leading-none">TrocaSelos</p>
              <p className="text-xs font-medium text-slate-400 mt-0.5">Troca de selos do supermercado</p>
            </div>
          </div>

          {step === 'phone' ? (
            <PhoneAuth onSubmit={handleSendOtp} />
          ) : (
            <OTPVerification
              phone={normalizedPhone}
              devCode={devCode}
              onVerify={(code) => onVerifyOtp(normalizedPhone, code)}
              onBack={() => setStep('phone')}
              onResend={handleResend}
            />
          )}
        </div>

        <div className="pb-8 pt-6">
          <div className="flex gap-4 text-center">
            {[
              { emoji: '🌱', text: '5 selos/sem\nnível Iniciante' },
              { emoji: '⭐', text: '6+ selos/sem\ncom pontos' },
              { emoji: '👑', text: '10 selos/sem\nMestre' },
            ].map(({ emoji, text }) => (
              <div key={emoji} className="flex-1 bg-white rounded-2xl p-3 shadow-card">
                <p className="text-xl mb-1">{emoji}</p>
                <p className="text-[10px] font-semibold text-slate-500 whitespace-pre-line leading-tight">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { PhoneAuth } from '../components/auth/PhoneAuth';
import { OTPVerification } from '../components/auth/OTPVerification';

interface AuthPageProps {
  onSendOtp: (phone: string) => Promise<{ success: boolean; phone: string; devCode?: string }>;
  onVerifyOtp: (phone: string, code: string) => Promise<any>;
}

export function AuthPage({ onSendOtp, onVerifyOtp }: AuthPageProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [devCode, setDevCode] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (phoneNumber: string) => {
    setLoading(true);
    try {
      const result = await onSendOtp(phoneNumber);
      setPhone(phoneNumber);
      setDevCode(result.devCode);
      setStep('otp');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    try {
      await onVerifyOtp(phone, code);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col">
      {/* Top gradient */}
      <div className="h-48 bg-gradient-to-br from-green-500 to-emerald-600 stamp-pattern relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#f5f5f0]" />
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center -mt-20 px-4 pb-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-card-md flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">🎫</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">SeloTroca</h1>
            <p className="text-sm text-slate-500 mt-1">Troca de selos Continente</p>
          </div>

          {/* Auth form */}
          <div className="bg-white rounded-2xl p-5 shadow-card-md border border-slate-100">
            {step === 'phone' ? (
              <PhoneAuth onSubmit={handleSendOtp} loading={loading} />
            ) : (
              <OTPVerification
                phone={phone}
                onVerify={handleVerifyOtp}
                onBack={() => setStep('phone')}
                loading={loading}
                devCode={devCode}
              />
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] text-slate-400 mt-6">
            Ao continuar, aceitas os nossos termos de utilizacao e politica de privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}

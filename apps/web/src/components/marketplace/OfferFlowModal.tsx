import { useState, useEffect } from 'react';
import { X, ArrowUpRight, Stamp, CheckCircle2, Clock, Copy, Check } from 'lucide-react';
import type { StampListingWithProfile } from '@stamps-share/shared';
import { api } from '../../api/client';

type Step = 'configure' | 'submitted';

interface OfferFlowModalProps {
  listing?: StampListingWithProfile;
  onClose: () => void;
  onCreate: (params: { type: 'offer' | 'request'; quantity: number; collection?: string; notes?: string }) => Promise<void>;
}

export function OfferFlowModal({ listing, onClose, onCreate }: OfferFlowModalProps) {
  const [step, setStep] = useState<Step>('configure');
  const [quantity, setQuantity] = useState(listing?.quantity ?? 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { settings } = await api.getSettings();
        if (settings.adminDevicePhone) setAdminPhone(settings.adminDevicePhone);
      } catch { /* ignore */ }
    };
    loadData();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await onCreate({
        type: 'offer',
        quantity: quantity || 1,
      });
      setStep('submitted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao submeter oferta');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPhone = () => {
    if (adminPhone) {
      navigator.clipboard.writeText(adminPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={step === 'submitted' ? onClose : undefined} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[calc(100vh-80px)] sm:max-h-[92vh] overflow-y-auto mb-16 sm:mb-0">

        <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-green-100 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5 text-green-600" />
            </div>
            <h2 className="text-sm font-black text-slate-900">Oferecer Selos</h2>
          </div>
          {step !== 'submitted' && (
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        {step === 'configure' && (
          <div className="p-5 space-y-4">
            {/* Admin phone number */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
              <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest mb-2">Envia os selos para</p>
              {adminPhone ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xl font-black text-slate-900 tracking-widest">{adminPhone}</p>
                  <button onClick={handleCopyPhone}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      copied ? 'bg-green-100 text-green-700' : 'bg-amber-200 text-amber-700 hover:bg-amber-300'
                    }`}>
                    {copied ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
                  </button>
                </div>
              ) : (
                <p className="text-slate-400 text-sm font-medium italic">Número não configurado</p>
              )}
            </div>

            {/* Quantity selector */}
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Quantidade de selos (obrigatório)
              </label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xl font-black text-slate-600 flex items-center justify-center transition-colors">−</button>
                <div className="flex-1 h-12 bg-white border-2 border-green-200 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-black text-green-600">{quantity}</span>
                </div>
                <button type="button" onClick={() => setQuantity((q) => q + 1)}
                  className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xl font-black text-slate-600 flex items-center justify-center transition-colors">+</button>
              </div>
              <p className="text-center text-xs text-slate-400 font-medium mt-1">
                Ganhas <span className="text-green-600 font-black">+{quantity * 2} pontos</span>
              </p>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 bg-sky-50 border border-sky-100 rounded-2xl p-3">
              <Clock className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-sky-700 leading-relaxed">
                A oferta fica <span className="font-black">pendente de validação</span>. Só podes ter uma oferta OU um pedido ativo de cada vez.
              </p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5">
                <p className="text-sm font-medium text-rose-700">{error}</p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              className="w-full h-14 rounded-2xl font-bold text-white bg-green-600 hover:bg-green-700 transition-all shadow-lg shadow-green-200/50 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Já enviei os selos'
              }
            </button>
          </div>
        )}

        {step === 'submitted' && (
          <div className="p-5 space-y-5">
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Oferta submetida!</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                A tua oferta de <span className="font-black text-slate-700">{quantity} selos</span> está a aguardar validação.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Pendente de validação</p>
                  <p className="text-xs text-slate-400 font-medium">O admin irá verificar a tua transferência</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <Stamp className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">+{quantity * 2} pontos após aprovação</p>
                  <p className="text-xs text-slate-400 font-medium">Saldo creditado quando aprovado</p>
                </div>
              </div>
            </div>

            <button onClick={onClose}
              className="w-full h-14 rounded-2xl font-bold text-white bg-green-600 hover:bg-green-700 transition-all shadow-lg shadow-green-200/50">
              Fechar
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

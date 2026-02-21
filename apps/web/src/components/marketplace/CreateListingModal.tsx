import { useState, useEffect } from 'react';
import { X, Minus, Plus, Send, AlertCircle, ArrowDownRight } from 'lucide-react';
import type { Profile } from '@stamps-share/shared';
import { weeklyAllowanceFromTier } from '../../lib/constants';
import { api } from '../../api/client';

interface CreateListingModalProps {
  profile: Profile;
  onClose: () => void;
  onCreate: (params: { type: 'offer' | 'request'; quantity: number; collection?: string; notes?: string }) => Promise<void>;
}

export function CreateListingModal({ profile, onClose, onCreate }: CreateListingModalProps) {
  const weeklyAllowance = weeklyAllowanceFromTier(profile.tier);
  const weeklyRemaining = Math.max(0, weeklyAllowance - profile.weeklyStampsRequested);
  const maxRequest = Math.min(weeklyRemaining, 40);

  const [quantity, setQuantity] = useState(Math.max(1, Math.min(1, maxRequest)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingRequestCount, setExistingRequestCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { listings } = await api.getListings({ type: 'request', status: 'active', userId: profile.id });
        setExistingRequestCount(listings.length);
      } catch { /* ignore */ }
    };
    loadData();
  }, [profile.id]);

  const handleSubmit = async () => {
    if (quantity < 1 || quantity > maxRequest) {
      setError('Excede o limite semanal');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onCreate({ type: 'request', quantity });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[calc(100vh-80px)] sm:max-h-[92vh] overflow-y-auto mb-16 sm:mb-0">

        <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-sky-100 flex items-center justify-center">
              <ArrowDownRight className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Pedir Selos</h2>
              <p className="text-[10px] text-slate-400 font-medium">{weeklyRemaining} selos disponíveis esta semana</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {maxRequest === 0 ? (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-sm font-medium text-amber-700 leading-relaxed">
                Já usaste a tua quota semanal de {weeklyAllowance} selos. Volta mais tarde para pedir mais!
              </p>
            </div>
          ) : (
            <>
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
                <p className="text-xs font-medium text-sky-700 leading-relaxed">
                  Pede selos e a administração irá enviá-los para ti. Cada selo pedido conta para a tua quota semanal.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Quantos selos queres pedir?
                </label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-2xl font-black text-slate-600 flex items-center justify-center transition-colors">
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="flex-1 h-14 bg-white border-2 border-sky-200 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl font-black text-sky-600">{quantity}</span>
                  </div>
                  <button type="button" onClick={() => setQuantity((q) => Math.min(maxRequest, q + 1))}
                    className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-2xl font-black text-slate-600 flex items-center justify-center transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-center text-xs text-slate-400 font-medium mt-2">
                  Máximo: <span className="text-sky-600 font-black">{maxRequest} selos</span>
                </p>
              </div>
            </>
          )}

          {existingRequestCount >= 3 && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-700">
                Já tens {existingRequestCount} pedidos ativos. Considera concluir ou cancelar alguns antes de criar novos.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={maxRequest > 0 ? handleSubmit : onClose}
            disabled={loading || (maxRequest > 0 && (quantity < 1 || quantity > maxRequest))}
            className={`w-full h-14 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
              maxRequest === 0
                ? 'bg-slate-400 hover:bg-slate-500'
                : 'bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-200/50'
            } disabled:opacity-50`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : maxRequest === 0 ? (
              'Fechar'
            ) : (
              <>
                <Send className="w-4 h-4" />
                Criar Pedido
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

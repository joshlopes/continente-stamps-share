import { useState, useEffect } from 'react';
import { X, MessageCircle, ExternalLink, Check, AlertCircle, Phone } from 'lucide-react';
import type { StampListingWithProfile, StampCollectionWithItems } from '@stamps-share/shared';
import { api } from '../../api/client';

interface OfferFlowModalProps {
  listing: StampListingWithProfile;
  onClose: () => void;
  onCreate: (params: { type: 'offer'; quantity: number; collection?: string; notes?: string }) => Promise<void>;
}

export function OfferFlowModal({ listing, onClose, onCreate }: OfferFlowModalProps) {
  const [step, setStep] = useState<'info' | 'confirm' | 'done'>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminPhone, setAdminPhone] = useState<string | null>(null);
  const [activeCollection, setActiveCollection] = useState<StampCollectionWithItems | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // Try to get admin phone (may fail for non-admins)
      try {
        const { settings } = await api.getSettings();
        setAdminPhone(settings.adminDevicePhone);
      } catch {
        setAdminPhone(null);
      }

      // Get active collection
      try {
        const { collections } = await api.getCollections();
        const active = collections.find((c) => c.isActive);
        if (active) setActiveCollection(active);
      } catch { /* ignore */ }
    };
    loadData();
  }, []);

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await onCreate({
        type: 'offer',
        quantity: listing.quantity,
        collection: listing.collection || undefined,
        notes: `Oferta para pedido de ${listing.user?.displayName || 'utilizador'}`,
      });
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar oferta');
    } finally {
      setLoading(false);
    }
  };

  const whatsappUrl = adminPhone
    ? `https://wa.me/351${adminPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Ola! Quero oferecer ${listing.quantity} selos para o pedido de ${listing.user?.displayName || 'alguem'}.`
      )}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-bold text-lg text-slate-900">
            {step === 'done' ? 'Oferta Criada' : 'Oferecer Selos'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {step === 'info' && (
            <>
              {/* Request info */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-900 mb-1">Pedido de {listing.user?.displayName || 'Anonimo'}</p>
                <p className="text-2xl font-bold text-blue-700">{listing.quantity} selos</p>
                {listing.collection && (
                  <p className="text-xs text-blue-600 mt-1">Colecao: {listing.collection}</p>
                )}
                {listing.notes && (
                  <p className="text-xs text-blue-500 mt-1">{listing.notes}</p>
                )}
              </div>

              {/* How it works */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900">Como funciona:</p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-green-700">1</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Cria a oferta para registar a tua intencao de ajudar
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-green-700">2</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Um administrador valida a tua oferta
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-green-700">3</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Combina a entrega por WhatsApp{adminPhone ? '' : ' (contacta o admin)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active collection info */}
              {activeCollection && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">Colecao ativa</p>
                  <p className="text-sm font-semibold text-slate-900">{activeCollection.name}</p>
                  {activeCollection.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{activeCollection.description}</p>
                  )}
                </div>
              )}

              <button
                onClick={() => setStep('confirm')}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all"
              >
                Quero oferecer {listing.quantity} selos
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-lg font-bold text-slate-900 mb-1">
                  Confirmar oferta de {listing.quantity} selos?
                </p>
                <p className="text-sm text-slate-500">
                  A oferta sera validada por um administrador antes de ficar ativa.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('info')}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-600 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-all"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </>
          )}

          {step === 'done' && (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-lg font-bold text-slate-900 mb-1">Oferta criada com sucesso!</p>
                <p className="text-sm text-slate-500">
                  Sera validada por um administrador. Ganharas pontos quando for aprovada.
                </p>
              </div>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold rounded-xl transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contactar por WhatsApp
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {!whatsappUrl && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <p className="text-xs text-slate-500">Numero nao configurado. Contacta o administrador.</p>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-600 transition-colors"
              >
                Fechar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

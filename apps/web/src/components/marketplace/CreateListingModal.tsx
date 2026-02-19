import { useState, useEffect } from 'react';
import { X, Minus, Plus, Send, AlertCircle, Package, HandHeart } from 'lucide-react';
import type { Profile, StampCollectionWithItems } from '@stamps-share/shared';
import { weeklyAllowanceFromTier, COLLECTIONS } from '../../lib/constants';
import { api } from '../../api/client';

interface CreateListingModalProps {
  profile: Profile;
  onClose: () => void;
  onCreate: (params: { type: 'offer' | 'request'; quantity: number; collection?: string; notes?: string }) => Promise<void>;
}

export function CreateListingModal({ profile, onClose, onCreate }: CreateListingModalProps) {
  const [type, setType] = useState<'offer' | 'request'>('request');
  const [quantity, setQuantity] = useState(1);
  const [collection, setCollection] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeCollections, setActiveCollections] = useState<StampCollectionWithItems[]>([]);
  const [existingRequestCount, setExistingRequestCount] = useState(0);

  const weeklyAllowance = weeklyAllowanceFromTier(profile.tier);
  const weeklyRemaining = Math.max(0, weeklyAllowance - profile.weeklyStampsRequested);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { collections } = await api.getCollections();
        setActiveCollections(collections.filter((c) => c.isActive));
      } catch { /* ignore */ }

      try {
        const { listings } = await api.getListings({ type: 'request', status: 'active', userId: profile.id });
        setExistingRequestCount(listings.length);
      } catch { /* ignore */ }
    };
    loadData();
  }, [profile.id]);

  const maxRequest = Math.min(weeklyRemaining, 40);
  const maxOffer = profile.stampBalance;
  const maxQty = type === 'request' ? maxRequest : maxOffer;

  const handleSubmit = async () => {
    if (quantity < 1 || quantity > maxQty) {
      setError(type === 'request' ? 'Excede o limite semanal' : 'Selos insuficientes');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onCreate({
        type,
        quantity,
        collection: collection || undefined,
        notes: notes || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar anuncio');
    } finally {
      setLoading(false);
    }
  };

  const collectionOptions = activeCollections.length > 0
    ? activeCollections.map((c) => c.name)
    : COLLECTIONS;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-bold text-lg text-slate-900">Novo Anuncio</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setType('request'); setQuantity(1); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                type === 'request'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <Package className={`w-6 h-6 ${type === 'request' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className={`text-sm font-semibold ${type === 'request' ? 'text-blue-700' : 'text-slate-600'}`}>
                Pedir Selos
              </span>
              <span className="text-[10px] text-slate-400">{weeklyRemaining} restantes</span>
            </button>
            <button
              onClick={() => { setType('offer'); setQuantity(1); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                type === 'offer'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <HandHeart className={`w-6 h-6 ${type === 'offer' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className={`text-sm font-semibold ${type === 'offer' ? 'text-emerald-700' : 'text-slate-600'}`}>
                Oferecer Selos
              </span>
              <span className="text-[10px] text-slate-400">{profile.stampBalance} disponiveis</span>
            </button>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Quantidade</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4 text-slate-600" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-bold text-slate-900">{quantity}</span>
                <p className="text-xs text-slate-400">
                  {type === 'request' ? `max ${maxRequest}` : `max ${maxOffer}`}
                </p>
              </div>
              <button
                onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Collection */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Colecao <span className="text-slate-400">(opcional)</span>
            </label>
            <select
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              className="w-full py-3 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            >
              <option value="">Qualquer colecao</option>
              {collectionOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Notas <span className="text-slate-400">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Preciso de selos da colecao MasterChef..."
              rows={2}
              className="w-full py-3 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
            />
          </div>

          {/* Info box */}
          {type === 'offer' && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-700">
                As ofertas precisam de validacao por um administrador antes de ficarem ativas.
              </p>
            </div>
          )}

          {existingRequestCount >= 3 && type === 'request' && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-700">
                Ja tens {existingRequestCount} pedidos ativos. Considera concluir ou cancelar alguns antes de criar novos.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || quantity < 1 || quantity > maxQty}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                {type === 'request' ? 'Criar Pedido' : 'Criar Oferta'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

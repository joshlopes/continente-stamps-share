import { Clock, Package, X, Check, AlertTriangle } from 'lucide-react';
import type { StampListingWithProfile } from '@stamps-share/shared';
import { getTierStyle } from '../../lib/constants';

interface ListingCardProps {
  listing: StampListingWithProfile;
  currentUserId: string;
  onCancel?: (id: string) => void;
  onFulfill?: (id: string) => void;
  onOffer?: (listing: StampListingWithProfile) => void;
}

export function ListingCard({ listing, currentUserId, onCancel, onFulfill, onOffer }: ListingCardProps) {
  const isOwn = listing.userId === currentUserId;
  const isOffer = listing.type === 'offer';
  const isRequest = listing.type === 'request';
  const tierStyle = getTierStyle(listing.user?.tier ?? 1);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-card border border-slate-100">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${tierStyle.gradient} flex items-center justify-center`}>
            <span className="text-sm">{tierStyle.icon}</span>
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-900">
              {isOwn ? 'Tu' : listing.user?.displayName || 'Anonimo'}
            </p>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tierStyle.badge}`}>
                Nv.{listing.user?.level ?? 1}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {timeAgo(listing.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
          isOffer
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : 'bg-blue-50 text-blue-700 border border-blue-100'
        }`}>
          {isOffer ? 'Oferta' : 'Pedido'}
        </div>
      </div>

      {/* Content */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isOffer ? 'bg-emerald-50' : 'bg-blue-50'
        }`}>
          <Package className={`w-5 h-5 ${isOffer ? 'text-emerald-600' : 'text-blue-600'}`} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-xl text-slate-900">{listing.quantity} selos</p>
          {listing.collection && (
            <p className="text-xs text-slate-500">{listing.collection}</p>
          )}
          {listing.notes && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{listing.notes}</p>
          )}
        </div>
      </div>

      {/* Status badges */}
      {listing.status === 'pending_validation' && (
        <div className="flex items-center gap-1.5 p-2 bg-amber-50 border border-amber-100 rounded-lg mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-medium text-amber-700">A aguardar validacao</span>
        </div>
      )}

      {listing.status === 'rejected' && listing.rejectionReason && (
        <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-100 rounded-lg mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          <span className="text-xs font-medium text-red-700">Rejeitado: {listing.rejectionReason}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isOwn && listing.status === 'active' && (
          <button
            onClick={() => onCancel?.(listing.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Cancelar
          </button>
        )}

        {!isOwn && isRequest && listing.status === 'active' && onOffer && (
          <button
            onClick={() => onOffer(listing)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-semibold text-white transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Oferecer selos
          </button>
        )}

        {isOwn && isRequest && listing.status === 'active' && onFulfill && (
          <button
            onClick={() => onFulfill(listing.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-semibold text-white transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Marcar concluido
          </button>
        )}
      </div>
    </div>
  );
}

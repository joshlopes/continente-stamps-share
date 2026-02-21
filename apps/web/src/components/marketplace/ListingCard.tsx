import { Clock, Tag, X, Check, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { StampListingWithProfile } from '@stamps-share/shared';
import { getTierInfo } from '../../lib/constants';

interface ListingCardProps {
  listing: StampListingWithProfile;
  currentUserId?: string;
  onCancel?: (id: string) => void;
  onFulfill?: (id: string) => void;
  onOffer?: (listing: StampListingWithProfile) => void;
  loading?: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function ListingCard({ listing, currentUserId, onCancel, onFulfill, onOffer, loading }: ListingCardProps) {
  const isOwner = currentUserId === listing.userId;
  const tierInfo = getTierInfo(listing.user?.tier ?? 1);
  const isOffer = listing.type === 'offer';

  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-card border transition-all hover:shadow-card-md ${
      isOffer ? 'border-green-100' : 'border-sky-100'
    }`}>
      <div className={`h-1 ${isOffer ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-sky-400 to-blue-500'}`} />

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${tierInfo.badge}`}>
              {listing.user?.displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-tight">
                {listing.user?.displayName ?? 'Utilizador'}
              </p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tierInfo.badge}`}>
                {tierInfo.icon} Nv.{listing.user?.level}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black ${
              isOffer ? 'bg-green-100 text-green-700' : 'bg-sky-100 text-sky-700'
            }`}>
              {isOffer ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {isOffer ? 'OFERECE' : 'PEDE'}
            </div>
            {listing.status === 'pending_validation' && (
              <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" /> Pendente
              </span>
            )}
            {listing.status === 'fulfilled' && (
              <span className="text-[9px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5" /> Concluído
              </span>
            )}
            {listing.status === 'cancelled' && (
              <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">
                Cancelado
              </span>
            )}
            {listing.status === 'rejected' && (
              <span className="text-[9px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">
                Rejeitado
              </span>
            )}
          </div>
        </div>

        <div className="flex items-end gap-3 mb-3">
          <div>
            <p className={`text-4xl font-black leading-none ${isOffer ? 'text-green-600' : 'text-sky-600'}`}>
              {listing.quantity}
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-0.5">selos</p>
          </div>
          {listing.collection && (
            <div className="flex items-center gap-1 mb-1 bg-slate-50 rounded-lg px-2 py-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">{listing.collection}</span>
            </div>
          )}
        </div>

        {listing.notes && (
          <p className="text-sm text-slate-500 mb-3 leading-relaxed bg-slate-50 rounded-xl px-3 py-2">
            {listing.notes}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="flex items-center gap-1 text-slate-300">
            <Clock className="w-3 h-3" />
            <span className="text-xs font-medium">há {timeAgo(listing.createdAt)}</span>
          </div>

          <div className="flex gap-2">
            {isOwner && onCancel && (listing.status === 'pending_validation' || listing.status === 'active') && (
              <button onClick={() => onCancel(listing.id)} disabled={loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-50">
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
            )}

            {!isOwner && onFulfill && listing.status === 'active' && (
              <button onClick={() => onFulfill(listing.id)} disabled={loading}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50 ${
                  isOffer ? 'bg-green-600 hover:bg-green-700' : 'bg-sky-600 hover:bg-sky-700'
                }`}>
                <Check className="w-3.5 h-3.5" />
                {isOffer ? 'Aceitar' : 'Dar selos'}
              </button>
            )}

            {!isOwner && onOffer && listing.status === 'active' && !isOffer && (
              <button onClick={() => onOffer(listing)} disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50">
                <Check className="w-3.5 h-3.5" />
                Oferecer selos
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Zap, Clock, Copy, Check, Hash } from 'lucide-react';
import type { Profile, StampListingWithProfile } from '@stamps-share/shared';
import { useMarketplace } from '../hooks/useMarketplace';
import { LevelCard } from '../components/dashboard/LevelCard';
import { StatsRow } from '../components/dashboard/StatsRow';
import { ListingCard } from '../components/marketplace/ListingCard';
import { CreateListingModal } from '../components/marketplace/CreateListingModal';
import { OfferFlowModal } from '../components/marketplace/OfferFlowModal';
import { weeklyAllowanceFromTier, TIER_STYLES } from '../lib/constants';
import { api } from '../api/client';

interface DashboardPageProps {
  profile: Profile;
  onProfileUpdate: () => Promise<void>;
}

export function DashboardPage({ profile, onProfileUpdate }: DashboardPageProps) {
  const [showOfferFlow, setShowOfferFlow] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [offerTarget, setOfferTarget] = useState<StampListingWithProfile | null>(null);
  const { listings, loading, fetchListings, createListing, cancelListing, fulfillListing } = useMarketplace();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);

  const weeklyAllowance = weeklyAllowanceFromTier(profile.tier);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { settings } = await api.getSettings();
        if (settings.adminDevicePhone) setAdminPhone(settings.adminDevicePhone);
      } catch { /* ignore */ }
    };
    loadSettings();
  }, []);

  const handleCreate = async (params: { type: 'offer' | 'request'; quantity: number; collection?: string; notes?: string }) => {
    await createListing(params);
    await fetchListings();
    await onProfileUpdate();
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id); setActionError('');
    try { await cancelListing(id); await fetchListings(); await onProfileUpdate(); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Erro'); }
    finally { setActionLoading(null); }
  };

  const handleFulfill = async (id: string) => {
    setActionLoading(id); setActionError('');
    try { await fulfillListing(id); await fetchListings(); await onProfileUpdate(); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Erro'); }
    finally { setActionLoading(null); }
  };

  const handleCopyPhone = () => {
    if (adminPhone) {
      navigator.clipboard.writeText(adminPhone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 19 ? 'Boa tarde' : 'Boa noite';

  // Find user's active offer (pending_validation only - approved offers become fulfilled)
  const myActiveOffer = listings.find((l) => l.userId === profile.id && l.type === 'offer' && l.status === 'pending_validation');
  const myActiveRequest = listings.find((l) => l.userId === profile.id && l.type === 'request' && l.status === 'active');

  // Calculate pending request quantity for weekly quota display
  const pendingRequestQuantity = myActiveRequest?.quantity || 0;
  const weeklyRemaining = Math.max(0, weeklyAllowance - profile.weeklyStampsRequested - pendingRequestQuantity);

  // Calculate time until weekly reset
  const getTimeUntilReset = () => {
    const now = new Date();
    const resetAt = new Date(profile.weeklyResetAt);
    const diff = resetAt.getTime() - now.getTime();
    if (diff <= 0) return null; // Reset has passed
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };
  const timeUntilReset = getTimeUntilReset();
  const quotaExhausted = profile.weeklyStampsRequested >= weeklyAllowance;

  // Calculate request position (how many requests are ahead of this one)
  const allActiveRequests = listings.filter((l) => l.type === 'request' && l.status === 'active').sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const myRequestPosition = myActiveRequest ? allActiveRequests.findIndex((l) => l.id === myActiveRequest.id) + 1 : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_validation': return 'Aguarda confirmação';
      case 'active': return 'Ativo';
      case 'fulfilled': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  return (
    <div className="px-4 pb-6 space-y-4">
      <div className="pt-5">
        <p className="text-slate-400 text-sm font-medium">{greeting},</p>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{profile.displayName}</h1>
      </div>

      <LevelCard profile={profile} />
      <StatsRow profile={profile} />

      <div className="bg-white rounded-2xl p-4 border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-black text-slate-800">Quota Semanal</span>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {pendingRequestQuantity > 0
              ? `${profile.weeklyStampsRequested}+${pendingRequestQuantity}/${weeklyAllowance}`
              : `${profile.weeklyStampsRequested}/${weeklyAllowance}`
            }
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2 relative">
          {/* Used stamps (fulfilled) */}
          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-700 absolute left-0"
            style={{ width: `${Math.min(100, (profile.weeklyStampsRequested / weeklyAllowance) * 100)}%` }} />
          {/* Pending request stamps (striped pattern) */}
          {pendingRequestQuantity > 0 && (
            <div className="h-full rounded-full bg-gradient-to-r from-sky-300 to-sky-400 transition-all duration-700 absolute"
              style={{
                left: `${Math.min(100, (profile.weeklyStampsRequested / weeklyAllowance) * 100)}%`,
                width: `${Math.min(100 - (profile.weeklyStampsRequested / weeklyAllowance) * 100, (pendingRequestQuantity / weeklyAllowance) * 100)}%`
              }} />
          )}
        </div>
        {quotaExhausted ? (
          <div className="space-y-1">
            <p className="text-xs font-medium text-amber-600">
              Já pediste a tua quota semanal de {weeklyAllowance} selos!
            </p>
            {timeUntilReset && (
              <p className="text-xs text-slate-500">
                Volta em <span className="font-bold text-amber-600">{timeUntilReset}</span> para pedir mais {weeklyAllowance}. Subir de nível aumenta a tua quota!
              </p>
            )}
          </div>
        ) : pendingRequestQuantity > 0 ? (
          <p className="text-xs font-medium text-sky-600">
            {pendingRequestQuantity} selos pendentes • {weeklyRemaining} disponíveis
          </p>
        ) : (
          <p className="text-xs font-medium text-slate-400">
            {weeklyRemaining} selos disponíveis esta semana
          </p>
        )}
      </div>

      {/* Active Listing Section - Show offer OR request details if user has one */}
      {myActiveOffer ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-green-600" />
              <span className="text-sm font-black text-slate-800">Minha Oferta</span>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${myActiveOffer.status === 'pending_validation' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
              {getStatusLabel(myActiveOffer.status)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Hash className="w-3 h-3" />
              <span className="font-medium">ID: {myActiveOffer.id.slice(0, 8)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock className="w-3 h-3" />
              <span className="font-medium">{formatDate(myActiveOffer.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-green-700">{myActiveOffer.quantity} selos</span>
            {adminPhone && myActiveOffer.status === 'pending_validation' && (
              <button onClick={handleCopyPhone} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">
                {copiedPhone ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copiedPhone ? 'Copiado!' : adminPhone}
              </button>
            )}
          </div>
          {myActiveOffer.status === 'pending_validation' && (
            <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
              Envia os selos para o número acima e aguarda confirmação.
            </p>
          )}
          <button
            onClick={() => handleCancel(myActiveOffer.id)}
            disabled={actionLoading === myActiveOffer.id}
            className="w-full text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
            Cancelar Oferta
          </button>
        </div>
      ) : myActiveRequest ? (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-sky-600" />
              <span className="text-sm font-black text-slate-800">Meu Pedido</span>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-sky-100 text-sky-700">
              {getStatusLabel(myActiveRequest.status)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Hash className="w-3 h-3" />
              <span className="font-medium">ID: {myActiveRequest.id.slice(0, 8)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock className="w-3 h-3" />
              <span className="font-medium">{formatDate(myActiveRequest.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-sky-700">{myActiveRequest.quantity} selos</span>
            <span className="text-xs font-medium text-slate-500">Posição na fila: #{myRequestPosition}</span>
          </div>
          <p className="text-xs text-sky-700 bg-sky-100/50 px-3 py-2 rounded-lg">
            Os selos serão enviados pela administração por ordem de pedido. Aguarda a tua vez!
          </p>
          <button
            onClick={() => handleCancel(myActiveRequest.id)}
            disabled={actionLoading === myActiveRequest.id}
            className="w-full text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
            Cancelar Pedido
          </button>
        </div>
      ) : (
        /* No active listing - show both action buttons */
        <div className="grid grid-cols-2 gap-2.5">
          <button onClick={() => setShowOfferFlow(true)}
            className="flex flex-col items-start gap-3 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white rounded-2xl p-4 transition-all shadow-lg shadow-green-200/50">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-sm">Oferecer Selos</p>
              <p className="text-xs opacity-70 font-medium">+2 pts por selo</p>
            </div>
          </button>
          <button
            onClick={() => !quotaExhausted && setShowRequestModal(true)}
            disabled={quotaExhausted}
            className={`flex flex-col items-start gap-3 rounded-2xl p-4 transition-all ${
              quotaExhausted
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white shadow-lg shadow-sky-200/50'
            }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${quotaExhausted ? 'bg-slate-300' : 'bg-white/20'}`}>
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-sm">Pedir Selos</p>
              <p className="text-xs opacity-70 font-medium">
                {quotaExhausted ? 'Quota esgotada' : '+0.5 pts por selo'}
              </p>
            </div>
          </button>
        </div>
      )}

      {actionError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
          <p className="text-sm font-medium text-rose-700">{actionError}</p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-slate-800">Atividade Recente</h2>
          <span className="text-xs text-slate-400 font-medium">{listings.length} listagens</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm font-medium">Sem listagens ativas</p>
            <p className="text-slate-300 text-xs mt-1">Sê o primeiro a publicar!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {listings.slice(0, 8).map((listing) => (
              <ListingCard key={listing.id} listing={listing} currentUserId={profile.id}
                onCancel={handleCancel} onFulfill={handleFulfill} onOffer={(l) => setOfferTarget(l)} loading={actionLoading === listing.id} />
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <h3 className="text-sm font-black text-slate-800 mb-3">Tiers de Nível</h3>
        <div className="space-y-1.5">
          {TIER_STYLES.map((tier) => {
            const active = tier.tier === profile.tier;
            return (
              <div key={tier.tier}
                className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all ${active ? `${tier.bg} border ${tier.border}` : 'opacity-40'}`}>
                <span className="text-base">{tier.icon}</span>
                <div className="flex-1">
                  <p className={`text-xs font-black ${active ? tier.color : 'text-slate-600'}`}>
                    {tier.name}{active && <span className="ml-1.5 font-normal opacity-60 text-[10px]">← atual</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Nv.{tier.minLevel}–{tier.maxLevel === Infinity ? '∞' : tier.maxLevel}</p>
                </div>
                <span className={`text-sm font-black ${active ? tier.color : 'text-slate-400'}`}>{tier.weeklyAllowance}/sem</span>
              </div>
            );
          })}
        </div>
      </div>

      {showOfferFlow && (
        <OfferFlowModal
          onClose={() => { setShowOfferFlow(false); fetchListings(); onProfileUpdate(); }}
          onCreate={handleCreate}
        />
      )}

      {showRequestModal && (
        <CreateListingModal
          profile={profile}
          onClose={() => { setShowRequestModal(false); fetchListings(); onProfileUpdate(); }}
          onCreate={handleCreate}
        />
      )}

      {offerTarget && (
        <OfferFlowModal
          listing={offerTarget}
          onClose={() => { setOfferTarget(null); fetchListings(); onProfileUpdate(); }}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

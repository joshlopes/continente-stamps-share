import { useState, useEffect } from 'react';
import { Plus, ArrowUpDown, Package, HandHeart, RefreshCw } from 'lucide-react';
import type { Profile, StampListingWithProfile } from '@stamps-share/shared';
import { useMarketplace } from '../hooks/useMarketplace';
import { LevelCard } from '../components/dashboard/LevelCard';
import { StatsRow } from '../components/dashboard/StatsRow';
import { ListingCard } from '../components/marketplace/ListingCard';
import { CreateListingModal } from '../components/marketplace/CreateListingModal';
import { OfferFlowModal } from '../components/marketplace/OfferFlowModal';

interface DashboardPageProps {
  profile: Profile;
  onProfileUpdate: () => Promise<void>;
}

export function DashboardPage({ profile, onProfileUpdate }: DashboardPageProps) {
  const { listings, loading, fetchListings, createListing, cancelListing, fulfillListing } = useMarketplace();
  const [filter, setFilter] = useState<'all' | 'offer' | 'request'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [offerTarget, setOfferTarget] = useState<StampListingWithProfile | null>(null);

  useEffect(() => {
    fetchListings(filter === 'all' ? undefined : filter);
  }, [filter, fetchListings]);

  const handleCreate = async (params: { type: 'offer' | 'request'; quantity: number; collection?: string; notes?: string }) => {
    await createListing(params);
    await fetchListings(filter === 'all' ? undefined : filter);
    await onProfileUpdate();
  };

  const handleCancel = async (id: string) => {
    await cancelListing(id);
    await fetchListings(filter === 'all' ? undefined : filter);
    await onProfileUpdate();
  };

  const handleFulfill = async (id: string) => {
    await fulfillListing(id);
    await fetchListings(filter === 'all' ? undefined : filter);
    await onProfileUpdate();
  };

  const handleOffer = async (params: { type: 'offer'; quantity: number; collection?: string; notes?: string }) => {
    await createListing(params);
    await fetchListings(filter === 'all' ? undefined : filter);
    await onProfileUpdate();
  };

  const handleRefresh = () => {
    fetchListings(filter === 'all' ? undefined : filter);
    onProfileUpdate();
  };

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Level card */}
      <LevelCard profile={profile} />

      {/* Stats */}
      <StatsRow profile={profile} />

      {/* Marketplace header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-900">Mercado</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ArrowUpDown className="w-3 h-3" />
          Todos
        </button>
        <button
          onClick={() => setFilter('request')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'request'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Package className="w-3 h-3" />
          Pedidos
        </button>
        <button
          onClick={() => setFilter('offer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'offer'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <HandHeart className="w-3 h-3" />
          Ofertas
        </button>
      </div>

      {/* Listings */}
      <div className="space-y-3 pb-4">
        {loading && listings.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && listings.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">Nenhum anuncio encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Cria o primeiro pedido ou oferta!</p>
          </div>
        )}

        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            currentUserId={profile.id}
            onCancel={handleCancel}
            onFulfill={handleFulfill}
            onOffer={(l) => setOfferTarget(l)}
          />
        ))}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateListingModal
          profile={profile}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {offerTarget && (
        <OfferFlowModal
          listing={offerTarget}
          onClose={() => setOfferTarget(null)}
          onCreate={handleOffer}
        />
      )}
    </div>
  );
}

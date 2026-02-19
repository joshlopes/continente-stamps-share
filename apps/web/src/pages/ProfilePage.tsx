import { useState, useEffect } from 'react';
import { User, Mail, MapPin, Calendar, Phone, Edit3, Check, X, Clock, Package, ArrowUpCircle, ArrowDownCircle, ChevronRight } from 'lucide-react';
import type { Profile } from '@stamps-share/shared';
import { PORTUGAL_DISTRICTS, getTierStyle } from '../lib/constants';
import { useMarketplace } from '../hooks/useMarketplace';
import { ListingCard } from '../components/marketplace/ListingCard';

interface ProfilePageProps {
  profile: Profile;
  onUpdate: (updates: Partial<Profile>) => Promise<Profile>;
  onProfileUpdate: () => Promise<void>;
}

export function ProfilePage({ profile, onUpdate, onProfileUpdate }: ProfilePageProps) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [email, setEmail] = useState(profile.email || '');
  const [district, setDistrict] = useState(profile.district || '');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { listings, loading, fetchListings, cancelListing } = useMarketplace();

  const tierStyle = getTierStyle(profile.tier);

  useEffect(() => {
    if (showHistory) {
      fetchListings(undefined, profile.id, undefined);
    }
  }, [showHistory, fetchListings, profile.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({ displayName, email, district });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id: string) => {
    await cancelListing(id);
    await fetchListings(undefined, profile.id, undefined);
    await onProfileUpdate();
  };

  if (showHistory) {
    return (
      <div className="px-4 pt-4 space-y-4">
        <button
          onClick={() => setShowHistory(false)}
          className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Voltar ao perfil
        </button>

        <h2 className="font-bold text-lg text-slate-900">Os Meus Anuncios</h2>

        {loading && (
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
          </div>
        )}

        <div className="space-y-3 pb-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              currentUserId={profile.id}
              onCancel={handleCancel}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Profile header */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-slate-100">
        <div className={`bg-gradient-to-br ${tierStyle.gradient} p-5 stamp-pattern`}>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">{tierStyle.icon}</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{profile.displayName || 'Sem nome'}</p>
              <p className="text-white/70 text-sm">
                Nivel {profile.level} - {tierStyle.name}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-1">
                <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="font-bold text-sm text-slate-900">{profile.totalOffered}</p>
              <p className="text-[10px] text-slate-400">Oferecidos</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-1">
                <ArrowDownCircle className="w-4 h-4 text-blue-600" />
              </div>
              <p className="font-bold text-sm text-slate-900">{profile.totalRequested}</p>
              <p className="text-[10px] text-slate-400">Pedidos</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mx-auto mb-1">
                <Package className="w-4 h-4 text-amber-600" />
              </div>
              <p className="font-bold text-sm text-slate-900">{profile.stampBalance}</p>
              <p className="text-[10px] text-slate-400">Selos</p>
            </div>
          </div>
        </div>
      </div>

      {/* My listings button */}
      <button
        onClick={() => setShowHistory(true)}
        className="w-full bg-white rounded-xl p-4 shadow-card border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-slate-500" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-slate-900">Os Meus Anuncios</p>
            <p className="text-xs text-slate-400">Historico de pedidos e ofertas</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300" />
      </button>

      {/* Personal info */}
      <div className="bg-white rounded-2xl p-4 shadow-card border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900">Dados pessoais</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              Editar
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setEditing(false); setDisplayName(profile.displayName || ''); setEmail(profile.email || ''); setDistrict(profile.district || ''); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-slate-500" />
            </div>
            {editing ? (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            ) : (
              <div>
                <p className="text-xs text-slate-400">Nome</p>
                <p className="text-sm font-medium text-slate-900">{profile.displayName || '-'}</p>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-slate-500" />
            </div>
            {editing ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            ) : (
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-sm font-medium text-slate-900">{profile.email || '-'}</p>
              </div>
            )}
          </div>

          {/* District */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-slate-500" />
            </div>
            {editing ? (
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              >
                <option value="">Seleciona</option>
                {PORTUGAL_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            ) : (
              <div>
                <p className="text-xs text-slate-400">Distrito</p>
                <p className="text-sm font-medium text-slate-900">{profile.district || '-'}</p>
              </div>
            )}
          </div>

          {/* Phone (read-only) */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Telemovel</p>
              <p className="text-sm font-medium text-slate-900">+351 {profile.phone}</p>
            </div>
          </div>

          {/* Date of birth (read-only) */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Data de nascimento</p>
              <p className="text-sm font-medium text-slate-900">
                {profile.dateOfBirth
                  ? new Date(profile.dateOfBirth).toLocaleDateString('pt-PT')
                  : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Member since */}
      <div className="text-center py-2">
        <p className="text-xs text-slate-400">
          Membro desde {new Date(profile.createdAt).toLocaleDateString('pt-PT')}
        </p>
      </div>
    </div>
  );
}

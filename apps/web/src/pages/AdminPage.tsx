import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, CheckCircle, XCircle, Clock, Package, Settings, BookOpen, Plus, Trash2, Save, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import type { StampListingWithProfile, StampCollectionWithItems } from '@stamps-share/shared';
import { getTierStyle, formatEuros } from '../lib/constants';
import { api } from '../api/client';

interface AdminPageProps {
  onBack: () => void;
}

type AdminTab = 'offers' | 'collections' | 'settings';

export function AdminPage({ onBack }: AdminPageProps) {
  const [tab, setTab] = useState<AdminTab>('offers');

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <h1 className="font-bold text-base text-slate-900">Administracao</h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 flex gap-1">
          <TabButton active={tab === 'offers'} onClick={() => setTab('offers')} icon={Clock} label="Ofertas" />
          <TabButton active={tab === 'collections'} onClick={() => setTab('collections')} icon={BookOpen} label="Colecoes" />
          <TabButton active={tab === 'settings'} onClick={() => setTab('settings')} icon={Settings} label="Config" />
        </div>
      </div>

      <main className="max-w-2xl mx-auto">
        {tab === 'offers' && <PendingOffersTab />}
        {tab === 'collections' && <CollectionsTab />}
        {tab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Clock; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
        active
          ? 'border-green-600 text-green-700'
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// ============================================================================
// Pending Offers Tab
// ============================================================================
function PendingOffersTab() {
  const [offers, setOffers] = useState<StampListingWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadOffers = async () => {
    setLoading(true);
    try {
      const { offers: data } = await api.getPendingOffers();
      setOffers(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadOffers(); }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.approveOffer(id);
      await loadOffers();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setActionLoading(rejectId);
    try {
      await api.rejectOffer(rejectId, rejectReason || undefined);
      setRejectId(null);
      setRejectReason('');
      await loadOffers();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 space-y-3 pb-8">
      <p className="text-xs text-slate-500">{offers.length} oferta(s) pendente(s)</p>

      {offers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">Nenhuma oferta pendente</p>
        </div>
      )}

      {offers.map((offer) => {
        const tierStyle = getTierStyle(offer.user?.tier ?? 1);
        const isLoading = actionLoading === offer.id;

        return (
          <div key={offer.id} className="bg-white rounded-xl p-4 shadow-card border border-slate-100 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${tierStyle.gradient} flex items-center justify-center`}>
                <span className="text-sm">{tierStyle.icon}</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">{offer.user?.displayName || 'Anonimo'}</p>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tierStyle.badge}`}>
                  Nv.{offer.user?.level ?? 1}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-xl text-slate-900">{offer.quantity} selos</p>
                {offer.collection && <p className="text-xs text-slate-500">{offer.collection}</p>}
                {offer.notes && <p className="text-xs text-slate-400 mt-0.5">{offer.notes}</p>}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(offer.id)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Aprovar
                  </>
                )}
              </button>
              <button
                onClick={() => setRejectId(offer.id)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Rejeitar
              </button>
            </div>
          </div>
        );
      })}

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectId(null)} />
          <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Rejeitar oferta</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo da rejeicao (opcional)"
              rows={3}
              className="w-full py-3 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setRejectId(null); setRejectReason(''); }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-semibold text-white transition-colors"
              >
                Confirmar rejeicao
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Collections Tab
// ============================================================================
function CollectionsTab() {
  const [collections, setCollections] = useState<StampCollectionWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStartsAt, setNewStartsAt] = useState('');
  const [newEndsAt, setNewEndsAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Item creation
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemSubtitle, setNewItemSubtitle] = useState('');

  const loadCollections = async () => {
    setLoading(true);
    try {
      const { collections: data } = await api.getAdminCollections();
      setCollections(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadCollections(); }, []);

  const handleCreateCollection = async () => {
    if (!newName || !newStartsAt || !newEndsAt) {
      setError('Preenche todos os campos obrigatorios');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.createCollection({
        name: newName,
        description: newDesc || undefined,
        startsAt: new Date(newStartsAt).toISOString(),
        endsAt: new Date(newEndsAt).toISOString(),
        isActive: true,
      });
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      setNewStartsAt('');
      setNewEndsAt('');
      await loadCollections();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar colecao');
    }
    setSaving(false);
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Tens a certeza que queres apagar esta colecao?')) return;
    try {
      await api.deleteCollection(id);
      await loadCollections();
    } catch { /* ignore */ }
  };

  const handleToggleActive = async (col: StampCollectionWithItems) => {
    try {
      await api.updateCollection(col.id, { isActive: !col.isActive });
      await loadCollections();
    } catch { /* ignore */ }
  };

  const handleCreateItem = async (collectionId: string) => {
    if (!newItemName) return;
    setSaving(true);
    try {
      await api.createCollectionItem(collectionId, {
        name: newItemName,
        subtitle: newItemSubtitle || undefined,
      });
      setAddingItemTo(null);
      setNewItemName('');
      setNewItemSubtitle('');
      await loadCollections();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDeleteItem = async (collectionId: string, itemId: string) => {
    if (!confirm('Apagar este item?')) return;
    try {
      await api.deleteCollectionItem(collectionId, itemId);
      await loadCollections();
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 space-y-3 pb-8">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{collections.length} colecao(oes)</p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Colecao
        </button>
      </div>

      {/* Create collection form */}
      {showCreate && (
        <div className="bg-white rounded-xl p-4 shadow-card border border-slate-100 space-y-3">
          <h3 className="font-semibold text-sm text-slate-900">Nova Colecao</h3>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome da colecao"
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Descricao (opcional)"
            rows={2}
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Inicio</label>
              <input
                type="date"
                value={newStartsAt}
                onChange={(e) => setNewStartsAt(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Fim</label>
              <input
                type="date"
                value={newEndsAt}
                onChange={(e) => setNewEndsAt(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setShowCreate(false); setError(''); }}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateCollection}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Criar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Collections list */}
      {collections.map((col) => {
        const isExpanded = expanded === col.id;
        const sortedItems = [...(col.items || [])].sort((a, b) => a.sortOrder - b.sortOrder);

        return (
          <div key={col.id} className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
            {/* Collection header */}
            <div
              className="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpanded(isExpanded ? null : col.id)}
            >
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-slate-900 truncate">{col.name}</p>
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${
                    col.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {col.isActive ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{sortedItems.length} itens</p>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-slate-100 p-4 space-y-3">
                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(col)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      col.isActive
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                    }`}
                  >
                    {col.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleDeleteCollection(col.id)}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-medium text-red-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Items */}
                {sortedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    {item.imageUrl ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                      {item.subtitle && (
                        <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                      )}
                      {item.options && item.options.length > 0 && (
                        <p className="text-[10px] text-slate-400">
                          {item.options.map((o) => `${o.stampsRequired} selos: ${formatEuros(o.feeEuros)}`).join(' | ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {item.isOutOfStock && (
                        <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-medium rounded-full border border-red-100">
                          Esgotado
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteItem(col.id, item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add item */}
                {addingItemTo === col.id ? (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-lg space-y-2">
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Nome do item"
                      className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={newItemSubtitle}
                      onChange={(e) => setNewItemSubtitle(e.target.value)}
                      placeholder="Subtitulo (opcional)"
                      className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setAddingItemTo(null); setNewItemName(''); setNewItemSubtitle(''); }}
                        className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleCreateItem(col.id)}
                        disabled={saving || !newItemName}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        {saving ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          'Adicionar'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingItemTo(col.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-slate-200 rounded-lg text-xs font-medium text-slate-500 hover:border-green-300 hover:text-green-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar item
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Settings Tab
// ============================================================================
function SettingsTab() {
  const [adminPhone, setAdminPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { settings } = await api.getSettings();
        setAdminPhone(settings.adminDevicePhone || '');
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.updateSettings({ adminDevicePhone: adminPhone });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao guardar');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 space-y-4 pb-8">
      <div className="bg-white rounded-xl p-4 shadow-card border border-slate-100 space-y-4">
        <h3 className="font-semibold text-sm text-slate-900">Configuracoes</h3>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Telemovel do administrador (para WhatsApp)
          </label>
          <input
            type="tel"
            value={adminPhone}
            onChange={(e) => { setAdminPhone(e.target.value.replace(/\D/g, '')); setSaved(false); }}
            placeholder="912345678"
            className="w-full py-3 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Este numero sera usado para que os utilizadores contactem via WhatsApp para combinar a entrega de selos.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-100 rounded-lg">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            <p className="text-xs text-green-600">Guardado com sucesso!</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-all"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar
            </>
          )}
        </button>
      </div>
    </div>
  );
}

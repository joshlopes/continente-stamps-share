import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, CheckCircle, XCircle, Clock, Package, Settings, BookOpen, Plus, Trash2, Save, AlertCircle, ChevronDown, ChevronRight, Send, Phone, Copy, Edit2, X, Check } from 'lucide-react';
import type { StampListingWithProfile, StampCollectionWithItems } from '@stamps-share/shared';
import { getTierStyle, formatEuros } from '../lib/constants';
import { api } from '../api/client';

interface AdminPageProps {
  onBack: () => void;
}

type AdminTab = 'offers' | 'requests' | 'collections' | 'settings';

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
            <h1 className="font-bold text-base text-slate-900">Administração</h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 flex gap-1">
          <TabButton active={tab === 'offers'} onClick={() => setTab('offers')} icon={Clock} label="Ofertas" />
          <TabButton active={tab === 'requests'} onClick={() => setTab('requests')} icon={Send} label="Pedidos" />
          <TabButton active={tab === 'collections'} onClick={() => setTab('collections')} icon={BookOpen} label="Coleções" />
          <TabButton active={tab === 'settings'} onClick={() => setTab('settings')} icon={Settings} label="Config" />
        </div>
      </div>

      <main className="max-w-2xl mx-auto">
        {tab === 'offers' && <PendingOffersTab />}
        {tab === 'requests' && <ActiveRequestsTab />}
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
  // Track quantity adjustments per offer: { offerId: adjustedQuantity }
  const [quantityAdjustments, setQuantityAdjustments] = useState<Record<string, number>>({});
  // Track which offer is being edited
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const { offers: data } = await api.getPendingOffers();
      setOffers(data);
      // Reset adjustments when offers reload
      setQuantityAdjustments({});
      setEditingQuantity(null);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadOffers(); }, []);

  const handleApprove = async (id: string, originalQuantity: number) => {
    setActionLoading(id);
    try {
      const adjustedQuantity = quantityAdjustments[id];
      // Only pass quantity if it was adjusted
      const quantityToSend = adjustedQuantity !== undefined && adjustedQuantity !== originalQuantity
        ? adjustedQuantity
        : undefined;
      await api.approveOffer(id, quantityToSend);
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
        const isEditing = editingQuantity === offer.id;
        const currentQuantity = quantityAdjustments[offer.id] ?? offer.quantity;
        const wasAdjusted = quantityAdjustments[offer.id] !== undefined && quantityAdjustments[offer.id] !== offer.quantity;
        // Get phone from user object (added by backend)
        const userPhone = (offer.user as { phone?: string } | undefined)?.phone;

        return (
          <div key={offer.id} className="bg-white rounded-xl p-4 shadow-card border border-slate-100 space-y-3">
            {/* User info with phone */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${tierStyle.gradient} flex items-center justify-center`}>
                  <span className="text-sm">{tierStyle.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">{offer.user?.displayName || 'Anónimo'}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tierStyle.badge}`}>
                    Nv.{offer.user?.level ?? 1}
                  </span>
                </div>
              </div>
              {userPhone && (
                <a
                  href={`tel:${userPhone}`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {userPhone}
                </a>
              )}
            </div>

            {/* Quantity with edit capability */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={currentQuantity}
                      onChange={(e) => setQuantityAdjustments(prev => ({
                        ...prev,
                        [offer.id]: Math.max(1, parseInt(e.target.value) || 1)
                      }))}
                      className="w-20 px-2 py-1 text-lg font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      autoFocus
                    />
                    <span className="text-sm text-slate-600">selos</span>
                    <button
                      onClick={() => setEditingQuantity(null)}
                      className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setQuantityAdjustments(prev => {
                          const next = { ...prev };
                          delete next[offer.id];
                          return next;
                        });
                        setEditingQuantity(null);
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-xl ${wasAdjusted ? 'text-amber-600' : 'text-slate-900'}`}>
                      {currentQuantity} selos
                    </p>
                    {wasAdjusted && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        (era {offer.quantity})
                      </span>
                    )}
                    <button
                      onClick={() => {
                        if (quantityAdjustments[offer.id] === undefined) {
                          setQuantityAdjustments(prev => ({ ...prev, [offer.id]: offer.quantity }));
                        }
                        setEditingQuantity(offer.id);
                      }}
                      className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded transition-colors"
                      title="Ajustar quantidade"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {offer.collection && <p className="text-xs text-slate-500">{offer.collection}</p>}
                {offer.notes && <p className="text-xs text-slate-400 mt-0.5">{offer.notes}</p>}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(offer.id, offer.quantity)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    {wasAdjusted ? `Aprovar ${currentQuantity}` : 'Aprovar'}
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
              placeholder="Motivo da rejeição (opcional)"
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
                Confirmar rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Active Requests Tab
// ============================================================================
interface RequestWithPhone extends StampListingWithProfile {
  user: StampListingWithProfile['user'] & { phone: string };
}

function ActiveRequestsTab() {
  const [requests, setRequests] = useState<RequestWithPhone[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { requests: data } = await api.getActiveRequests();
      setRequests(data as RequestWithPhone[]);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadRequests(); }, []);

  const handleFulfill = async (id: string) => {
    setActionLoading(id);
    try {
      await api.fulfillRequest(id);
      await loadRequests();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const formatPhone = (phone: string) => {
    // Format phone for display (e.g., 351912345678 -> +351 912 345 678)
    if (phone.startsWith('351') && phone.length === 12) {
      return `+351 ${phone.slice(3, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
    }
    return phone;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 space-y-3 pb-8">
      <p className="text-xs text-slate-500">{requests.length} pedido(s) ativo(s)</p>

      {requests.length === 0 && (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">Nenhum pedido ativo</p>
          <p className="text-xs text-slate-400 mt-1">Os pedidos aparecerão aqui quando os utilizadores pedirem selos</p>
        </div>
      )}

      {requests.map((request, index) => {
        const tierStyle = getTierStyle(request.user?.tier ?? 1);
        const isLoading = actionLoading === request.id;

        return (
          <div key={request.id} className="bg-white rounded-xl p-4 shadow-card border border-sky-100 space-y-3">
            {/* Position badge */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                #{index + 1} na fila
              </span>
              <span className="text-[10px] text-slate-400">{formatDate(request.createdAt)}</span>
            </div>

            {/* User info */}
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${tierStyle.gradient} flex items-center justify-center`}>
                <span className="text-sm">{tierStyle.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-slate-900">{request.user?.displayName || 'Anónimo'}</p>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tierStyle.badge}`}>
                  Nv.{request.user?.level ?? 1}
                </span>
              </div>
              <div className="text-right">
                <p className="font-bold text-xl text-sky-600">{request.quantity}</p>
                <p className="text-[10px] text-slate-400">selos</p>
              </div>
            </div>

            {/* Phone number */}
            <div className="flex items-center gap-2 p-3 bg-sky-50 border border-sky-100 rounded-xl">
              <Phone className="w-4 h-4 text-sky-600" />
              <span className="flex-1 font-mono text-sm font-medium text-sky-700">{formatPhone(request.user.phone)}</span>
              <button
                onClick={() => copyPhone(request.user.phone)}
                className="flex items-center gap-1 px-2 py-1 bg-sky-100 hover:bg-sky-200 rounded-lg text-xs font-medium text-sky-700 transition-colors"
              >
                {copiedPhone === request.user.phone ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copiar
                  </>
                )}
              </button>
            </div>

            {/* ID */}
            <p className="text-[10px] text-slate-400 font-mono">ID: {request.id.slice(0, 8)}</p>

            {/* Action button */}
            <button
              onClick={() => handleFulfill(request.id)}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Marcar como Enviado
                </>
              )}
            </button>
          </div>
        );
      })}
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
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newStartsAt, setNewStartsAt] = useState('');
  const [newEndsAt, setNewEndsAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Item creation/editing
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ collectionId: string; item: StampCollectionWithItems['items'][0] } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemSubtitle, setNewItemSubtitle] = useState('');
  const [newItemImageUrl, setNewItemImageUrl] = useState('');

  // Expanded item for redemption options
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

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
      setError('Preenche todos os campos obrigatórios');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.createCollection({
        name: newName,
        description: newDesc || undefined,
        imageUrl: newImageUrl || undefined,
        startsAt: new Date(newStartsAt).toISOString(),
        endsAt: new Date(newEndsAt).toISOString(),
        isActive: true,
      });
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      setNewImageUrl('');
      setNewStartsAt('');
      setNewEndsAt('');
      await loadCollections();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar coleção');
    }
    setSaving(false);
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Tens a certeza que queres apagar esta coleção?')) return;
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
        imageUrl: newItemImageUrl || undefined,
      });
      setAddingItemTo(null);
      setNewItemName('');
      setNewItemSubtitle('');
      setNewItemImageUrl('');
      await loadCollections();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !newItemName) return;
    setSaving(true);
    try {
      await api.updateCollectionItem(editingItem.collectionId, editingItem.item.id, {
        name: newItemName,
        subtitle: newItemSubtitle || undefined,
        imageUrl: newItemImageUrl || undefined,
      });
      setEditingItem(null);
      setNewItemName('');
      setNewItemSubtitle('');
      setNewItemImageUrl('');
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

  const startEditItem = (collectionId: string, item: StampCollectionWithItems['items'][0]) => {
    setEditingItem({ collectionId, item });
    setNewItemName(item.name);
    setNewItemSubtitle(item.subtitle || '');
    setNewItemImageUrl(item.imageUrl || '');
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
        <p className="text-xs text-slate-500">{collections.length} coleção(ões)</p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Coleção
        </button>
      </div>

      {/* Create collection form */}
      {showCreate && (
        <div className="bg-white rounded-xl p-4 shadow-card border border-slate-100 space-y-3">
          <h3 className="font-semibold text-sm text-slate-900">Nova Coleção</h3>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome da coleção"
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={2}
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
          />
          <div>
            <label className="text-xs text-slate-500 mb-1 block">URL da Imagem (opcional)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
              {newImageUrl && (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  <img src={newImageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Início</label>
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
              onClick={() => { setShowCreate(false); setError(''); setNewImageUrl(''); }}
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
              {col.imageUrl ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  <img src={col.imageUrl} alt={col.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
              )}
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
                  <ItemCard
                    key={item.id}
                    item={item}
                    collectionId={col.id}
                    expanded={expandedItem === item.id}
                    onToggle={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                    onEdit={() => startEditItem(col.id, item)}
                    onDelete={() => handleDeleteItem(col.id, item.id)}
                    onRefresh={loadCollections}
                  />
                ))}

                {/* Add item form */}
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
                      placeholder="Subtítulo (opcional)"
                      className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">URL da Imagem (opcional)</label>
                      <input
                        type="url"
                        value={newItemImageUrl}
                        onChange={(e) => setNewItemImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setAddingItemTo(null); setNewItemName(''); setNewItemSubtitle(''); setNewItemImageUrl(''); }}
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

      {/* Edit item modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingItem(null)} />
          <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Editar Item</h3>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Nome do item"
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
            <input
              type="text"
              value={newItemSubtitle}
              onChange={(e) => setNewItemSubtitle(e.target.value)}
              placeholder="Subtítulo (opcional)"
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
            <div>
              <label className="text-xs text-slate-500 mb-1 block">URL da Imagem (opcional)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newItemImageUrl}
                  onChange={(e) => setNewItemImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
                {newItemImageUrl && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    <img src={newItemImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingItem(null); setNewItemName(''); setNewItemSubtitle(''); setNewItemImageUrl(''); }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateItem}
                disabled={saving || !newItemName}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-sm font-semibold text-white transition-colors disabled:bg-slate-200"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Item Card Component with Redemption Options
// ============================================================================
interface ItemCardProps {
  item: StampCollectionWithItems['items'][0];
  collectionId: string;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

function ItemCard({ item, collectionId, expanded, onToggle, onEdit, onDelete, onRefresh }: ItemCardProps) {
  const [showOptionForm, setShowOptionForm] = useState(false);
  const [optionStamps, setOptionStamps] = useState(5);
  const [optionFee, setOptionFee] = useState('0');
  const [optionLabel, setOptionLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreateOption = async () => {
    setSaving(true);
    try {
      await api.createRedemptionOption(collectionId, item.id, {
        stampsRequired: optionStamps,
        feeEuros: parseFloat(optionFee) || 0,
        label: optionLabel || undefined,
      });
      setShowOptionForm(false);
      setOptionStamps(5);
      setOptionFee('0');
      setOptionLabel('');
      onRefresh();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDeleteOption = async (optionId: string) => {
    try {
      await api.deleteRedemptionOption(collectionId, item.id, optionId);
      onRefresh();
    } catch { /* ignore */ }
  };

  return (
    <div className="bg-slate-50 rounded-lg overflow-hidden">
      {/* Item header */}
      <button onClick={onToggle} className="w-full text-left p-3 flex items-center gap-3 hover:bg-slate-100 transition-colors">
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
          {item.subtitle && <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>}
          <p className="text-[10px] text-slate-400">{item.options?.length || 0} opções de resgate</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {item.isOutOfStock && (
            <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-medium rounded-full border border-red-100">
              Esgotado
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronDown className="w-4 h-4 text-slate-300" /> : <ChevronRight className="w-4 h-4 text-slate-300" />}
        </div>
      </button>

      {/* Expanded content - Redemption options */}
      {expanded && (
        <div className="border-t border-slate-200 px-3 pb-3">
          <div className="flex items-center justify-between mt-2.5 mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opções de Resgate</p>
            <button
              onClick={() => setShowOptionForm(true)}
              className="flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-700"
            >
              <Plus className="w-3 h-3" /> Adicionar
            </button>
          </div>

          {(!item.options || item.options.length === 0) && !showOptionForm && (
            <p className="text-xs text-slate-400 text-center py-2">Sem opções de resgate</p>
          )}

          {/* Existing options */}
          {item.options && item.options.length > 0 && (
            <div className="space-y-1.5">
              {[...item.options].sort((a, b) => a.sortOrder - b.sortOrder).map((opt) => (
                <div key={opt.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-100">
                  <div>
                    {opt.label && <p className="text-xs font-bold text-slate-700">{opt.label}</p>}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-green-600">{opt.stampsRequired} selos</span>
                      <span className="text-slate-300">+</span>
                      <span className={`text-xs font-black ${opt.feeEuros === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                        {formatEuros(opt.feeEuros)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteOption(opt.id)}
                    className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add option form */}
          {showOptionForm && (
            <div className="mt-2 bg-white rounded-lg p-3 border border-green-200 space-y-2">
              <p className="text-xs font-bold text-slate-500">Nova Opção de Resgate</p>
              <input
                type="text"
                value={optionLabel}
                onChange={(e) => setOptionLabel(e.target.value)}
                placeholder="Etiqueta (opcional)"
                className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-green-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Selos necessários</label>
                  <input
                    type="number"
                    min={0}
                    value={optionStamps}
                    onChange={(e) => setOptionStamps(parseInt(e.target.value) || 0)}
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Taxa (€)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={optionFee}
                    onChange={(e) => setOptionFee(e.target.value)}
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowOptionForm(false); setOptionStamps(5); setOptionFee('0'); setOptionLabel(''); }}
                  className="flex-1 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateOption}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-bold text-white disabled:bg-slate-200"
                >
                  {saving ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Check className="w-3 h-3" /> Guardar</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
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
        <h3 className="font-semibold text-sm text-slate-900">Configurações</h3>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Telemóvel do administrador (para WhatsApp)
          </label>
          <input
            type="tel"
            value={adminPhone}
            onChange={(e) => { setAdminPhone(e.target.value.replace(/\D/g, '')); setSaved(false); }}
            placeholder="912345678"
            className="w-full py-3 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Este número será usado para que os utilizadores contactem via WhatsApp para combinar a entrega de selos.
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

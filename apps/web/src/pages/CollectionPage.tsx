import { useState, useEffect } from 'react';
import { BookOpen, Package, ChevronDown, AlertTriangle, RefreshCw, X } from 'lucide-react';
import type { StampCollectionWithItems, CollectionItemWithOptions } from '@stamps-share/shared';
import { formatEuros } from '../lib/constants';
import { api } from '../api/client';

// Item Card Component - Similar to Continente app style
function ItemCard({
  item,
  collectionName,
  onClick
}: {
  item: CollectionItemWithOptions;
  collectionName: string;
  onClick: () => void;
}) {
  const sortedOptions = [...(item.options || [])].sort((a, b) => a.stampsRequired - b.stampsRequired);

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all active:scale-[0.98] flex flex-col h-full"
    >
      {/* Header with brand and swap icon */}
      <div className="flex items-center justify-between px-3 pt-3">
        <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
          {collectionName}
        </span>
        <RefreshCw className="w-4 h-4 text-slate-300" />
      </div>

      {/* Product Image */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-[100px]">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="max-h-24 w-auto object-contain"
          />
        ) : (
          <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center">
            <Package className="w-10 h-10 text-slate-300" />
          </div>
        )}
      </div>

      {/* Product Name */}
      <div className="px-3 pb-2">
        <p className="font-bold text-sm text-slate-800 text-center line-clamp-2 min-h-[40px]">
          {item.name}
        </p>
      </div>

      {/* Out of Stock Badge */}
      {item.isOutOfStock && (
        <div className="px-3 pb-2">
          <span className="inline-block px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-full">
            Esgotado
          </span>
        </div>
      )}

      {/* Redemption Options */}
      {sortedOptions.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/50">
          <div className="flex divide-x divide-slate-200">
            {sortedOptions.slice(0, 2).map((opt) => (
              <div key={opt.id} className="flex-1 py-2 px-2 text-center">
                <p className="text-xs font-bold text-red-600">
                  {opt.stampsRequired} selos
                </p>
                <p className="text-[11px] text-slate-500">
                  {opt.feeEuros === 0 ? 'Grátis' : formatEuros(opt.feeEuros)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}

// Item Detail Modal
function ItemDetailModal({
  item,
  collectionName,
  onClose
}: {
  item: CollectionItemWithOptions;
  collectionName: string;
  onClose: () => void;
}) {
  const sortedOptions = [...(item.options || [])].sort((a, b) => a.stampsRequired - b.stampsRequired);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <span className="text-xs font-bold tracking-[0.15em] text-slate-400 uppercase">
            {collectionName}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Product Image */}
          <div className="flex justify-center">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="max-h-40 w-auto object-contain"
              />
            ) : (
              <div className="w-32 h-32 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Package className="w-16 h-16 text-slate-300" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="text-center">
            <h2 className="font-bold text-xl text-slate-900">{item.name}</h2>
            {item.subtitle && (
              <p className="text-sm text-slate-500 mt-1">{item.subtitle}</p>
            )}
          </div>

          {/* Out of Stock */}
          {item.isOutOfStock && (
            <div className="flex items-center justify-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">Produto Esgotado</span>
            </div>
          )}

          {/* Redemption Options */}
          {sortedOptions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 text-center">Opções de Resgate</h3>
              <div className="grid gap-2">
                {sortedOptions.map((opt) => (
                  <div
                    key={opt.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div>
                      {opt.label && (
                        <p className="text-sm font-medium text-slate-700">{opt.label}</p>
                      )}
                      <p className="text-lg font-bold text-red-600">
                        {opt.stampsRequired} selos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">
                        {opt.feeEuros === 0 ? 'Grátis' : formatEuros(opt.feeEuros)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CollectionPage() {
  const [collections, setCollections] = useState<StampCollectionWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<StampCollectionWithItems | null>(null);
  const [selectedItem, setSelectedItem] = useState<CollectionItemWithOptions | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { collections: data } = await api.getCollections();
        setCollections(data);
        // Auto-select the first active collection
        const active = data.find((c) => c.isActive);
        if (active) setSelectedCollection(active);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Get all items from selected collection or all collections
  const displayCollection = selectedCollection || (collections.length === 1 ? collections[0] : null);
  const allItems = displayCollection
    ? [...(displayCollection.items || [])].sort((a, b) => a.sortOrder - b.sortOrder)
    : collections.flatMap(c => c.items || []).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="px-4 pt-4 pb-6 space-y-4 bg-amber-50/30 min-h-full">
      {/* Collection Selector */}
      {collections.length > 1 && (
        <div className="relative">
          <select
            value={selectedCollection?.id || ''}
            onChange={(e) => {
              const col = collections.find(c => c.id === e.target.value);
              setSelectedCollection(col || null);
            }}
            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          >
            <option value="">Todas as Coleções</option>
            {collections.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        </div>
      )}

      {/* Collection Header */}
      {displayCollection && (
        <div className="flex items-center gap-3">
          {displayCollection.imageUrl ? (
            <img
              src={displayCollection.imageUrl}
              alt={displayCollection.name}
              className="w-12 h-12 rounded-xl object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-red-600" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-lg text-slate-900">{displayCollection.name}</h1>
            {displayCollection.description && (
              <p className="text-xs text-slate-500">{displayCollection.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Items Grid */}
      {allItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-600">Nenhum item disponível</p>
          <p className="text-sm text-slate-400 mt-1">Os itens serão adicionados em breve.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {allItems.map((item) => {
            const parentCollection = collections.find(c => c.id === item.collectionId);
            return (
              <ItemCard
                key={item.id}
                item={item}
                collectionName={parentCollection?.name || ''}
                onClick={() => setSelectedItem(item)}
              />
            );
          })}
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          collectionName={collections.find(c => c.id === selectedItem.collectionId)?.name || ''}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

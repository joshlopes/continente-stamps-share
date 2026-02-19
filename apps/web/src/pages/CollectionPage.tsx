import { useState, useEffect } from 'react';
import { BookOpen, Package, ChevronRight, AlertTriangle, Tag } from 'lucide-react';
import type { StampCollectionWithItems, CollectionItemWithOptions } from '@stamps-share/shared';
import { formatEuros } from '../lib/constants';
import { api } from '../api/client';

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
        // Auto-select the active collection
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
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Item detail view
  if (selectedItem) {
    const sortedOptions = [...(selectedItem.options || [])].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
      <div className="px-4 pt-4 space-y-4">
        <button
          onClick={() => setSelectedItem(null)}
          className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Voltar
        </button>

        <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-slate-100">
          {selectedItem.imageUrl && (
            <div className="h-48 bg-slate-100">
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4 space-y-4">
            <div>
              <h2 className="font-bold text-lg text-slate-900">{selectedItem.name}</h2>
              {selectedItem.subtitle && (
                <p className="text-sm text-slate-500 mt-0.5">{selectedItem.subtitle}</p>
              )}
            </div>

            {selectedItem.isOutOfStock && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">Esgotado</span>
              </div>
            )}

            {sortedOptions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Opcoes de resgate</h3>
                <div className="space-y-2">
                  {sortedOptions.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-slate-400" />
                        <div>
                          {opt.label && <p className="text-sm font-medium text-slate-900">{opt.label}</p>}
                          <p className="text-xs text-slate-500">{opt.stampsRequired} selos</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatEuros(opt.feeEuros)}
                      </span>
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

  // Collection items view
  if (selectedCollection) {
    const sortedItems = [...(selectedCollection.items || [])].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
      <div className="px-4 pt-4 space-y-4">
        {collections.length > 1 && (
          <button
            onClick={() => setSelectedCollection(null)}
            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Todas as colecoes
          </button>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-card border border-slate-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900">{selectedCollection.name}</h2>
              {selectedCollection.description && (
                <p className="text-xs text-slate-500">{selectedCollection.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-3 text-xs text-slate-400">
            <span>{sortedItems.length} itens</span>
            {selectedCollection.startsAt && (
              <span>Desde {new Date(selectedCollection.startsAt).toLocaleDateString('pt-PT')}</span>
            )}
          </div>
        </div>

        {sortedItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">Nenhum item nesta colecao</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="w-full bg-white rounded-xl p-3 shadow-card border border-slate-100 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
              >
                {item.imageUrl ? (
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">{item.name}</p>
                  {item.subtitle && (
                    <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                  )}
                  {item.options && item.options.length > 0 && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {item.options.length} {item.options.length === 1 ? 'opcao' : 'opcoes'} de resgate
                    </p>
                  )}
                </div>
                {item.isOutOfStock && (
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-medium rounded-full border border-red-100">
                    Esgotado
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Collections list view
  return (
    <div className="px-4 pt-4 space-y-4">
      <h2 className="font-bold text-lg text-slate-900">Colecoes</h2>

      {collections.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">Nenhuma colecao disponivel</p>
          <p className="text-xs text-slate-400 mt-1">As colecoes serao adicionadas em breve.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => setSelectedCollection(col)}
              className="w-full bg-white rounded-xl p-4 shadow-card border border-slate-100 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
            >
              {col.imageUrl ? (
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  <img src={col.imageUrl} alt={col.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-slate-900">{col.name}</p>
                  {col.isActive && (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">
                      Ativa
                    </span>
                  )}
                </div>
                {col.description && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{col.description}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  {col.items?.length ?? 0} itens
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

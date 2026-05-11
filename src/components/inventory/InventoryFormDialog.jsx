import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select';

export default function InventoryFormDialog({ open, onOpenChange, item, onSave, isLoading, allItems = [] }) {

  const [form, setForm] = useState({
    catalog_id: '', supplier_id: '', location_id: '', quantity: '', unit_price: ''
  });
  const [locationLocked, setLocationLocked] = useState(false);

  // ─── Queries relacionais ────────────────────────────────────────────────────

  const { data: catalog = [] } = useQuery({
    queryKey: ['product_catalog'],
    queryFn: () => api.entities.ProductCatalog.list('name', 200),
    enabled: open,
  });

  // Busca todos os vínculos Produto-Fornecedor
  const { data: productSuppliers = [] } = useQuery({
    queryKey: ['product_supplier'],
    queryFn: async () => {
      try {
        const res = await api.entities.ProductSupplier.list('id', 500);
        return Array.isArray(res) ? res : (res?.data || []);
      } catch (err) {
        console.warn('Fallback ativado para product_supplier:', err.message);
        try {
          const token = localStorage.getItem('orbyte_token');
          const response = await fetch('/api/entities/product_supplier?orderBy=id&limit=500', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) return [];
          const fallbackRes = await response.json();
          return Array.isArray(fallbackRes) ? fallbackRes : (fallbackRes?.data || []);
        } catch {
          return [];
        }
      }
    },
    enabled: open,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      try {
        const res = await api.entities.Location.list('name', 200);
        const data = Array.isArray(res) ? res : (res?.data || []);
        if (data.length > 0) return data;
        throw new Error('apiClient falhou para locations');
      } catch (err) {
        console.warn('Fallback ativado para locations:', err.message);
        try {
          const token = localStorage.getItem('orbyte_token');
          const response = await fetch('/api/entities/locations?orderBy=name&limit=200', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) return [];
          const fallbackRes = await response.json();
          return Array.isArray(fallbackRes) ? fallbackRes : (fallbackRes?.data || []);
        } catch {
          return [];
        }
      }
    },
    enabled: open,
  });

  const { data: allSuppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      try {
        const res = await api.entities.Supplier.list('name', 200);
        const data = Array.isArray(res) ? res : (res?.data || []);
        if (data.length > 0) return data;
        throw new Error('apiClient retornou vazio');
      } catch (err) {
        console.warn('Fallback ativado para fornecedores:', err.message);
        try {
          const token = localStorage.getItem('orbyte_token');
          const response = await fetch('/api/entities/suppliers?orderBy=name&limit=200', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) return [];
          const fallbackRes = await response.json();
          return Array.isArray(fallbackRes) ? fallbackRes : (fallbackRes?.data || []);
        } catch {
          return [];
        }
      }
    },
    enabled: open,
  });

  // ─── Dados derivados ────────────────────────────────────────────────────────

  // Produto selecionado no catálogo (para SKU e Categoria)
  const selectedCatalogItem = useMemo(
    () => catalog.find(c => String(c.id) === String(form.catalog_id)),
    [catalog, form.catalog_id]
  );

  // IDs de fornecedores vinculados ao produto selecionado
  const linkedSupplierIds = useMemo(() => {
    if (!form.catalog_id) return [];
    return productSuppliers
      .filter(ps => String(ps.catalog_id) === String(form.catalog_id))
      .map(ps => String(ps.supplier_id));
  }, [productSuppliers, form.catalog_id]);

  // Lista de fornecedores filtrada pelo catálogo
  const filteredSuppliers = useMemo(
    () => allSuppliers.filter(s => linkedSupplierIds.includes(String(s.id))),
    [allSuppliers, linkedSupplierIds]
  );

  // Item existente no inventário para o par (catalog_id + supplier_id)
  const existingItem = useMemo(() => {
    if (!form.catalog_id || !form.supplier_id) return null;
    return allItems.find(
      i =>
        String(i.catalog_id) === String(form.catalog_id) &&
        String(i.supplier_id) === String(form.supplier_id)
    ) || null;
  }, [allItems, form.catalog_id, form.supplier_id]);

  // ─── Inicialização ao abrir o modal ────────────────────────────────────────
  useEffect(() => {
    if (item) {
      // Aberto via clique na linha: pré-seleciona catálogo e fornecedor
      setForm({
        catalog_id:  item.catalog_id  ? String(item.catalog_id)  : '',
        supplier_id: item.supplier_id ? String(item.supplier_id) : '',
        location_id: item.location_id ? String(item.location_id) : '',
        quantity:    '',   // Sempre limpo — campo de ENTRADA
        unit_price:  '',
      });
      setLocationLocked(!!item.location_id);
    } else {
      setForm({ catalog_id: '', supplier_id: '', location_id: '', quantity: '', unit_price: '' });
      setLocationLocked(false);
    }
  }, [item, open]);

  // ─── Smart Fill: reage à mudança do par Produto + Fornecedor ───────────────
  useEffect(() => {
    if (!form.catalog_id || !form.supplier_id) return;

    const found = allItems.find(
      i =>
        String(i.catalog_id) === String(form.catalog_id) &&
        String(i.supplier_id) === String(form.supplier_id) &&
        i.location_id
    );

    if (found) {
      setForm(prev => ({ ...prev, location_id: String(found.location_id) }));
      setLocationLocked(true);
    } else {
      setForm(prev => ({ ...prev, location_id: '' }));
      setLocationLocked(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.catalog_id, form.supplier_id]);

  // Ao trocar o produto, limpa o fornecedor para forçar nova seleção
  const handleCatalogChange = (val) => {
    setForm(prev => ({ ...prev, catalog_id: val, supplier_id: '', location_id: '' }));
    setLocationLocked(false);
  };

  // ─── Submissão ────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();

    const qtdEntrada   = Number(form.quantity)    || 0;
    const precoEntrada = Number(form.unit_price)  || 0;

    const saldoAnterior = existingItem ? Number(existingItem.quantity)   : 0;
    const precoAnterior = existingItem ? Number(existingItem.unit_price) : 0;

    const novoSaldo = saldoAnterior + qtdEntrada;

    const pmp = novoSaldo > 0
      ? ((qtdEntrada * precoEntrada) + (saldoAnterior * precoAnterior)) / novoSaldo
      : precoEntrada;

    // SKU vem estritamente do catálogo — sem geração automática
    const finalSku = selectedCatalogItem?.sku || existingItem?.sku || '';

    onSave({
      ...(existingItem && { id: existingItem.id }),
      catalog_id:   form.catalog_id  ? Number(form.catalog_id)  : null,
      supplier_id:  form.supplier_id ? Number(form.supplier_id) : null,
      location_id:  form.location_id ? Number(form.location_id) : null,
      sku:          finalSku,
      quantity:     novoSaldo,
      unit_price:   parseFloat(pmp.toFixed(4)),
      min_quantity: existingItem ? (parseFloat(existingItem.min_quantity) || 0) : 0,
    });
  };

  // ─── Valores para o Preview ────────────────────────────────────────────────
  const saldoAtual     = existingItem ? Number(existingItem.quantity) : null;
  const hasPrevStock   = saldoAtual !== null && saldoAtual > 0;
  const qtdEntradaNum  = Number(form.quantity) || 0;
  const precoEntradaNum = Number(form.unit_price) || 0;
  const precoAnteriorNum = existingItem ? Number(existingItem.unit_price) : 0;
  const novoSaldoPreview = (saldoAtual || 0) + qtdEntradaNum;
  const pmpPreview = novoSaldoPreview > 0
    ? ((qtdEntradaNum * precoEntradaNum) + ((saldoAtual || 0) * precoAnteriorNum)) / novoSaldoPreview
    : precoEntradaNum;

  const modoEntrada = !!existingItem; // true → Update | false → Create

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Entrada de Material</DialogTitle>
          <DialogDescription className="hidden">
            Registre a entrada de mercadoria no estoque.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">

            {/* 1. Produto do Catálogo */}
            <div className="col-span-2">
              <Label>Produto (Catálogo) *</Label>
              <Select value={form.catalog_id} onValueChange={handleCatalogChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto que está entrando..." />
                </SelectTrigger>
                <SelectContent>
                  {catalog.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Categoria — read-only do catálogo */}
            <div>
              <Label>Categoria</Label>
              <Input
                value={selectedCatalogItem?.category || ''}
                disabled
                placeholder="—"
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* 3. SKU — dado mestre, estritamente read-only */}
            <div>
              <Label>SKU <span className="text-xs text-muted-foreground">(dado mestre)</span></Label>
              <Input
                value={selectedCatalogItem?.sku || existingItem?.sku || (form.catalog_id ? '—' : '—')}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* 4. Fornecedor — habilitado apenas após selecionar o produto */}
            <div className="col-span-2">
              <Label>
                Fornecedor *
                {!form.catalog_id && (
                  <span className="ml-2 text-xs text-muted-foreground">(selecione o produto primeiro)</span>
                )}
                {form.catalog_id && filteredSuppliers.length === 0 && (
                  <span className="ml-2 text-xs text-amber-600">(nenhum fornecedor vinculado)</span>
                )}
              </Label>
              <Select
                value={form.supplier_id}
                onValueChange={(val) => setForm(prev => ({ ...prev, supplier_id: val }))}
                disabled={!form.catalog_id || filteredSuppliers.length === 0}
              >
                <SelectTrigger className={!form.catalog_id ? 'opacity-50 cursor-not-allowed' : ''}>
                  <SelectValue placeholder={
                    !form.catalog_id
                      ? 'Aguardando seleção do produto...'
                      : filteredSuppliers.length === 0
                        ? 'Nenhum fornecedor cadastrado para este produto'
                        : 'Selecione o fornecedor desta entrada...'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filteredSuppliers.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Badge de modo (Soma de Saldo vs Novo Lote) */}
            {form.catalog_id && form.supplier_id && (
              <div className="col-span-2">
                {modoEntrada ? (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                    <span>📦 Reposição de estoque</span>
                    <strong className="ml-1">{saldoAtual} un.</strong>
                    <span className="text-blue-600 text-xs ml-auto">
                      PMP atual: R$ {precoAnteriorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
                    <span>🆕 Novo lote — primeiro registro deste fornecedor para este produto</span>
                  </div>
                )}
              </div>
            )}

            {/* 5. Localização — bloqueada pelo Smart Fill em reposições */}
            <div className="col-span-2">
              <Label>
                Localização
                {locationLocked && (
                  <span className="ml-2 text-xs text-amber-600 font-medium">🔒 Travado (mesmo local do lote atual)</span>
                )}
              </Label>
              <Select
                value={form.location_id}
                onValueChange={(val) => !locationLocked && setForm(prev => ({ ...prev, location_id: val }))}
                disabled={locationLocked || !form.supplier_id}
              >
                <SelectTrigger className={locationLocked ? 'opacity-60 cursor-not-allowed' : ''}>
                  <SelectValue placeholder="Selecione a prateleira / área..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(l => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 6. Quantidade de Entrada */}
            <div>
              <Label>Quantidade de Entrada (+) *</Label>
              <Input
                type="number"
                min="0.01"
                step="any"
                value={form.quantity}
                onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="0"
                required
                disabled={!form.supplier_id}
              />
            </div>

            {/* 7. Custo unitário desta compra */}
            <div>
              <Label>
                Custo Unit. desta Compra (R$)
                {hasPrevStock && qtdEntradaNum > 0 && (
                  <span className="block text-xs text-blue-600 font-medium mt-0.5">⚖ PMP será recalculado</span>
                )}
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.unit_price}
                onChange={e => setForm(prev => ({ ...prev, unit_price: e.target.value }))}
                placeholder="0,00"
                disabled={!form.supplier_id}
              />
            </div>

            {/* 8. Preview em tempo real do novo saldo e PMP */}
            {form.supplier_id && qtdEntradaNum > 0 && (
              <div className="col-span-2">
                <div className="flex items-center gap-4 p-2 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
                  <span>✅ Novo saldo:</span>
                  <strong>{novoSaldoPreview} un.</strong>
                  {form.unit_price && (
                    <>
                      <span className="ml-auto text-xs">Novo PMP:</span>
                      <strong className="text-xs">
                        R$ {pmpPreview.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </>
                  )}
                </div>
              </div>
            )}

          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !form.catalog_id || !form.supplier_id || !form.quantity || Number(form.quantity) <= 0}
            >
              {isLoading ? 'Registrando...' : modoEntrada ? 'Confirmar Reposição' : 'Confirmar Novo Lote'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// Helpers de Validação e Máscara
const validateCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  let add = 0;
  for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;
  add = 0;
  for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10))) return false;
  return true;
};

const validateCNPJ = (cnpj) => {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false;
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  let digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  return true;
};

const maskPhone = (v) => {
  v = v.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 10) {
    return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (v.length > 5) {
    return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  } else if (v.length > 2) {
    return v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  }
  return v;
};

const maskDocument = (v) => {
  v = v.replace(/\D/g, '');
  if (v.length > 14) v = v.slice(0, 14);
  if (v.length > 11) {
    return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  } else {
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
};

const maskCEP = (v) => {
  v = v.replace(/\D/g, '');
  if (v.length > 8) v = v.slice(0, 8);
  return v.replace(/(\d{5})(\d{0,3})/, '$1-$2');
};

export default function ClientFormDialog({ open, onOpenChange, client, onSave, isLoading }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', document: '', cep: '', address: '', city: '', state: '', notes: '', status: 'active'
  });
  const [searchingCep, setSearchingCep] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (client) {
      setForm({ 
        name: client.name || '', 
        email: client.email || '', 
        phone: maskPhone(client.phone || ''), 
        document: maskDocument(client.document || ''), 
        cep: maskCEP(client.cep || ''),
        address: client.address || '', 
        city: client.city || '', 
        state: client.state || '', 
        notes: client.notes || '', 
        status: client.status || 'active' 
      });
    } else {
      setForm({ name: '', email: '', phone: '', document: '', cep: '', address: '', city: '', state: '', notes: '', status: 'active' });
    }
    setErrors({});
  }, [client, open]);

  const handleCepBlur = async () => {
    const cleanCep = form.cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setSearchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setForm(prev => ({
            ...prev,
            address: `${data.logradouro}${data.bairro ? ', ' + data.bairro : ''}`,
            city: data.localidade,
            state: data.uf
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
      } finally {
        setSearchingCep(false);
      }
    }
  };

  const handleEmailBlur = () => {
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      setErrors(prev => ({...prev, email: 'E-mail inválido (ex: nome@dominio.com)'}));
    } else {
      setErrors(prev => {
        const { email, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleDocumentChange = (value) => {
    const masked = maskDocument(value);
    const clean = masked.replace(/\D/g, '');
    
    setForm({...form, document: masked});

    if (clean.length === 11) {
      if (!validateCPF(clean)) {
        setErrors(prev => ({...prev, document: 'CPF inválido'}));
      } else {
        setErrors(prev => {
          const { document, ...rest } = prev;
          return rest;
        });
      }
    } else if (clean.length === 14) {
      if (!validateCNPJ(clean)) {
        setErrors(prev => ({...prev, document: 'CNPJ inválido'}));
      } else {
        setErrors(prev => {
          const { document, ...rest } = prev;
          return rest;
        });
      }
    } else if (clean.length > 0) {
      if (errors.document) {
        setErrors(prev => {
          const { document, ...rest } = prev;
          return rest;
        });
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (form.name.trim().length < 3) newErrors.name = 'Mínimo 3 caracteres';
    
    const cleanPhone = form.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) newErrors.phone = 'Telefone inválido';
    
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'E-mail inválido';
    
    const cleanDoc = form.document.replace(/\D/g, '');
    if (cleanDoc) {
      if (cleanDoc.length === 11) {
        if (!validateCPF(cleanDoc)) newErrors.document = 'CPF inválido';
      } else if (cleanDoc.length === 14) {
        if (!validateCNPJ(cleanDoc)) newErrors.document = 'CNPJ inválido';
      } else {
        newErrors.document = 'Documento incompleto';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const normalizedData = {
        ...form,
        phone: form.phone.replace(/\D/g, ''),
        document: form.document.replace(/\D/g, ''),
        cep: form.cep.replace(/\D/g, ''),
        name: form.name.trim()
      };
      onSave(normalizedData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className={errors.name ? 'text-red-500' : ''}>Nome *</Label>
              <Input 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                required 
              />
              {errors.name && <span className="text-[10px] text-red-500 mt-1">{errors.name}</span>}
            </div>

            <div>
              <Label className={errors.phone ? 'text-red-500' : ''}>Telefone *</Label>
              <Input 
                value={form.phone} 
                onChange={e => setForm({...form, phone: maskPhone(e.target.value)})} 
                placeholder="(99) 99999-9999"
                className={errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}
                required 
              />
              {errors.phone && <span className="text-[10px] text-red-500 mt-1">{errors.phone}</span>}
            </div>

            <div>
              <Label className={errors.email ? 'text-red-500' : ''}>Email</Label>
              <Input 
                type="email" 
                value={form.email} 
                onChange={e => {
                  setForm({...form, email: e.target.value});
                  if (errors.email) setErrors(prev => { const { email, ...rest } = prev; return rest; });
                }} 
                onBlur={handleEmailBlur}
                className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                placeholder="nome@exemplo.com"
              />
              {errors.email && <span className="text-[10px] text-red-500 mt-1">{errors.email}</span>}
            </div>

            <div>
              <Label className={errors.document ? 'text-red-500' : ''}>CPF/CNPJ</Label>
              <Input 
                value={form.document} 
                onChange={e => handleDocumentChange(e.target.value)} 
                placeholder="000.000.000-00"
                className={errors.document ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.document && <span className="text-[10px] text-red-500 mt-1">{errors.document}</span>}
            </div>

            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <hr className="col-span-2 border-border/50 my-1" />

            <div>
              <Label>CEP</Label>
              <div className="relative">
                <Input 
                  value={form.cep} 
                  onChange={e => setForm({...form, cep: maskCEP(e.target.value)})} 
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                />
                {searchingCep && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="flex items-end">
              <p className="text-[10px] text-muted-foreground pb-2">Preenchimento automático via ViaCEP.</p>
            </div>

            <div className="col-span-2">
              <Label>Endereço</Label>
              <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            </div>

            <div>
              <Label>Cidade</Label>
              <Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
            </div>

            <div>
              <Label>Estado (UF)</Label>
              <Input value={form.state} onChange={e => setForm({...form, state: e.target.value.toUpperCase()})} maxLength={2} placeholder="SP" />
            </div>

            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
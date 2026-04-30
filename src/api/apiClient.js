import { appParams } from '@/lib/app-params';
import { supabase } from '@/lib/supabase';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Mapeamento de Entidades para Tabelas do Supabase
const getTableName = (name) => {
  const map = {
    Technician: 'technicians',
    ServiceOrder: 'service_orders',
    Client: 'clients',
    InventoryItem: 'inventory_items',
    FinancialEntry: 'financial_entries',
    Appointment: 'appointments'
  };
  return map[name] || name.toLowerCase();
};

// Cliente gerador de CRUD do Supabase
const createSupabaseEntity = (name) => {
  const table = getTableName(name);
  
  return {
    list: async (orderBy = '-created_date', limit = 100) => {
      if (!supabase) {
        console.warn('Supabase não inicializado. Retornando array vazio.');
        return [];
      }
      
      const isDesc = orderBy.startsWith('-');
      const orderCol = isDesc ? orderBy.substring(1) : orderBy;
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order(orderCol, { ascending: !isDesc })
        .limit(limit);
        
      if (error) throw error;
      return data || [];
    },
    
    create: async (data) => {
      if (!supabase) throw new Error('Supabase não configurado');
      const { data: result, error } = await supabase
        .from(table)
        .insert([data])
        .select()
        .single();
        
      if (error) throw error;
      return result;
    },
    
    update: async (id, data) => {
      if (!supabase) throw new Error('Supabase não configurado');
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return result;
    },
    
    delete: async (id) => {
      if (!supabase) throw new Error('Supabase não configurado');
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return { success: true };
    }
  };
};

export const api = {
  auth: {
    login: async (email, password) => {
      if (!supabase) throw new Error('O banco de dados não está configurado.');
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw new Error('E-mail ou senha incorretos.');
      }
      
      return { 
        id: data.user.id, 
        name: data.user.user_metadata?.name || email, 
        email: data.user.email,
        role: data.user.user_metadata?.role || 'user'
      };
    },
    
    me: async () => {
      if (!supabase) throw { status: 401, message: 'Supabase não configurado' };
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        throw { status: 401, message: 'Não autenticado' };
      }
      
      return { 
        id: user.id, 
        name: user.user_metadata?.name || user.email, 
        email: user.email,
        role: user.user_metadata?.role || 'user'
      };
    },
    
    logout: async () => { 
      if (supabase) {
        await supabase.auth.signOut();
      }
      window.location.href = '/login';
    },
    
    redirectToLogin: () => { 
      window.location.href = '/login';
    },
    
    changePassword: async (newPassword) => {
      if (!supabase) throw new Error('Supabase não configurado');
      
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      return true;
    }
  },
  
  entities: {
    Technician: createSupabaseEntity('Technician'),
    ServiceOrder: createSupabaseEntity('ServiceOrder'),
    Client: createSupabaseEntity('Client'),
    InventoryItem: createSupabaseEntity('InventoryItem'),
    FinancialEntry: createSupabaseEntity('FinancialEntry'),
    Appointment: createSupabaseEntity('Appointment')
  },
  
  integrations: {
    Core: {
      InvokeLLM: async () => ({ result: 'Mock LLM Response' })
    }
  }
};

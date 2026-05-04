const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  // Remove barra no final se existir
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const API_URL = getBaseUrl();

// Helper para fazer requisições autenticadas
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('orbyte_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  // Garante que o endpoint comece com barra
  const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${API_URL}${safeEndpoint}`;
  
  console.log(`[API] Fetching: ${fullUrl}`);

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('orbyte_token');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Erro na requisição');
  }

  return data;
};

// Mapeamento de Entidades para Endpoints da API
const getEntityEndpoint = (name) => {
  const map = {
    Technician: '/entities/technicians',
    ServiceOrder: '/entities/service_orders',
    Client: '/entities/clients',
    InventoryItem: '/entities/inventory_items',
    FinancialEntry: '/entities/financial_entries',
    Appointment: '/entities/appointments'
  };
  return map[name] || `/entities/${name.toLowerCase()}`;
};

const createApiEntity = (name) => {
  const endpoint = getEntityEndpoint(name);
  
  return {
    list: async (orderBy = '-created_date', limit = 100) => {
      const query = new URLSearchParams({ orderBy, limit }).toString();
      return fetchWithAuth(`${endpoint}?${query}`);
    },
    
    create: async (data) => {
      return fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    update: async (id, data) => {
      return fetchWithAuth(`${endpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    delete: async (id) => {
      return fetchWithAuth(`${endpoint}/${id}`, {
        method: 'DELETE',
      });
    }
  };
};

export const api = {
  auth: {
    login: async (email, password) => {
      const data = await fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (data.token) {
        localStorage.setItem('orbyte_token', data.token);
      }
      
      return data.user;
    },
    
    me: async () => {
      const token = localStorage.getItem('orbyte_token');
      if (!token) throw { status: 401, message: 'Não autenticado' };
      
      try {
        const data = await fetchWithAuth('/auth/me');
        return data.user;
      } catch (error) {
        throw { status: 401, message: error.message };
      }
    },
    
    logout: () => {
      localStorage.removeItem('orbyte_token');
      window.location.href = `${import.meta.env.BASE_URL}login`;
    },
    
    redirectToLogin: () => {
      window.location.href = `${import.meta.env.BASE_URL}login`;
    },
    
    changePassword: async (newPassword) => {
      return fetchWithAuth('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
    },
    
    verifyIdentity: async (email, birthdate) => {
      return fetchWithAuth('/auth/verify-identity', {
        method: 'POST',
        body: JSON.stringify({ email, birthdate }),
      });
    },
    
    recoverPassword: async (email, birthdate, newPassword) => {
      return fetchWithAuth('/auth/recover-password', {
        method: 'POST',
        body: JSON.stringify({ email, birthdate, newPassword }),
      });
    },

    listUsers: async () => {
      const data = await fetchWithAuth('/auth/users');
      return data.users;
    },

    createUser: async (userData) => {
      return fetchWithAuth('/auth/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },

    updateUser: async (id, userData) => {
      return fetchWithAuth(`/auth/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    },

    deleteUser: async (id) => {
      return fetchWithAuth(`/auth/users/${id}`, {
        method: 'DELETE',
      });
    }
  },
  
  entities: {
    Technician: createApiEntity('Technician'),
    ServiceOrder: createApiEntity('ServiceOrder'),
    Client: createApiEntity('Client'),
    InventoryItem: createApiEntity('InventoryItem'),
    FinancialEntry: createApiEntity('FinancialEntry'),
    Appointment: createApiEntity('Appointment')
  },
  
  integrations: {
    Core: {
      InvokeLLM: async () => ({ result: 'Mock LLM Response' })
    }
  }
};

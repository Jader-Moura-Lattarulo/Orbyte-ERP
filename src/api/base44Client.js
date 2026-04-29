import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Mock implementation of base44 client to run locally without the SDK
const createMockEntity = (name) => ({
  list: async () => [],
  create: async (data) => ({ id: Math.random().toString(), ...data }),
  update: async (id, data) => ({ id, ...data }),
  delete: async (id) => ({ success: true })
});

export const base44 = {
  auth: {
    login: async (email, password) => {
      // Mock login validation
      if (email === 'admin@orbyte.com' && password === 'admin') {
        localStorage.setItem('orbyte_mock_token', 'mock_valid_token');
        return { id: '1', name: 'Admin Local', email: 'admin@orbyte.com' };
      }
      throw new Error('E-mail ou senha incorretos.');
    },
    me: async () => {
      // Check if logged in locally
      if (localStorage.getItem('orbyte_mock_token')) {
        return { id: '1', name: 'Admin Local', email: 'admin@orbyte.com' };
      }
      throw { status: 401, message: 'Não autenticado' };
    },
    logout: () => { 
      console.log('Mock logout'); 
      localStorage.removeItem('orbyte_mock_token');
    },
    redirectToLogin: () => { 
      console.log('Mock redirectToLogin'); 
      window.location.href = '/login';
    }
  },
  entities: {
    Technician: createMockEntity('Technician'),
    ServiceOrder: createMockEntity('ServiceOrder'),
    Client: createMockEntity('Client'),
    InventoryItem: createMockEntity('InventoryItem'),
    FinancialEntry: createMockEntity('FinancialEntry'),
    Appointment: createMockEntity('Appointment')
  },
  integrations: {
    Core: {
      InvokeLLM: async () => ({ result: 'Mock LLM Response' })
    }
  }
};

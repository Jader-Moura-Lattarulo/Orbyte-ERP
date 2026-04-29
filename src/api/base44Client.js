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
    me: async () => ({ id: '1', name: 'Admin Local', email: 'admin@local.com' }),
    logout: () => { 
      console.log('Mock logout'); 
      window.location.reload(); 
    },
    redirectToLogin: () => { 
      console.log('Mock redirectToLogin'); 
      // Em um ambiente puramente local e mockado, não redirecionamos
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

const { z } = require('zod');
const { isValidDocument } = require('./documentValidator');

const clientSchema = z.object({
  name: z.string().trim().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
  phone: z.string().trim().min(10).max(15).transform(v => v.replace(/\D/g, '')).refine(v => v.length >= 10 && v.length <= 11, 'Telefone inválido'),
  email: z.string().trim().email('Formato de e-mail inválido').or(z.literal('')),
  document: z.string().trim().min(11).max(18).transform(v => v.replace(/\D/g, '')).refine(v => v === '' || isValidDocument(v), 'CPF ou CNPJ inválido').or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
  cep: z.string().trim().max(10).optional().transform(v => v ? v.replace(/\D/g, '') : v),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().max(2).optional(),
  observations: z.string().trim().optional()
});

const validateClient = (data) => {
  return clientSchema.safeParse(data);
};

module.exports = { validateClient };

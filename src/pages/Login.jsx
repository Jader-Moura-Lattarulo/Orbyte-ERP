import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await api.auth.login(email, password);
      await checkUserAuth(); // Atualiza o estado do AuthContext
      navigate('/');
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: err.message || "Credenciais inválidas.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-8">
        <Card className="border-slate-200 shadow-xl">
          <CardHeader className="space-y-2 text-center flex flex-col items-center pb-6">
            <img src="/OrbyteLogo-vazado.svg" alt="Orbyte ERP" className="h-20 w-auto mb-2" />
            <CardTitle className="text-2xl font-bold tracking-tight pt-2">Acesse sua conta</CardTitle>
            <CardDescription className="text-slate-500">
              Insira suas credenciais para entrar no sistema.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@orbyte.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="bg-slate-50 border-slate-200"
                />
                <div className="flex justify-end pt-1">
                  <Link to="/esqueceu-senha" className="text-sm font-medium text-primary hover:underline">
                    Esqueceu a senha?
                  </Link>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </div>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              Acesso exclusivo para funcionários
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

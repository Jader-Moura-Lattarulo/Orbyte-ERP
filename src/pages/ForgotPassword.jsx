import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = Verificação, 2 = Nova Senha
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleVerify = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock verification
    setTimeout(() => {
      if (email === 'admin@orbyte.com' && birthdate === '1990-01-01') {
        setStep(2);
      } else {
        toast({
          variant: "destructive",
          title: "Usuário não encontrado",
          description: "Os dados informados não conferem em nosso sistema.",
        });
      }
      setIsLoading(false);
    }, 600); // Simulando um delay de rede
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Senhas diferentes",
        description: "A confirmação da senha não corresponde à nova senha.",
      });
      return;
    }

    setIsLoading(true);

    // Mock save password
    setTimeout(() => {
      toast({
        title: "Senha atualizada com sucesso",
        description: "Você já pode fazer login com sua nova senha.",
        className: "bg-green-600 text-white border-green-700",
      });
      navigate('/login');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-8">
        
        <Card className="border-slate-200 shadow-xl">
          <CardHeader className="space-y-2 text-center flex flex-col items-center pb-6">
            <img src="/OrbyteLogo-vazado.svg" alt="Orbyte ERP" className="h-10 w-auto mb-2" />
            <CardTitle className="text-2xl font-bold tracking-tight pt-2">
              {step === 1 ? 'Recuperar Senha' : 'Criar Nova Senha'}
            </CardTitle>
            <CardDescription className="text-slate-500">
              {step === 1 
                ? 'Informe seus dados para localizar seu cadastro.' 
                : 'Crie uma nova senha segura para sua conta.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {step === 1 ? (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail cadastrado</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="birthdate">Data de Nascimento</Label>
                  <Input 
                    id="birthdate" 
                    type="date" 
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    required 
                    className="bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verificando...' : 'Continuar'}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required 
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                    className="bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Salvando...' : 'Salvar e Voltar ao Login'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
            <Link to="/login" className="flex items-center text-sm font-medium text-slate-500 hover:text-primary transition-colors">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar para o Login
            </Link>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}

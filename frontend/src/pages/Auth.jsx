import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mic,
  Disc,
  ArrowLeft,
  Check,
  ShoppingCart,
  Upload,
  BarChart3,
  Headphones,
  Music2
} from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { signUp, signIn, getUserProfile } from '@/lib/supabase';

const Auth = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    name: '',
    user_type: 'artist'
  });

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Register with Supabase Auth
      // The database trigger will automatically create the user profile
      const { data: authData, error: authError } = await signUp(
        registerData.email,
        registerData.password,
        {
          name: registerData.name,
          user_type: registerData.user_type
        }
      );

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(authError.message || 'Erro ao cadastrar');
        }
        return;
      }

      if (authData?.user) {
        // Wait a moment for the database trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 500));

        // Fetch the profile created by the trigger
        let profile = null;
        let retries = 3;

        while (retries > 0 && !profile) {
          const { data: profileData, error: profileError } = await getUserProfile(authData.user.id);
          if (profileData) {
            profile = profileData;
            break;
          }
          if (profileError) {
            console.log('Waiting for profile creation...', profileError);
          }
          await new Promise(resolve => setTimeout(resolve, 300));
          retries--;
        }

        if (profile) {
          // Update auth context
          login(authData.user, profile);
          toast.success('Cadastro realizado com sucesso!');
          navigate('/');
        } else {
          // Profile not created yet - user may need to verify email first
          toast.success('Conta criada! Faça login para continuar.');
          navigate('/auth');
        }
      } else {
        toast.info('Verifique seu email para confirmar o cadastro');
      }
    } catch (error) {
      console.error('Register error:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signIn(loginData.email, loginData.password);

      if (error) {
        if (error.message.includes('Invalid login')) {
          toast.error('Email ou senha incorretos');
        } else {
          toast.error(error.message || 'Erro ao fazer login');
        }
        return;
      }

      if (data?.user) {
        // Fetch user profile
        const { data: profile, error: profileError } = await getUserProfile(data.user.id);

        if (profileError || !profile) {
          toast.error('Perfil não encontrado. Tente cadastrar novamente.');
          return;
        }

        // Update auth context
        login(data.user, profile);
        toast.success('Login realizado com sucesso!');
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const artistBenefits = [
    { icon: ShoppingCart, text: 'Compre beats de alta qualidade' },
    { icon: Headphones, text: 'Preview ilimitado antes de comprar' },
    { icon: Music2, text: 'Crie projetos com seus beats' }
  ];

  const producerBenefits = [
    { icon: Upload, text: 'Venda seus beats para artistas' },
    { icon: BarChart3, text: 'Acompanhe suas vendas e estatísticas' },
    { icon: Disc, text: 'Gerencie seu catálogo de beats' }
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff0400]/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ff0400]/5 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
          <Logo className="h-8" linkTo="/" />
          <div className="w-16"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Bem-vindo ao VibeBeats
            </h1>
            <p className="text-gray-400">
              Sua plataforma de beats profissionais
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#2a2a2a]">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-black/50 p-1 rounded-lg">
                <TabsTrigger
                  data-testid="login-tab"
                  value="login"
                  className="rounded-md data-[state=active]:bg-[#ff0400] data-[state=active]:text-white transition-all"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger
                  data-testid="register-tab"
                  value="register"
                  className="rounded-md data-[state=active]:bg-[#ff0400] data-[state=active]:text-white transition-all"
                >
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <Label htmlFor="login-email" className="text-gray-300 text-sm">
                      Email
                    </Label>
                    <Input
                      data-testid="login-email-input"
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      className="bg-black/50 border-[#2a2a2a] text-white mt-2 h-12 focus:border-[#ff0400]/50 focus:ring-[#ff0400]/20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="login-password" className="text-gray-300 text-sm">
                      Senha
                    </Label>
                    <Input
                      data-testid="login-password-input"
                      id="login-password"
                      type="password"
                      placeholder="Digite sua senha"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="bg-black/50 border-[#2a2a2a] text-white mt-2 h-12 focus:border-[#ff0400]/50 focus:ring-[#ff0400]/20"
                    />
                  </div>

                  <Button
                    data-testid="login-submit-button"
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#ff0400] hover:bg-[#ff0400]/90 text-white h-12 text-base font-semibold shadow-lg shadow-[#ff0400]/30 transition-all hover:scale-[1.02]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Entrando...
                      </span>
                    ) : (
                      'Entrar'
                    )}
                  </Button>

                  <p className="text-center text-sm text-gray-500">
                    Esqueceu a senha?{' '}
                    <button type="button" className="text-[#ff0400] hover:underline">
                      Recuperar
                    </button>
                  </p>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-5">
                  <div>
                    <Label htmlFor="register-name" className="text-gray-300 text-sm">
                      Nome / Nome Artístico
                    </Label>
                    <Input
                      data-testid="register-name-input"
                      id="register-name"
                      type="text"
                      placeholder="Seu nome"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                      className="bg-black/50 border-[#2a2a2a] text-white mt-2 h-12 focus:border-[#ff0400]/50 focus:ring-[#ff0400]/20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-email" className="text-gray-300 text-sm">
                      Email
                    </Label>
                    <Input
                      data-testid="register-email-input"
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      className="bg-black/50 border-[#2a2a2a] text-white mt-2 h-12 focus:border-[#ff0400]/50 focus:ring-[#ff0400]/20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-password" className="text-gray-300 text-sm">
                      Senha
                    </Label>
                    <Input
                      data-testid="register-password-input"
                      id="register-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      minLength={6}
                      className="bg-black/50 border-[#2a2a2a] text-white mt-2 h-12 focus:border-[#ff0400]/50 focus:ring-[#ff0400]/20"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300 text-sm mb-3 block">
                      Eu sou um...
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Artist Option */}
                      <button
                        data-testid="user-type-artist-button"
                        type="button"
                        onClick={() => setRegisterData({ ...registerData, user_type: 'artist' })}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          registerData.user_type === 'artist'
                            ? 'border-[#ff0400] bg-[#ff0400]/10'
                            : 'border-[#2a2a2a] bg-black/30 hover:border-[#3a3a3a]'
                        }`}
                      >
                        {registerData.user_type === 'artist' && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-[#ff0400] rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <Mic className={`w-8 h-8 mb-2 ${
                          registerData.user_type === 'artist' ? 'text-[#ff0400]' : 'text-gray-400'
                        }`} />
                        <p className="font-semibold text-white">Artista</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Quero comprar beats
                        </p>
                      </button>

                      {/* Producer Option */}
                      <button
                        data-testid="user-type-producer-button"
                        type="button"
                        onClick={() => setRegisterData({ ...registerData, user_type: 'producer' })}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          registerData.user_type === 'producer'
                            ? 'border-[#ff0400] bg-[#ff0400]/10'
                            : 'border-[#2a2a2a] bg-black/30 hover:border-[#3a3a3a]'
                        }`}
                      >
                        {registerData.user_type === 'producer' && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-[#ff0400] rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <Disc className={`w-8 h-8 mb-2 ${
                          registerData.user_type === 'producer' ? 'text-[#ff0400]' : 'text-gray-400'
                        }`} />
                        <p className="font-semibold text-white">Produtor</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Quero vender beats
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="bg-black/30 rounded-lg p-4 border border-[#2a2a2a]">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                      Como {registerData.user_type === 'artist' ? 'artista' : 'produtor'} você poderá:
                    </p>
                    <ul className="space-y-2">
                      {(registerData.user_type === 'artist' ? artistBenefits : producerBenefits).map((benefit, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                          <benefit.icon className="w-4 h-4 text-[#ff0400]" />
                          {benefit.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    data-testid="register-submit-button"
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#ff0400] hover:bg-[#ff0400]/90 text-white h-12 text-base font-semibold shadow-lg shadow-[#ff0400]/30 transition-all hover:scale-[1.02]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Criando conta...
                      </span>
                    ) : (
                      'Criar Conta Grátis'
                    )}
                  </Button>

                  <p className="text-center text-xs text-gray-500">
                    Ao criar uma conta, você concorda com nossos{' '}
                    <Link to="/terms" className="text-[#ff0400] hover:underline">
                      Termos de Uso
                    </Link>{' '}
                    e{' '}
                    <Link to="/privacy" className="text-[#ff0400] hover:underline">
                      Política de Privacidade
                    </Link>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          {/* Social Proof */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Junte-se a <span className="text-white font-semibold">500+</span> produtores e artistas
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center">
        <p className="text-gray-600 text-sm">
          © 2025 VibeBeats. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
};

export default Auth;

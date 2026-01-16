import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  QrCode,
  CheckCircle,
  ArrowLeft,
  ShoppingBag,
  Music,
  Shield,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { AuthContext, getCoverUrl } from '@/App';
import { cn } from '@/lib/utils';
import { createPurchase } from '@/lib/supabase';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCart();
  const { user } = useContext(AuthContext);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Cartão de Crédito',
      icon: CreditCard,
      description: 'Visa, Mastercard, Elo, Amex'
    },
    {
      id: 'pix',
      name: 'PIX',
      icon: QrCode,
      description: 'Pagamento instantâneo'
    }
  ];

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Faça login para continuar');
      navigate('/auth');
      return;
    }

    if (user.user_type !== 'artist') {
      toast.error('Apenas artistas podem comprar beats');
      return;
    }

    if (items.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    setIsProcessing(true);

    try {
      // Process each purchase using Supabase
      for (const item of items) {
        const { data, error } = await createPurchase({
          beat_id: item.id,
          buyer_id: user.id,
          producer_id: item.producer_id,
          amount: item.price,
          license_type: item.license_type || 'non_exclusive',
          payment_method: paymentMethod,
          payment_status: 'completed'
        });

        if (error) {
          throw new Error(error.message || 'Erro ao processar compra');
        }
      }

      // Success
      setOrderComplete(true);
      clearCart();
      toast.success('Compra realizada com sucesso!');
    } catch (error) {
      toast.error(error.message || 'Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="pt-24 pb-20">
          <div className="max-w-lg mx-auto px-4 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Compra Realizada!
            </h1>
            <p className="text-gray-400 mb-8">
              Seus beats já estão disponíveis. Acesse "Minhas Compras" para baixar e começar a criar.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate('/my-purchases')}
                className="bg-[#ff0400] hover:bg-[#ff0400]/90"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Minhas Compras
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="border-[#2a2a2a] text-gray-400 hover:text-white"
              >
                Continuar Explorando
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="pt-24 pb-20">
          <div className="max-w-lg mx-auto px-4 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h1 className="text-2xl font-bold text-white mb-4">
              Carrinho Vazio
            </h1>
            <p className="text-gray-400 mb-6">
              Adicione alguns beats ao carrinho para continuar.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-[#ff0400] hover:bg-[#ff0400]/90"
            >
              Explorar Beats
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#ff0400]" />
                    Resumo do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-3 rounded-lg bg-[#0a0a0a]"
                    >
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-[#2a2a2a] flex-shrink-0">
                        {item.cover_url ? (
                          <img
                            src={getCoverUrl(item.cover_url)}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{item.title}</h4>
                        <p className="text-sm text-gray-400">{item.producer_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{item.bpm} BPM</span>
                          <span className="text-xs text-gray-600">•</span>
                          <span className="text-xs text-gray-500">{item.genre}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-[#2a2a2a] text-gray-400">
                            {item.license_type === 'exclusive' ? 'Exclusivo' : 'Não-exclusivo'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[#ff0400] font-semibold">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#ff0400]" />
                    Método de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="space-y-3"
                  >
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all',
                          paymentMethod === method.id
                            ? 'border-[#ff0400] bg-[#ff0400]/5'
                            : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                        )}
                        onClick={() => setPaymentMethod(method.id)}
                      >
                        <RadioGroupItem
                          value={method.id}
                          id={method.id}
                          className="border-[#ff0400] text-[#ff0400]"
                        />
                        <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
                          <method.icon className="w-5 h-5 text-[#ff0400]" />
                        </div>
                        <div className="flex-1">
                          <Label
                            htmlFor={method.id}
                            className="text-white font-medium cursor-pointer"
                          >
                            {method.name}
                          </Label>
                          <p className="text-sm text-gray-400">{method.description}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Order Total */}
            <div className="lg:col-span-1">
              <Card className="bg-[#1a1a1a] border-[#2a2a2a] sticky top-24">
                <CardHeader>
                  <CardTitle className="text-white">Total</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
                      <span>{formatPrice(getTotal())}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Taxa de processamento</span>
                      <span className="text-green-500">Grátis</span>
                    </div>
                  </div>

                  <Separator className="bg-[#2a2a2a]" />

                  <div className="flex justify-between text-xl font-bold text-white">
                    <span>Total</span>
                    <span className="text-[#ff0400]">{formatPrice(getTotal())}</span>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full h-12 bg-[#ff0400] hover:bg-[#ff0400]/90 text-white text-lg font-semibold"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Finalizar Compra
                      </span>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Shield className="w-4 h-4" />
                    Pagamento 100% seguro
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    Ao finalizar, você concorda com nossos{' '}
                    <a href="/terms" className="text-[#ff0400] hover:underline">
                      termos de uso
                    </a>{' '}
                    e{' '}
                    <a href="/licensing" className="text-[#ff0400] hover:underline">
                      políticas de licenciamento
                    </a>
                    .
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;

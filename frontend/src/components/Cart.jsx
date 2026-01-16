import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, X, Trash2, Music, CreditCard } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { AuthContext, getFileUrl } from '@/App';

const Cart = () => {
  const { items, isOpen, closeCart, removeFromCart, clearCart, getTotal } = useCart();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-lg bg-[#0a0a0a] border-l border-[#1a1a1a]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-white">
            <ShoppingCart className="w-5 h-5 text-[#ff0400]" />
            Carrinho
            {items.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-[#ff0400] text-white">
                {items.length}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <ShoppingCart className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg">Seu carrinho está vazio</p>
            <p className="text-sm mt-2">Explore nosso catálogo de beats</p>
            <Button
              onClick={() => {
                closeCart();
                navigate('/');
              }}
              className="mt-6 bg-[#ff0400] hover:bg-[#ff0400]/90"
            >
              Explorar Beats
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[calc(100vh-280px)] mt-4 pr-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#ff0400]/30 transition-colors"
                  >
                    {/* Cover */}
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-[#2a2a2a] flex-shrink-0">
                      {item.cover_url ? (
                        <img
                          src={getFileUrl(item.cover_url)}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{item.title}</h4>
                      <p className="text-sm text-gray-400 truncate">{item.producer_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{item.bpm} BPM</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-500">{item.genre}</span>
                      </div>
                    </div>

                    {/* Price & Remove */}
                    <div className="flex flex-col items-end justify-between">
                      <span className="text-[#ff0400] font-semibold">
                        {formatPrice(item.price)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 rounded-md hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator className="my-4 bg-[#2a2a2a]" />

            <div className="space-y-4">
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total</span>
                <span className="text-2xl font-bold text-white">
                  {formatPrice(getTotal())}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                  onClick={clearCart}
                >
                  Limpar
                </Button>
                <Button
                  className="flex-1 bg-[#ff0400] hover:bg-[#ff0400]/90 text-white"
                  onClick={handleCheckout}
                  disabled={!user}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Checkout
                </Button>
              </div>

              {!user && (
                <p className="text-center text-sm text-gray-500">
                  <button
                    onClick={() => {
                      closeCart();
                      navigate('/auth');
                    }}
                    className="text-[#ff0400] hover:underline"
                  >
                    Faça login
                  </button>
                  {' '}para continuar
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default Cart;

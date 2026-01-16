import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  User,
  LogOut,
  Upload,
  Music,
  BarChart3,
  Users,
  Info,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { AuthContext, getFileUrl } from '@/App';
import Logo from '@/components/Logo';
import { cn } from '@/lib/utils';

const Header = ({ className }) => {
  const { user, logout } = useContext(AuthContext);
  const { getItemCount, openCart } = useCart();
  const { getFavoritesCount } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = getItemCount();
  const favCount = getFavoritesCount();

  const navLinks = [
    { href: '/', label: 'Beats', icon: Music },
    { href: '/charts', label: 'Charts', icon: BarChart3 },
    { href: '/artists', label: 'Produtores', icon: Users },
    { href: '/about', label: 'Sobre', icon: Info },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50',
      'bg-black/80 backdrop-blur-xl border-b border-[#1a1a1a]',
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive(link.href)
                    ? 'bg-[#ff0400]/10 text-[#ff0400]'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Favorites */}
            <Link to="/favorites">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              >
                <Heart className="w-5 h-5" />
                {favCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold bg-[#ff0400] text-white rounded-full">
                    {favCount > 9 ? '9+' : favCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              onClick={openCart}
              className="relative text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold bg-[#ff0400] text-white rounded-full">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Button>

            {/* User Menu / Auth */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={getFileUrl(user.avatar_url)} />
                      <AvatarFallback className="bg-[#ff0400] text-white text-xs">
                        {user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block max-w-[100px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-[#1a1a1a] border-[#2a2a2a]"
                >
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    <span className={cn(
                      'inline-block mt-1 px-2 py-0.5 text-xs rounded-full',
                      user.user_type === 'producer'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-blue-500/20 text-blue-400'
                    )}>
                      {user.user_type === 'producer' ? 'Produtor' : 'Artista'}
                    </span>
                  </div>
                  <DropdownMenuSeparator className="bg-[#2a2a2a]" />

                  <DropdownMenuItem
                    onClick={() => navigate('/profile')}
                    className="text-gray-300 hover:text-white hover:bg-[#2a2a2a] cursor-pointer"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Meu Perfil
                  </DropdownMenuItem>

                  {user.user_type === 'producer' && (
                    <DropdownMenuItem
                      onClick={() => navigate('/upload')}
                      className="text-gray-300 hover:text-white hover:bg-[#2a2a2a] cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Beat
                    </DropdownMenuItem>
                  )}

                  {user.user_type === 'artist' && (
                    <>
                      <DropdownMenuItem
                        onClick={() => navigate('/my-purchases')}
                        className="text-gray-300 hover:text-white hover:bg-[#2a2a2a] cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Minhas Compras
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate('/my-projects')}
                        className="text-gray-300 hover:text-white hover:bg-[#2a2a2a] cursor-pointer"
                      >
                        <Music className="w-4 h-4 mr-2" />
                        Meus Projetos
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator className="bg-[#2a2a2a]" />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth')}
                  className="text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                >
                  Entrar
                </Button>
                <Button
                  onClick={() => navigate('/auth')}
                  className="bg-[#ff0400] hover:bg-[#ff0400]/90 text-white"
                >
                  Cadastrar
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-gray-400 hover:text-white"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-[#0a0a0a] border-l border-[#1a1a1a]">
                <div className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium transition-all',
                        isActive(link.href)
                          ? 'bg-[#ff0400]/10 text-[#ff0400]'
                          : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                      )}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

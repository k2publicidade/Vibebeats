
import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Music,
  BarChart3,
  Users,
  Info,
  Menu,
  ShoppingCart,
  Heart,
  User as UserIcon,
  LogOut,
  Upload,
  ChevronDown
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { AuthContext, getFileUrl } from '@/App';
import Logo from '@/components/Logo';
import { cn } from '@/lib/utils';

const Header = () => {
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-[#1a1a1a] py-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="hidden justify-between lg:flex items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
            </div>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {navLinks.map((link) => (
                    <NavigationMenuItem key={link.href}>
                      <Link to={link.href} className={cn(
                        navigationMenuTriggerStyle(),
                        "bg-transparent text-gray-400 hover:text-white hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] focus:text-white",
                        isActive(link.href) && "text-[#ff0400] bg-[#ff0400]/10 hover:bg-[#ff0400]/20"
                      )}>
                        {link.label}
                      </Link>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

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

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] px-2"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={getFileUrl(user.avatar_url)} />
                      <AvatarFallback className="bg-[#ff0400] text-white text-xs">
                        {user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden xl:block max-w-[100px] truncate text-sm">
                      {user.name}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-[#1a1a1a] border-[#2a2a2a] text-gray-200"
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
                    <UserIcon className="w-4 h-4 mr-2" />
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
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="bg-transparent border-gray-600 text-gray-300 hover:text-white hover:bg-[#1a1a1a] hover:border-gray-400">
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button asChild size="sm" className="bg-[#ff0400] text-white hover:bg-[#ff0400]/90 border-none">
                  <Link to="/auth">Cadastrar</Link>
                </Button>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Header */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile Cart/Fav icons could go here too, but putting them in sheet or beside menu */}
              <Link to="/favorites" className="p-2 text-gray-400 hover:text-white">
                <Heart className="w-5 h-5" />
              </Link>
              <button onClick={openCart} className="p-2 text-gray-400 hover:text-white">
                <ShoppingCart className="w-5 h-5" />
              </button>

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="bg-transparent border-gray-700 text-white hover:bg-[#1a1a1a]">
                    <Menu className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="overflow-y-auto bg-[#0a0a0a] border-l border-[#1a1a1a] text-white">
                  <SheetHeader>
                    <SheetTitle>
                      <div className="flex items-center gap-2">
                        <Logo className="w-8 h-8" />
                        <span className="text-lg font-semibold text-white">VibeBeats</span>
                      </div>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="my-6 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          to={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-lg text-lg font-medium transition-colors",
                            isActive(link.href)
                              ? "text-[#ff0400] bg-[#ff0400]/10"
                              : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                          )}
                        >
                          <link.icon className="w-5 h-5" />
                          {link.label}
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-[#1a1a1a] py-4 flex flex-col gap-3">
                      {user ? (
                        <>
                          <div className="flex items-center gap-3 px-4 py-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={getFileUrl(user.avatar_url)} />
                              <AvatarFallback className="bg-[#ff0400] text-white text-xs">
                                {user.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-white">{user.name}</p>
                              <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                          </div>
                          <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white">
                            <UserIcon className="w-5 h-5" />
                            Meu Perfil
                          </Link>
                          {user.user_type === 'producer' && (
                            <Link to="/upload" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white">
                              <Upload className="w-5 h-5" />
                              Upload Beat
                            </Link>
                          )}
                          <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 w-full text-left">
                            <LogOut className="w-5 h-5" />
                            Sair
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <Button asChild variant="outline" className="w-full bg-transparent border-gray-600 text-white hover:bg-[#1a1a1a]">
                            <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Entrar</Link>
                          </Button>
                          <Button asChild className="w-full bg-[#ff0400] hover:bg-[#ff0400]/90 text-white">
                            <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Cadastrar</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

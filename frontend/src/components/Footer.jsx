import React from 'react';
import { Link } from 'react-router-dom';
import {
  Instagram,
  Twitter,
  Youtube,
  Music2,
  Mail,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Logo from '@/components/Logo';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: 'Beats', href: '/' },
    { label: 'Charts', href: '/charts' },
    { label: 'Produtores', href: '/artists' },
    { label: 'Sobre', href: '/about' },
  ];

  const legalLinks = [
    { label: 'Termos de Uso', href: '/terms' },
    { label: 'Política de Privacidade', href: '/privacy' },
    { label: 'Licenciamento', href: '/licensing' },
  ];

  const socialLinks = [
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
  ];

  return (
    <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a]">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Logo className="w-8 h-8" />
              <span className="text-xl font-bold text-white">VibeBeats</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Marketplace premium de beats musicais. Conectando produtores e artistas para criar a próxima grande música.
            </p>
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-400 hover:text-[#ff0400] hover:bg-[#ff0400]/10 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Navegação</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-[#ff0400] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-[#ff0400] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-4">Newsletter</h4>
            <p className="text-gray-400 text-sm mb-4">
              Receba novos beats e ofertas exclusivas.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Seu email"
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#ff0400]"
              />
              <Button
                type="submit"
                className="bg-[#ff0400] hover:bg-[#ff0400]/90 text-white px-4"
              >
                <Mail className="w-4 h-4" />
              </Button>
            </form>
            <div className="mt-6 flex items-start gap-2 text-sm text-gray-500">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>São Paulo, Brasil</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {currentYear} VibeBeats. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Music2 className="w-4 h-4 text-[#ff0400]" />
              <span>Feito com amor para a comunidade musical</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

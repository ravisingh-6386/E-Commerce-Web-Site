import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone } from 'lucide-react';

const LINKS = {
  Shop: [
    { label: 'Car Parts', to: '/products?category=car-parts' },
    { label: 'Bike Parts', to: '/products?category=bike-parts' },
    { label: 'Superbike Parts', to: '/products?category=superbike-parts' },
    { label: 'Engine Parts', to: '/products?category=engine-parts' },
    { label: 'Accessories', to: '/products?category=accessories' },
  ],
  Account: [
    { label: 'My Profile', to: '/profile' },
    { label: 'My Orders', to: '/orders' },
    { label: 'Wishlist', to: '/wishlist' },
    { label: 'Messages', to: '/messages' },
    { label: 'Seller Dashboard', to: '/seller/dashboard' },
  ],
  Support: [
    { label: 'Help Center', to: '#' },
    { label: 'Return Policy', to: '#' },
    { label: 'Shipping Info', to: '#' },
    { label: 'Contact Us', to: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-dark-950 text-gray-300 mt-16">
      <div className="container-app py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MP</span>
              </div>
              <span className="text-xl font-bold text-white">
                Moto<span className="text-primary-500">Parts</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Your one-stop marketplace for car, bike, and superbike parts. Buy and sell with confidence.
            </p>
            <div className="flex gap-3">
              {[
                { icon: <Facebook size={18} />, href: '#' },
                { icon: <Twitter size={18} />, href: '#' },
                { icon: <Instagram size={18} />, href: '#' },
                { icon: <Youtube size={18} />, href: '#' },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link groups */}
          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <h3 className="text-white font-semibold mb-4">{title}</h3>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact + copyright */}
        <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <Mail size={14} /> ravisingh223605@gmail.com
            </span>
            <span className="flex items-center gap-2">
              <Phone size={14} /> 9555131042
            </span>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} MotoParts. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

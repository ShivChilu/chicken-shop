import React from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Phone, MapPin, Clock, Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-butcher-red rounded-sm flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">
                Fresh Meat Hub
              </span>
            </Link>
            <p className="text-sm text-stone-400 leading-relaxed">
              Your trusted destination for fresh, premium quality meat delivered right to your doorstep. Quality you can taste, freshness you can trust.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-bold text-white mb-4">Shop</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products?category=Chicken" className="text-sm hover:text-butcher-red transition-colors">
                  Chicken
                </Link>
              </li>
              <li>
                <Link to="/products?category=Mutton" className="text-sm hover:text-butcher-red transition-colors">
                  Mutton
                </Link>
              </li>
              <li>
                <Link to="/products?category=Others" className="text-sm hover:text-butcher-red transition-colors">
                  Seafood & Others
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-sm hover:text-butcher-red transition-colors">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-bold text-white mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 text-butcher-red" />
                <span className="text-sm">+91 99999 99999</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 text-butcher-red" />
                <span className="text-sm">order@freshmeathub.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-butcher-red" />
                <span className="text-sm">Hyderabad, Telangana</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-display text-lg font-bold text-white mb-4">Hours</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-butcher-red" />
                <span className="text-sm">Mon - Sat: 7AM - 9PM</span>
              </li>
              <li className="pl-7">
                <span className="text-sm">Sunday: 8AM - 6PM</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-stone-800 rounded-sm">
              <p className="text-xs text-stone-400">
                <span className="text-butcher-red font-medium">Cash on Delivery</span> available in serviceable areas
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-stone-500">
            © {new Date().getFullYear()} Fresh Meat Hub. All rights reserved.
          </p>
          <p className="text-sm text-stone-500">
            Made with freshness in mind
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

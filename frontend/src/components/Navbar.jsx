import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, ChefHat } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';

export const Navbar = () => {
  const { itemCount, items, total } = useCart();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'All Products' },
    { to: '/products?category=Chicken', label: 'Chicken' },
    { to: '/products?category=Mutton', label: 'Mutton' },
    { to: '/products?category=Others', label: 'Others' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname + location.search === path;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" data-testid="logo-link">
            <div className="w-10 h-10 bg-butcher-red rounded-sm flex items-center justify-center group-hover:bg-butcher-red-dark transition-colors">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-stone-900 hidden sm:block">
              Fresh Meat Hub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-butcher-red text-white'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
                data-testid={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Cart & Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* Cart Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative border-stone-300 hover:bg-stone-100"
                  data-testid="cart-button"
                >
                  <ShoppingCart className="h-5 w-5 text-stone-700" />
                  {itemCount > 0 && (
                    <Badge
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-butcher-red text-white text-xs"
                      data-testid="cart-count"
                    >
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle className="font-display text-xl">Your Cart</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col h-[calc(100vh-180px)]">
                  {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-500">
                      <ShoppingCart className="w-16 h-16 mb-4 text-stone-300" />
                      <p className="text-lg font-medium">Your cart is empty</p>
                      <p className="text-sm mt-1">Add some fresh meat to get started!</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto space-y-4">
                        {items.map((item) => (
                          <CartItem key={item.product_id} item={item} />
                        ))}
                      </div>
                      <div className="border-t border-stone-200 pt-4 mt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-medium text-stone-700">Total</span>
                          <span className="font-display text-2xl font-bold text-stone-900">
                            ₹{total.toFixed(2)}
                          </span>
                        </div>
                        <Link to="/checkout" className="block">
                          <Button
                            className="w-full bg-butcher-red hover:bg-butcher-red-dark text-white font-bold uppercase tracking-wide"
                            data-testid="checkout-button"
                          >
                            Proceed to Checkout
                          </Button>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Mobile Menu Toggle */}
            <Button
              variant="outline"
              size="icon"
              className="md:hidden border-stone-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-stone-700" />
              ) : (
                <Menu className="h-5 w-5 text-stone-700" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-stone-200">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-sm text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-butcher-red text-white'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                  data-testid={`mobile-nav-${link.label.toLowerCase().replace(' ', '-')}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex gap-4 p-3 bg-stone-50 rounded-sm" data-testid={`cart-item-${item.product_id}`}>
      <img
        src={item.image || 'https://images.pexels.com/photos/618773/pexels-photo-618773.jpeg'}
        alt={item.name}
        className="w-20 h-20 object-cover rounded-sm"
      />
      <div className="flex-1">
        <h4 className="font-medium text-stone-900">{item.name}</h4>
        <p className="text-sm text-stone-500">{item.unit}</p>
        <p className="font-bold text-butcher-red mt-1">₹{item.price}</p>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
            data-testid={`decrease-qty-${item.product_id}`}
          >
            -
          </Button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
            data-testid={`increase-qty-${item.product_id}`}
          >
            +
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
            onClick={() => removeFromCart(item.product_id)}
            data-testid={`remove-item-${item.product_id}`}
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

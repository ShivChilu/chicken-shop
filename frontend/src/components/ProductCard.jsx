import React from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';

export const ProductCard = ({ product }) => {
  const { addToCart, items } = useCart();
  const inCart = items.some(item => item.product_id === product.id);

  const handleAddToCart = () => {
    if (product.in_stock) {
      addToCart(product);
    }
  };

  return (
    <Card
      className="group bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-butcher-red-light hover:shadow-md transition-all duration-300"
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative img-zoom aspect-square">
        <img
          src={product.image || 'https://images.pexels.com/photos/618773/pexels-photo-618773.jpeg'}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {!product.in_stock && (
          <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
            <Badge
              variant="destructive"
              className="text-sm font-bold uppercase tracking-wider animate-pulse-stock"
            >
              Out of Stock
            </Badge>
          </div>
        )}
        {product.in_stock && (
          <Badge
            className="absolute top-3 left-3 bg-green-500 text-white text-xs font-medium"
          >
            In Stock
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <div className="mb-2">
          <Badge variant="secondary" className="text-xs bg-stone-100 text-stone-600">
            {product.category}
          </Badge>
        </div>
        <h3 className="font-display text-lg font-bold text-stone-900 mb-1 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm text-stone-500 mb-3 line-clamp-2">
          {product.description || 'Fresh and premium quality meat'}
        </p>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-display text-2xl font-bold text-butcher-red">
              ₹{product.price}
            </span>
            <span className="text-sm text-stone-500 ml-1">/{product.unit}</span>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={!product.in_stock}
            className={`${
              inCart
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-butcher-red hover:bg-butcher-red-dark'
            } text-white rounded-sm transition-colors`}
            data-testid={`add-to-cart-${product.id}`}
          >
            {inCart ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Added
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;

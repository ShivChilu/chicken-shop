import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Clock, ChefHat } from 'lucide-react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { ProductCard } from '../components/ProductCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Initialize data first
        await axios.post(`${API}/init-data`);
        
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get(`${API}/products`),
          axios.get(`${API}/categories`)
        ]);
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const featuredProducts = products.slice(0, 4);

  const features = [
    {
      icon: <Truck className="w-8 h-8" />,
      title: 'Free Delivery',
      description: 'Free delivery on orders above ₹500 in serviceable areas'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: '100% Fresh',
      description: 'Quality assured fresh meat delivered to your doorstep'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Same Day Delivery',
      description: 'Order before 2 PM for same day delivery'
    },
    {
      icon: <ChefHat className="w-8 h-8" />,
      title: 'Expert Cut',
      description: 'Professional butchers ensuring perfect cuts every time'
    }
  ];

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1615937662601-4724eceda00f?w=1600"
            alt="Professional butcher cutting fresh meat"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900/90 via-stone-900/70 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-xl">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Fresh Meat,<br />
              <span className="text-butcher-red">Delivered Fresh</span>
            </h1>
            <p className="text-lg text-stone-300 mb-8 leading-relaxed">
              Premium quality chicken, mutton, and seafood delivered right to your doorstep. 
              Freshness guaranteed with every order.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/products">
                <Button
                  size="lg"
                  className="bg-butcher-red hover:bg-butcher-red-dark text-white font-bold uppercase tracking-wide px-8 py-6 text-base rounded-sm"
                  data-testid="shop-now-btn"
                >
                  Shop Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/products?category=Chicken">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-stone-900 font-medium px-8 py-6 text-base rounded-sm bg-transparent"
                  data-testid="view-chicken-btn"
                >
                  View Chicken
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-sm hover:bg-stone-50 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-butcher-red-light text-butcher-red rounded-sm mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-display text-lg font-bold text-stone-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-stone-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Browse our carefully curated selection of premium meats
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.name}`}
                className="group relative aspect-square rounded-sm overflow-hidden"
                data-testid={`category-${category.name.toLowerCase()}`}
              >
                <img
                  src={category.image || 'https://images.pexels.com/photos/618773/pexels-photo-618773.jpeg'}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-display text-2xl font-bold text-white mb-2">
                    {category.name}
                  </h3>
                  <span className="inline-flex items-center text-sm text-white/80 group-hover:text-butcher-red transition-colors">
                    Shop Now
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 mb-2">
                Featured Products
              </h2>
              <p className="text-stone-600">
                Our most popular items, hand-picked for you
              </p>
            </div>
            <Link to="/products">
              <Button
                variant="outline"
                className="border-butcher-red text-butcher-red hover:bg-butcher-red hover:text-white rounded-sm"
                data-testid="view-all-products"
              >
                View All Products
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-stone-100 aspect-square rounded-sm animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-butcher-red">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Order?
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8">
            Experience the freshness of premium quality meat. Order now and get it delivered to your doorstep.
          </p>
          <Link to="/products">
            <Button
              size="lg"
              className="bg-white text-butcher-red hover:bg-stone-100 font-bold uppercase tracking-wide px-8 py-6 text-base rounded-sm"
              data-testid="order-now-btn"
            >
              Order Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;

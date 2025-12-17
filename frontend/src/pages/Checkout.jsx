import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag, MapPin, Phone, User, CheckCircle, AlertCircle, Truck, Navigation, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pincodeValid, setPincodeValid] = useState(null);
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const pincodeTimeoutRef = useRef(null);

  // Location state
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    status: 'idle', // idle, loading, granted, denied, unavailable
    error: null
  });

  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    address: '',
    pincode: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (items.length === 0) {
      navigate('/products');
    }
  }, [items, navigate]);

  // Request geolocation on component mount
  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        status: 'unavailable',
        error: 'Geolocation is not supported by your browser'
      }));
      return;
    }

    setLocation(prev => ({ ...prev, status: 'loading' }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          status: 'granted',
          error: null
        });
        toast.success('Location captured for faster delivery!');
      },
      (error) => {
        let errorMessage = 'Unable to get location';
        let status = 'denied';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            status = 'denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            status = 'unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            status = 'unavailable';
            break;
          default:
            errorMessage = 'An unknown error occurred';
            status = 'unavailable';
        }
        
        setLocation({
          latitude: null,
          longitude: null,
          status,
          error: errorMessage
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      }
    );
  };

  const validatePincode = async (code) => {
    if (code.length !== 6) {
      setPincodeValid(null);
      return;
    }

    setPincodeChecking(true);
    try {
      const response = await axios.get(`${API}/pincodes/verify/${code}`);
      setPincodeValid(response.data.valid);
    } catch (error) {
      setPincodeValid(false);
    } finally {
      setPincodeChecking(false);
    }
  };

  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, pincode: value }));
    
    // Clear previous timeout
    if (pincodeTimeoutRef.current) {
      clearTimeout(pincodeTimeoutRef.current);
    }
    
    // Debounce pincode validation
    pincodeTimeoutRef.current = setTimeout(() => {
      validatePincode(value);
    }, 500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Please enter a complete address';
    }

    if (!formData.pincode) {
      newErrors.pincode = 'Pincode is required';
    } else if (formData.pincode.length !== 6) {
      newErrors.pincode = 'Enter a valid 6-digit pincode';
    } else if (pincodeValid === false) {
      newErrors.pincode = 'We do not deliver to this pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (pincodeValid === false) {
      toast.error('We do not deliver to this pincode');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        ...formData,
        items: items.map(item => ({
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit
        })),
        total,
        // Include location if available
        latitude: location.latitude,
        longitude: location.longitude
      };

      await axios.post(`${API}/orders`, orderData);
      
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/order-success');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8" data-testid="checkout-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <User className="w-5 h-5 text-butcher-red" />
                  Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="customer_name" className="text-stone-700">
                      Full Name *
                    </Label>
                    <Input
                      id="customer_name"
                      name="customer_name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.customer_name}
                      onChange={handleChange}
                      className={`bg-white ${errors.customer_name ? 'border-red-500' : 'border-stone-200'}`}
                      data-testid="input-name"
                    />
                    {errors.customer_name && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.customer_name}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-stone-700">
                      Phone Number *
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData(prev => ({ ...prev, phone: value }));
                        }}
                        className={`pl-10 bg-white ${errors.phone ? 'border-red-500' : 'border-stone-200'}`}
                        data-testid="input-phone"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-stone-700">
                      Delivery Address *
                    </Label>
                    <Textarea
                      id="address"
                      name="address"
                      placeholder="Enter your complete address with landmarks"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className={`bg-white ${errors.address ? 'border-red-500' : 'border-stone-200'}`}
                      data-testid="input-address"
                    />
                    {errors.address && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.address}
                      </p>
                    )}
                  </div>

                  {/* Pincode */}
                  <div className="space-y-2">
                    <Label htmlFor="pincode" className="text-stone-700">
                      Pincode *
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <Input
                        id="pincode"
                        name="pincode"
                        type="text"
                        placeholder="6-digit pincode"
                        value={formData.pincode}
                        onChange={handlePincodeChange}
                        className={`pl-10 pr-10 bg-white ${
                          errors.pincode
                            ? 'border-red-500'
                            : pincodeValid === true
                            ? 'border-green-500'
                            : pincodeValid === false
                            ? 'border-red-500'
                            : 'border-stone-200'
                        }`}
                        data-testid="input-pincode"
                      />
                      {pincodeChecking && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-5 h-5 border-2 border-stone-300 border-t-butcher-red rounded-full animate-spin" />
                        </div>
                      )}
                      {!pincodeChecking && pincodeValid === true && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                      )}
                      {!pincodeChecking && pincodeValid === false && (
                        <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                      )}
                    </div>
                    {pincodeValid === true && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        We deliver to this pincode!
                      </p>
                    )}
                    {pincodeValid === false && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Sorry, we don't deliver to this pincode yet
                      </p>
                    )}
                    {errors.pincode && !pincodeValid && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.pincode}
                      </p>
                    )}
                  </div>

                  {/* Location Status */}
                  <div className={`p-4 rounded-sm border ${
                    location.status === 'granted' 
                      ? 'bg-green-50 border-green-200' 
                      : location.status === 'denied' || location.status === 'unavailable'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-stone-50 border-stone-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${
                        location.status === 'granted'
                          ? 'bg-green-100'
                          : location.status === 'loading'
                          ? 'bg-blue-100'
                          : 'bg-yellow-100'
                      }`}>
                        {location.status === 'loading' ? (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        ) : location.status === 'granted' ? (
                          <Navigation className="w-5 h-5 text-green-600" />
                        ) : (
                          <MapPin className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        {location.status === 'loading' && (
                          <>
                            <p className="font-medium text-stone-900">Getting your location...</p>
                            <p className="text-sm text-stone-500">Please allow location access for faster delivery</p>
                          </>
                        )}
                        {location.status === 'granted' && (
                          <>
                            <p className="font-medium text-green-700">Location captured!</p>
                            <p className="text-sm text-green-600">Your exact location will help us deliver faster</p>
                          </>
                        )}
                        {(location.status === 'denied' || location.status === 'unavailable') && (
                          <>
                            <p className="font-medium text-yellow-700">Location not available</p>
                            <p className="text-sm text-yellow-600">
                              {location.error || 'We\'ll use your address for delivery'}
                            </p>
                          </>
                        )}
                        {location.status === 'idle' && (
                          <>
                            <p className="font-medium text-stone-900">Share your location</p>
                            <p className="text-sm text-stone-500">Helps us deliver to you faster</p>
                          </>
                        )}
                      </div>
                      {(location.status === 'denied' || location.status === 'unavailable' || location.status === 'idle') && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={requestLocation}
                          className="shrink-0"
                        >
                          <Navigation className="w-4 h-4 mr-1" />
                          {location.status === 'idle' ? 'Share' : 'Retry'}
                        </Button>
                      )}
                      {location.status === 'granted' && (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Captured
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Payment Mode */}
                  <div className="p-4 bg-stone-50 rounded-sm border border-stone-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-butcher-red-light rounded-sm flex items-center justify-center">
                        <Truck className="w-5 h-5 text-butcher-red" />
                      </div>
                      <div>
                        <p className="font-medium text-stone-900">Cash on Delivery</p>
                        <p className="text-sm text-stone-500">Pay when your order arrives</p>
                      </div>
                      <Badge className="ml-auto bg-green-100 text-green-700">Selected</Badge>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading || pincodeChecking}
                    className="w-full bg-butcher-red hover:bg-butcher-red-dark text-white font-bold uppercase tracking-wide py-6 text-base rounded-sm"
                    data-testid="place-order-btn"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Placing Order...
                      </div>
                    ) : (
                      <>
                        Place Order - ₹{total.toFixed(2)}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="border-stone-200 sticky top-24">
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-butcher-red" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex gap-3 pb-4 border-b border-stone-100 last:border-0"
                    >
                      <img
                        src={item.image || 'https://images.pexels.com/photos/618773/pexels-photo-618773.jpeg'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-stone-900 text-sm truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs text-stone-500">
                          {item.unit} × {item.quantity}
                        </p>
                        <p className="font-bold text-butcher-red mt-1">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-stone-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Subtotal</span>
                      <span className="text-stone-900">₹{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Delivery</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-stone-200">
                      <span className="font-medium text-stone-900">Total</span>
                      <span className="font-display text-2xl font-bold text-butcher-red">
                        ₹{total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

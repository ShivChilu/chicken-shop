import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Phone } from 'lucide-react';
import { Button } from '../components/ui/button';

const OrderSuccess = () => {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4" data-testid="order-success-page">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="font-display text-3xl font-bold text-stone-900 mb-4">
            Order Placed Successfully!
          </h1>
          <p className="text-stone-600 leading-relaxed">
            Thank you for your order. We've received it and will start preparing your fresh meat right away.
          </p>
        </div>

        <div className="bg-white rounded-sm border border-stone-200 p-6 mb-8">
          <h3 className="font-display text-lg font-bold text-stone-900 mb-4">
            What's Next?
          </h3>
          <ul className="text-left space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-butcher-red-light rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-butcher-red">1</span>
              </div>
              <p className="text-sm text-stone-600">
                Our team will confirm your order via phone call or WhatsApp
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-butcher-red-light rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-butcher-red">2</span>
              </div>
              <p className="text-sm text-stone-600">
                Fresh meat will be prepared and packed for delivery
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-butcher-red-light rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-butcher-red">3</span>
              </div>
              <p className="text-sm text-stone-600">
                Your order will be delivered to your doorstep
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-butcher-red-light rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-butcher-red">4</span>
              </div>
              <p className="text-sm text-stone-600">
                Pay cash on delivery and enjoy your fresh meat!
              </p>
            </li>
          </ul>
        </div>

        <div className="bg-stone-100 rounded-sm p-4 mb-8">
          <div className="flex items-center justify-center gap-2 text-stone-700">
            <Phone className="w-5 h-5" />
            <span className="font-medium">Need help? Call us at +91 99999 99999</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/products" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-butcher-red text-butcher-red hover:bg-butcher-red hover:text-white rounded-sm"
            >
              Continue Shopping
            </Button>
          </Link>
          <Link to="/" className="flex-1">
            <Button
              className="w-full bg-butcher-red hover:bg-butcher-red-dark text-white rounded-sm"
            >
              Back to Home
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;

import React from "react";
import "@/App.css";
import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Toaster } from "./components/ui/sonner";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Admin from "./pages/Admin";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <div className="App min-h-screen flex flex-col">
          <Routes>
            {/* Admin Route - No Navbar/Footer */}
            <Route path="/admin" element={<Admin />} />
            
            {/* Customer Routes - With Navbar/Footer */}
            <Route
              path="*"
              element={
                <>
                  <Navbar />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/order-success" element={<OrderSuccess />} />
                    </Routes>
                  </main>
                  <Footer />
                </>
              }
            />
          </Routes>
          <Toaster position="top-right" richColors />
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;

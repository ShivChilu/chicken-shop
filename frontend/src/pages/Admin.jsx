import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  Package,
  ShoppingCart,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Bell,
  Search,
  Filter,
  ChevronDown,
  Upload,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { toast } from 'sonner';
import { format } from 'date-fns';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Admin = () => {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [loading, setLoading] = useState(false);

  // Data states
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pincodes, setPincodes] = useState([]);
  
  // Filter states
  const [orderDateFilter, setOrderDateFilter] = useState(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');

  // Modal states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [pincodeModalOpen, setPincodeModalOpen] = useState(false);
  const [newPincode, setNewPincode] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Socket connection
  useEffect(() => {
    if (!authenticated) return;

    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('orderPlaced', (order) => {
      setOrders(prev => [order, ...prev]);
      setNotifications(prev => [{
        id: Date.now(),
        message: `New order from ${order.customer_name}`,
        time: new Date()
      }, ...prev]);
      toast.success(`New order received from ${order.customer_name}!`);
    });

    socket.on('orderStatusUpdated', ({ order_id, status }) => {
      setOrders(prev => prev.map(o =>
        o.id === order_id ? { ...o, status } : o
      ));
    });

    return () => socket.disconnect();
  }, [authenticated]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [productsRes, ordersRes, categoriesRes, pincodesRes] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/orders`),
        axios.get(`${API}/categories`),
        axios.get(`${API}/pincodes`)
      ]);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
      setCategories(categoriesRes.data);
      setPincodes(pincodesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchData();
    }
  }, [authenticated, fetchData]);

  // PIN verification
  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinError('');
    setLoading(true);

    try {
      await axios.post(`${API}/admin/verify`, { pin });
      setAuthenticated(true);
      toast.success('Welcome to Admin Dashboard');
    } catch (error) {
      setPinError('Invalid PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setPin('');
  };

  // Filtered data
  const filteredOrders = useMemo(() => {
    let result = [...orders];
    
    if (orderDateFilter) {
      const dateStr = format(orderDateFilter, 'yyyy-MM-dd');
      result = result.filter(o => o.created_at.startsWith(dateStr));
    }
    
    if (orderStatusFilter !== 'all') {
      result = result.filter(o => o.status === orderStatusFilter);
    }
    
    return result;
  }, [orders, orderDateFilter, orderStatusFilter]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    if (productSearch) {
      const query = productSearch.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    if (productCategoryFilter !== 'all') {
      result = result.filter(p => p.category === productCategoryFilter);
    }
    
    return result;
  }, [products, productSearch, productCategoryFilter]);

  // Product CRUD
  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, productData);
        toast.success('Product updated successfully');
      } else {
        await axios.post(`${API}/products`, productData);
        toast.success('Product added successfully');
      }
      fetchData();
      setProductModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await axios.delete(`${API}/products/${productId}`);
      toast.success('Product deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  // Order status update
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status`, { status });
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Pincode CRUD
  const handleAddPincode = async () => {
    if (!newPincode || newPincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }
    
    try {
      await axios.post(`${API}/pincodes`, { code: newPincode });
      toast.success('Pincode added');
      fetchData();
      setNewPincode('');
      setPincodeModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add pincode');
    }
  };

  const handleDeletePincode = async (pincodeId) => {
    try {
      await axios.delete(`${API}/pincodes/${pincodeId}`);
      toast.success('Pincode removed');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove pincode');
    }
  };

  // PIN Entry Screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4" data-testid="admin-pin-page">
        <Card className="w-full max-w-md bg-stone-800 border-stone-700">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl text-white">Admin Access</CardTitle>
            <p className="text-stone-400 text-sm mt-2">Enter your 4-digit PIN to continue</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div className="space-y-2">
                <Input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="text-center text-3xl tracking-[1em] bg-stone-700 border-stone-600 text-white h-16"
                  data-testid="admin-pin-input"
                />
                {pinError && (
                  <p className="text-sm text-red-400 flex items-center justify-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {pinError}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={pin.length !== 4 || loading}
                className="w-full bg-butcher-red hover:bg-butcher-red-dark text-white font-bold uppercase tracking-wide py-6"
                data-testid="admin-login-btn"
              >
                {loading ? 'Verifying...' : 'Enter Dashboard'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-stone-100" data-testid="admin-dashboard">
      {/* Header */}
      <header className="bg-stone-900 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="font-display text-xl font-bold">Fresh Meat Hub - Admin</h1>
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-white hover:bg-stone-800">
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-butcher-red rounded-full text-xs flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <h4 className="font-medium mb-2">Notifications</h4>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-stone-500">No new notifications</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-2 bg-stone-50 rounded-sm text-sm">
                          {n.message}
                        </div>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-white hover:bg-stone-800"
                data-testid="admin-logout-btn"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-sm flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-stone-500">Total Products</p>
                  <p className="font-display text-2xl font-bold text-stone-900">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-sm flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-stone-500">Total Orders</p>
                  <p className="font-display text-2xl font-bold text-stone-900">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-sm flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-stone-500">Pending Orders</p>
                  <p className="font-display text-2xl font-bold text-stone-900">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-sm flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-stone-500">Serviceable Areas</p>
                  <p className="font-display text-2xl font-bold text-stone-900">{pincodes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-white border border-stone-200">
            <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
            <TabsTrigger value="pincodes" data-testid="tab-pincodes">Pincodes</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="font-display text-xl">Orders Management</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-white">
                          <Filter className="w-4 h-4 mr-2" />
                          {orderDateFilter ? format(orderDateFilter, 'MMM dd, yyyy') : 'Filter by Date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={orderDateFilter}
                          onSelect={setOrderDateFilter}
                          initialFocus
                        />
                        {orderDateFilter && (
                          <div className="p-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setOrderDateFilter(null)}
                              className="w-full"
                            >
                              Clear Date
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                      <SelectTrigger className="w-[140px] bg-white">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="packed">Packed</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12 text-stone-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-stone-300" />
                    <p>No orders found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-xs">
                              {order.id.slice(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{order.customer_name}</p>
                                <p className="text-xs text-stone-500">{order.phone}</p>
                                <p className="text-xs text-stone-500">{order.pincode}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {order.items.map((item, i) => (
                                  <p key={i}>{item.name} × {item.quantity}</p>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-butcher-red">
                              ₹{order.total}
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(order.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <OrderStatusBadge status={order.status} />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={order.status}
                                onValueChange={(status) => handleUpdateOrderStatus(order.id, status)}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="packed">Packed</SelectItem>
                                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="font-display text-xl">Products Management</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-9 w-[200px] bg-white"
                      />
                    </div>
                    <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                      <SelectTrigger className="w-[140px] bg-white">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="bg-butcher-red hover:bg-butcher-red-dark text-white"
                          onClick={() => setEditingProduct(null)}
                          data-testid="add-product-btn"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Product
                        </Button>
                      </DialogTrigger>
                      <ProductModal
                        product={editingProduct}
                        categories={categories}
                        onSave={handleSaveProduct}
                        onClose={() => {
                          setProductModalOpen(false);
                          setEditingProduct(null);
                        }}
                      />
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-stone-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-stone-300" />
                    <p>No products found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white border border-stone-200 rounded-sm p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex gap-4">
                          <img
                            src={product.image || 'https://images.pexels.com/photos/618773/pexels-photo-618773.jpeg'}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-medium text-stone-900 truncate">{product.name}</h4>
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {product.category}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setProductModalOpen(true);
                                  }}
                                  data-testid={`edit-product-${product.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  data-testid={`delete-product-${product.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="font-bold text-butcher-red mt-2">
                              ₹{product.price}/{product.unit}
                            </p>
                            <Badge
                              className={`mt-2 ${
                                product.in_stock
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {product.in_stock ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pincodes Tab */}
          <TabsContent value="pincodes">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="font-display text-xl">Serviceable Pincodes</CardTitle>
                  <Dialog open={pincodeModalOpen} onOpenChange={setPincodeModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-butcher-red hover:bg-butcher-red-dark text-white"
                        data-testid="add-pincode-btn"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Pincode
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Serviceable Pincode</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Pincode</Label>
                          <Input
                            type="text"
                            placeholder="Enter 6-digit pincode"
                            value={newPincode}
                            onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            data-testid="new-pincode-input"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                          onClick={handleAddPincode}
                          className="bg-butcher-red hover:bg-butcher-red-dark text-white"
                          data-testid="save-pincode-btn"
                        >
                          Add Pincode
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {pincodes.map((pincode) => (
                    <div
                      key={pincode.id}
                      className="bg-white border border-stone-200 rounded-sm p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-butcher-red" />
                        <span className="font-mono font-medium">{pincode.code}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeletePincode(pincode.id)}
                        data-testid={`delete-pincode-${pincode.code}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Order Status Badge Component
const OrderStatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed' },
    packed: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Packed' },
    out_for_delivery: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Out for Delivery' },
    completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge className={`${config.bg} ${config.text}`}>
      {config.label}
    </Badge>
  );
};

// Product Modal Component
const ProductModal = ({ product, categories, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price || '',
    category: product?.category || (categories[0]?.name || ''),
    description: product?.description || '',
    unit: product?.unit || '500g',
    in_stock: product?.in_stock ?? true,
    image: product?.image || ''
  });
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await axios.post(`${API}/upload`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({
        ...prev,
        image: `${process.env.REACT_APP_BACKEND_URL}${response.data.url}`
      }));
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Please fill all required fields');
      return;
    }
    onSave({
      ...formData,
      price: parseFloat(formData.price)
    });
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Product Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Chicken Breast"
            data-testid="product-name-input"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Price (₹) *</Label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="250"
              data-testid="product-price-input"
            />
          </div>
          <div className="space-y-2">
            <Label>Unit</Label>
            <Select
              value={formData.unit}
              onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
            >
              <SelectTrigger data-testid="product-unit-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="250g">250g</SelectItem>
                <SelectItem value="500g">500g</SelectItem>
                <SelectItem value="1kg">1kg</SelectItem>
                <SelectItem value="1 pc">1 pc</SelectItem>
                <SelectItem value="6 pcs">6 pcs</SelectItem>
                <SelectItem value="12 pcs">12 pcs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger data-testid="product-category-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Fresh and premium quality..."
            rows={2}
            data-testid="product-description-input"
          />
        </div>

        <div className="space-y-2">
          <Label>Product Image</Label>
          <div className="flex items-center gap-4">
            {formData.image && (
              <img
                src={formData.image}
                alt="Product"
                className="w-16 h-16 object-cover rounded-sm"
              />
            )}
            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="cursor-pointer"
                data-testid="product-image-input"
              />
              {uploading && <p className="text-xs text-stone-500 mt-1">Uploading...</p>}
            </div>
          </div>
          <p className="text-xs text-stone-500">Or enter image URL:</p>
          <Input
            value={formData.image}
            onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
            placeholder="https://..."
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <Label>In Stock</Label>
          <Switch
            checked={formData.in_stock}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, in_stock: checked }))}
            data-testid="product-stock-toggle"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-butcher-red hover:bg-butcher-red-dark text-white"
            data-testid="save-product-btn"
          >
            {product ? 'Update Product' : 'Add Product'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default Admin;

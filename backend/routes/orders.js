import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { Order } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Store Socket.IO instance
let io = null;
export const setSocketIO = (socketIO) => {
  io = socketIO;
};

// Helper: Send WhatsApp notification
const sendWhatsAppNotification = async (order) => {
  const phone = process.env.WHATSAPP_PHONE || '+919999999999';
  const apiKey = process.env.WHATSAPP_API_KEY || 'API_KEY_HERE';
  
  const itemsText = order.items
    .map(item => `• ${item.name} x ${item.quantity} (${item.unit}) - ₹${item.price * item.quantity}`)
    .join('\n');
  
  const message = `🛒 NEW ORDER RECEIVED!

👤 Customer: ${order.customer_name}
📞 Phone: ${order.phone}
📍 Address: ${order.address}
📮 Pincode: ${order.pincode}

📦 Items:
${itemsText}

💰 Total: ₹${order.total}
💳 Payment: ${order.payment_mode}

Order ID: ${order.id}`;
  
  try {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedMessage}&apikey=${apiKey}`;
    
    await axios.get(url, { timeout: 10000 });
    console.log(`WhatsApp notification sent for order ${order.id}`);
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error.message);
  }
};

// Helper: Log order to file
const logOrderToFile = async (order) => {
  const logsDir = path.join(__dirname, '..', 'logs');
  const logFile = path.join(logsDir, 'orders.txt');
  
  // Ensure logs directory exists
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  const itemsText = order.items.map(item => `${item.name} x ${item.quantity}`).join(', ');
  const logEntry = `
================================================================================
Order ID: ${order.id}
Date: ${order.created_at}
Customer: ${order.customer_name}
Phone: ${order.phone}
Address: ${order.address}, Pincode: ${order.pincode}
Items: ${itemsText}
Total: ₹${order.total}
Payment: ${order.payment_mode}
Status: ${order.status}
================================================================================
`;
  
  fs.appendFileSync(logFile, logEntry);
};

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { date, status } = req.query;
    const query = {};
    
    if (date) {
      query.created_at = { $regex: `^${date}` };
    }
    if (status) {
      query.status = status;
    }
    
    const orders = await Order.find(query).sort({ created_at: -1 }).lean();
    const result = orders.map(order => {
      const { _id, ...rest } = order;
      return rest;
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Create order
router.post('/', async (req, res) => {
  try {
    const { customer_name, phone, address, pincode, items, total } = req.body;
    
    if (!customer_name || !phone || !address || !pincode || !items || total === undefined) {
      return res.status(400).json({ detail: 'All fields are required' });
    }
    
    const order = new Order({
      customer_name,
      phone,
      address,
      pincode,
      items,
      total
    });
    
    await order.save();
    const orderData = order.toJSON();
    
    // Log order to file
    await logOrderToFile(orderData);
    
    // Send WhatsApp notification
    await sendWhatsAppNotification(orderData);
    
    // Emit socket event for real-time notification
    if (io) {
      io.emit('orderPlaced', orderData);
    }
    
    res.status(201).json(orderData);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Update order status
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ detail: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    
    const result = await Order.updateOne({ id: orderId }, { $set: { status } });
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ detail: 'Order not found' });
    }
    
    // Emit socket event for status update
    if (io) {
      io.emit('orderStatusUpdated', { order_id: orderId, status });
    }
    
    res.json({ success: true, status });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;

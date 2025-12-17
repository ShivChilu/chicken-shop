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

// Helper: Send Email notification to admin
const sendEmailNotification = async (order) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const adminEmail = process.env.ADMIN_EMAIL || emailUser;

  if (!emailUser || !emailPass) {
    console.log('Email credentials not configured, skipping email notification');
    return;
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });

  // Generate Google Maps link
  let mapsLink;
  if (order.latitude && order.longitude) {
    // Use coordinates for precise location
    mapsLink = `https://www.google.com/maps?q=${order.latitude},${order.longitude}`;
  } else {
    // Fallback to address search
    const encodedAddress = encodeURIComponent(`${order.address}, ${order.pincode}`);
    mapsLink = `https://www.google.com/maps/search/${encodedAddress}`;
  }

  // Create items list
  const itemsHtml = order.items
    .map(item => `<li>${item.name} × ${item.quantity} (${item.unit}) - ₹${item.price * item.quantity}</li>`)
    .join('');

  // Create email content
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #c41e3a; border-bottom: 2px solid #c41e3a; padding-bottom: 10px;">🛒 New Order Received!</h2>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h3 style="margin-top: 0; color: #333;">Customer Details</h3>
        <p><strong>👤 Name:</strong> ${order.customer_name}</p>
        <p><strong>📞 Phone:</strong> <a href="tel:${order.phone}">${order.phone}</a></p>
        <p><strong>📍 Address:</strong> ${order.address}</p>
        <p><strong>📮 Pincode:</strong> ${order.pincode}</p>
        ${order.latitude && order.longitude ? `<p><strong>📌 Coordinates:</strong> ${order.latitude}, ${order.longitude}</p>` : ''}
      </div>

      <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h3 style="margin-top: 0; color: #333;">📍 Navigate to Customer Location</h3>
        <a href="${mapsLink}" style="display: inline-block; background: #4285f4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          🗺️ Open in Google Maps
        </a>
        <p style="font-size: 12px; color: #666; margin-top: 10px;">
          ${order.latitude && order.longitude ? 'Exact location captured from customer\'s device' : 'Location based on address (customer did not share exact location)'}
        </p>
      </div>

      <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h3 style="margin-top: 0; color: #333;">📦 Order Items</h3>
        <ul style="padding-left: 20px;">
          ${itemsHtml}
        </ul>
      </div>

      <div style="background: #c41e3a; color: white; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center;">
        <h2 style="margin: 0;">💰 Total: ₹${order.total}</h2>
        <p style="margin: 5px 0;">💳 Payment: ${order.payment_mode}</p>
      </div>

      <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
        <p>Order ID: ${order.id}</p>
        <p>Order Time: ${new Date(order.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      </div>
    </div>
  `;

  const textContent = `
NEW ORDER RECEIVED!

Customer: ${order.customer_name}
Phone: ${order.phone}
Address: ${order.address}
Pincode: ${order.pincode}
${order.latitude && order.longitude ? `Coordinates: ${order.latitude}, ${order.longitude}` : ''}

Google Maps: ${mapsLink}

Items:
${order.items.map(item => `- ${item.name} × ${item.quantity} (${item.unit}) - ₹${item.price * item.quantity}`).join('\n')}

Total: ₹${order.total}
Payment: ${order.payment_mode}

Order ID: ${order.id}
  `;

  try {
    await transporter.sendMail({
      from: `"Fresh Meat Hub" <${emailUser}>`,
      to: adminEmail,
      subject: `🛒 New Order from ${order.customer_name} - ₹${order.total}`,
      text: textContent,
      html: htmlContent
    });
    console.log(`Email notification sent for order ${order.id}`);
  } catch (error) {
    console.error('Failed to send email notification:', error.message);
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

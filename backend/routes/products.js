import express from 'express';
import { Product } from '../models/index.js';

const router = express.Router();

// Get all products (optionally filter by category)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    
    const products = await Product.find(query).lean();
    const result = products.map(prod => {
      const { _id, ...rest } = prod;
      return rest;
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Get single product
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findOne({ id: productId }).lean();
    
    if (!product) {
      return res.status(404).json({ detail: 'Product not found' });
    }
    
    const { _id, ...rest } = product;
    res.json(rest);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const { name, price, category, image = '', in_stock = true, description = '', unit = '500g' } = req.body;
    
    if (!name || price === undefined || !category) {
      return res.status(400).json({ detail: 'Name, price, and category are required' });
    }
    
    const product = new Product({ name, price, category, image, in_stock, description, unit });
    await product.save();
    
    res.status(201).json(product.toJSON());
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Update product
router.put('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = {};
    
    // Only include fields that are provided
    const allowedFields = ['name', 'price', 'category', 'image', 'in_stock', 'description', 'unit'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        updateData[field] = req.body[field];
      }
    }
    
    const product = await Product.findOneAndUpdate(
      { id: productId },
      { $set: updateData },
      { new: true }
    ).lean();
    
    if (!product) {
      return res.status(404).json({ detail: 'Product not found' });
    }
    
    const { _id, ...rest } = product;
    res.json(rest);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Delete product
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await Product.deleteOne({ id: productId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ detail: 'Product not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;

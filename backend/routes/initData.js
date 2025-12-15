import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Category, Product, Pincode } from '../models/index.js';

const router = express.Router();

// Initialize default data
router.post('/', async (req, res) => {
  try {
    // Check if already initialized
    const existingCats = await Category.countDocuments();
    if (existingCats > 0) {
      return res.json({ message: 'Data already initialized' });
    }
    
    const now = new Date().toISOString();
    
    // Default categories
    const defaultCategories = [
      { id: uuidv4(), name: 'Chicken', image: 'https://images.unsplash.com/photo-1682991136736-a2b44623eeba?w=400', created_at: now },
      { id: uuidv4(), name: 'Mutton', image: 'https://images.unsplash.com/photo-1708974140638-8554bc01690d?w=400', created_at: now },
      { id: uuidv4(), name: 'Others', image: 'https://images.unsplash.com/photo-1627038259646-04600f5167a3?w=400', created_at: now }
    ];
    
    // Default pincodes
    const defaultPincodes = [
      { id: uuidv4(), code: '500001', active: true },
      { id: uuidv4(), code: '500002', active: true },
      { id: uuidv4(), code: '500003', active: true },
      { id: uuidv4(), code: '500004', active: true }
    ];
    
    // Default products
    const defaultProducts = [
      { id: uuidv4(), name: 'Chicken Breast', price: 280, category: 'Chicken', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400', in_stock: true, description: 'Boneless chicken breast, tender and fresh', unit: '500g', created_at: now },
      { id: uuidv4(), name: 'Chicken Curry Cut', price: 220, category: 'Chicken', image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400', in_stock: true, description: 'Fresh curry cut chicken pieces with bone', unit: '500g', created_at: now },
      { id: uuidv4(), name: 'Chicken Wings', price: 200, category: 'Chicken', image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400', in_stock: true, description: 'Fresh chicken wings, perfect for frying', unit: '500g', created_at: now },
      { id: uuidv4(), name: 'Chicken Drumsticks', price: 240, category: 'Chicken', image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400', in_stock: true, description: 'Juicy chicken drumsticks', unit: '500g', created_at: now },
      { id: uuidv4(), name: 'Mutton Curry Cut', price: 650, category: 'Mutton', image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400', in_stock: true, description: 'Premium goat meat curry cut with bone', unit: '500g', created_at: now },
      { id: uuidv4(), name: 'Mutton Boneless', price: 800, category: 'Mutton', image: 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400', in_stock: true, description: 'Tender boneless mutton pieces', unit: '500g', created_at: now },
      { id: uuidv4(), name: 'Mutton Keema', price: 700, category: 'Mutton', image: 'https://images.unsplash.com/photo-1599921841143-819065a55cc6?w=400', in_stock: true, description: 'Fresh minced mutton', unit: '500g', created_at: now },
      { id: uuidv4(), name: 'Fish Fillet', price: 450, category: 'Others', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400', in_stock: true, description: 'Fresh boneless fish fillet', unit: '500g', created_at: now },
      { id: uuidv4(), name: 'Prawns', price: 550, category: 'Others', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400', in_stock: true, description: 'Fresh medium-sized prawns', unit: '500g', created_at: now },
      { id: uuidv4(), name: 'Eggs (12 pcs)', price: 90, category: 'Others', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400', in_stock: true, description: 'Farm fresh eggs, pack of 12', unit: '12 pcs', created_at: now }
    ];
    
    await Category.insertMany(defaultCategories);
    await Pincode.insertMany(defaultPincodes);
    await Product.insertMany(defaultProducts);
    
    res.json({ message: 'Data initialized successfully' });
  } catch (error) {
    console.error('Error initializing data:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;

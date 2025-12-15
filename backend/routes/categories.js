import express from 'express';
import { Category } from '../models/index.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({}).lean();
    const result = categories.map(cat => {
      const { _id, ...rest } = cat;
      return rest;
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Create category
router.post('/', async (req, res) => {
  try {
    const { name, image = '' } = req.body;
    
    if (!name) {
      return res.status(400).json({ detail: 'Name is required' });
    }
    
    const category = new Category({ name, image });
    await category.save();
    
    res.status(201).json(category.toJSON());
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Delete category
router.delete('/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const result = await Category.deleteOne({ id: categoryId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ detail: 'Category not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;

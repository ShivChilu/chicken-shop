import express from 'express';
import { Pincode } from '../models/index.js';

const router = express.Router();

// Get all pincodes
router.get('/', async (req, res) => {
  try {
    const pincodes = await Pincode.find({}).lean();
    const result = pincodes.map(pin => {
      const { _id, ...rest } = pin;
      return rest;
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching pincodes:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Create pincode
router.post('/', async (req, res) => {
  try {
    const { code, active = true } = req.body;
    
    if (!code) {
      return res.status(400).json({ detail: 'Code is required' });
    }
    
    // Check if pincode already exists
    const existing = await Pincode.findOne({ code });
    if (existing) {
      return res.status(400).json({ detail: 'Pincode already exists' });
    }
    
    const pincode = new Pincode({ code, active });
    await pincode.save();
    
    res.status(201).json(pincode.toJSON());
  } catch (error) {
    console.error('Error creating pincode:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Delete pincode
router.delete('/:pincodeId', async (req, res) => {
  try {
    const { pincodeId } = req.params;
    const result = await Pincode.deleteOne({ id: pincodeId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ detail: 'Pincode not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting pincode:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Verify pincode
router.get('/verify/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const pincode = await Pincode.findOne({ code, active: true });
    res.json({ valid: pincode !== null });
  } catch (error) {
    console.error('Error verifying pincode:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;

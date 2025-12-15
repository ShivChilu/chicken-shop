import express from 'express';

const router = express.Router();

// Verify admin PIN
router.post('/verify', async (req, res) => {
  try {
    const { pin } = req.body;
    const adminPin = process.env.ADMIN_PIN || '4242';
    
    if (pin === adminPin) {
      return res.json({ success: true, message: 'PIN verified' });
    }
    
    res.status(401).json({ detail: 'Invalid PIN' });
  } catch (error) {
    console.error('Error verifying admin:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;

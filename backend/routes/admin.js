import express from 'express';

const router = express.Router();

// Verify admin PIN
router.post('/verify', async (req, res) => {
  try {
    const { pin } = req.body;
    const adminPin = process.env.ADMIN_PIN || '4242';
    
    // Debug logging - can be removed in production
    console.log('Admin PIN verification attempt:');
    console.log('  - Received PIN:', pin, '(type:', typeof pin, ')');
    console.log('  - Expected PIN from env:', adminPin, '(type:', typeof adminPin, ')');
    console.log('  - ADMIN_PIN env var exists:', !!process.env.ADMIN_PIN);
    
    // Convert both to strings and trim whitespace for comparison
    const receivedPin = String(pin).trim();
    const expectedPin = String(adminPin).trim();
    
    if (receivedPin === expectedPin) {
      console.log('  - PIN verification: SUCCESS');
      return res.json({ success: true, message: 'PIN verified' });
    }
    
    console.log('  - PIN verification: FAILED');
    console.log('  - Comparison:', `"${receivedPin}" vs "${expectedPin}"`);
    res.status(401).json({ detail: 'Invalid PIN' });
  } catch (error) {
    console.error('Error verifying admin:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;

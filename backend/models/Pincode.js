import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const pincodeSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: false,
  versionKey: false
});

// Transform output to exclude _id
pincodeSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    return ret;
  }
});

export default mongoose.model('Pincode', pincodeSchema);

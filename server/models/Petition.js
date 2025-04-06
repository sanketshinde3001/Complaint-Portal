const mongoose = require('mongoose');

const PetitionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Petition title cannot be empty.'],
    trim: true,
    maxlength: [150, 'Title cannot be more than 150 characters.'],
  },
  description: {
    type: String,
    required: [true, 'Petition description cannot be empty.'],
    trim: true,
  },
  // Could also be an array of strings if demands are distinct points
  demands: {
    type: String,
    required: [true, 'Petition demands cannot be empty.'],
    trim: true,
  },
  creator: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'closed'],
    default: 'pending',
    index: true,
  },
  signatures: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  // Denormalized count for performance, especially sorting
  signatureCount: {
    type: Number,
    default: 0,
    index: true,
  },
  // Optional fields
  goal: {
    type: Number,
    min: [1, 'Goal must be at least 1.'], // Optional: Minimum goal
  },
  deadline: {
    type: Date,
  },
  tags: {
    type: [String],
    set: tags => tags.map(tag => tag.toLowerCase().trim()),
  },
  // Timestamps for admin actions
  approvedAt: Date,
  rejectedAt: Date,
  closedAt: Date,
  adminNotes: { // Reason for rejection or closure
    type: String,
    trim: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true }, // Ensure virtuals are included when converting to JSON
  toObject: { virtuals: true }
});

// Virtual property to check if the petition is currently active for signing
PetitionSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'approved' && (!this.deadline || this.deadline > now);
});

// Indexing common query fields
PetitionSchema.index({ status: 1, createdAt: -1 });
PetitionSchema.index({ signatureCount: -1 });

// Middleware to prevent duplicate signatures (alternative to $addToSet in controller)
// This might be less performant than controller logic for very high traffic
// PetitionSchema.pre('save', function(next) {
//   if (this.isModified('signatures')) {
//     this.signatures = [...new Set(this.signatures.map(id => id.toString()))];
//     this.signatureCount = this.signatures.length;
//   }
//   next();
// });

const Petition = mongoose.model('Petition', PetitionSchema);

module.exports = Petition;

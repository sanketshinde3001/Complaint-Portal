const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  // Reference to the user who submitted the complaint.
  // Select: false ensures this field isn't returned in general queries,
  // protecting anonymity unless specifically requested (e.g., by an admin).
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    select: false, // Hide user ID by default for anonymity
  },
  text: {
    type: String,
    required: [true, 'Complaint text cannot be empty'],
    trim: true,
  },
  // Store paths or URLs to uploaded media files
  media: [{
    type: String, // Store file paths or URLs
  }],
  tags: {
    type: [String],
    required: [true, 'Please add at least one tag'],
    // Example validation: ensure tags are lowercase and trimmed
    set: tags => tags.map(tag => tag.toLowerCase().trim()),
    // You might add an enum here if you have a fixed list of core tags,
    // but allowing department names requires flexibility.
    // enum: ['boys only', 'girls only', 'hostel', 'college', 'academics', 'infrastructure', ...]
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // --- Voting Fields ---
  upvotes: {
    type: Number,
    default: 0,
  },
  downvotes: {
    type: Number,
    default: 0,
  },
  score: { // Could be simple up - down, or more complex later
    type: Number,
    default: 0,
    index: true // Index for sorting by score
  },
  upvotedBy: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  downvotedBy: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  // --- End Voting Fields ---

  // Timestamp for when the complaint was approved/rejected
  reviewedAt: {
    type: Date,
  },
  // Optional notes from the admin during the review process

  adminNotes: {
    type: String,
    trim: true,
  },
  // Denormalized comment count
  commentCount: {
    type: Number,
    default: 0
  }
}, { // Schema Options
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual property for comment count (less efficient than denormalization)
// This requires fetching comments separately or using aggregation if needed frequently in lists.
// A better approach for lists is often to denormalize (store commentCount directly on Complaint).
// ComplaintSchema.virtual('commentCount', {
//   ref: 'Comment',
//   foreignField: 'complaint',
//   localField: '_id',
//   count: true
// });
// Remove or keep commented out virtual property

// Indexing common query fields can improve performance
ComplaintSchema.index({ status: 1, tags: 1 });
ComplaintSchema.index({ createdAt: -1 });

const Complaint = mongoose.model('Complaint', ComplaintSchema);

module.exports = Complaint;

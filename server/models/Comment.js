const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Comment text cannot be empty.'],
    trim: true,
  },
  // User who wrote the comment
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  // Complaint the comment belongs to
  complaint: {
    type: mongoose.Schema.ObjectId,
    ref: 'Complaint',
    required: true,
  },
  // For replies: reference to the parent comment
  parentComment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Comment',
    default: null, // null indicates a top-level comment
  },
  // Store direct replies to this comment for easier fetching/display of threads
  replies: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Comment'
  }],
  // Consider adding upvotes/downvotes for comments later if needed
  // upvotes: { type: Number, default: 0 },
  // upvotedBy: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
});

// Indexing for faster querying of comments by complaint
CommentSchema.index({ complaint: 1, createdAt: -1 });
// Indexing for finding replies
CommentSchema.index({ parentComment: 1, createdAt: 1 });


// Pre-save hook to update parent comment's replies array (if applicable)
CommentSchema.pre('save', async function(next) {
    // Only run this logic if it's a reply (parentComment is set) and it's a new comment
    if (this.isNew && this.parentComment) {
        try {
            await mongoose.model('Comment').findByIdAndUpdate(this.parentComment, {
                $push: { replies: this._id }
            });
        } catch (error) {
            console.error('Error updating parent comment replies:', error);
            // Decide if you want to halt the save or just log the error
            // return next(error); // Uncomment to stop saving if parent update fails
        }
    }
    next();
});

// Consider adding pre-remove hook if you need to handle deleting replies when a parent is deleted

const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;

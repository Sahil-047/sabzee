const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const forumPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isQuestion: {
    type: Boolean,
    default: false
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    public_id: {
      type: String,
      required: true
    }
  }],
  category: {
    type: String,
    enum: ['general', 'crops', 'livestock', 'equipment', 'pricing', 'weather', 'other'],
    default: 'general'
  },
  tags: [String],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  commentCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create text index for search
forumPostSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Middleware to update comment count
forumPostSchema.pre('save', function(next) {
  if (this.isModified('comments')) {
    this.commentCount = this.comments.length;
  }
  next();
});

module.exports = mongoose.model('ForumPost', forumPostSchema); 
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const ForumPost = require('../models/ForumPost');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Set up multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// @route   POST api/forum
// @desc    Create a new forum post
// @access  Private
router.post('/',
  protect,
  upload.array('images', 5), // Allow up to 5 images per post
  [
    check('title', 'Title is required').not().isEmpty().trim(),
    check('content', 'Content is required').not().isEmpty(),
    check('category', 'Category is required').optional().isIn([
      'general', 'crops', 'livestock', 'equipment', 'pricing', 'weather', 'other'
    ]),
    check('isQuestion', 'isQuestion must be a boolean').optional().isBoolean(),
    check('tags', 'Tags must be an array').optional().isArray()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, content, category, isQuestion, tags } = req.body;

      // Handle image uploads if any
      const images = [];
      if (req.files && req.files.length > 0) {
        const imagePromises = req.files.map(file => {
          return new Promise((resolve, reject) => {
            const base64Data = file.buffer.toString('base64');
            cloudinary.uploader.upload(`data:${file.mimetype};base64,${base64Data}`,
              { folder: 'forum_posts' },
              (error, result) => {
                if (error) reject(error);
                else resolve({ url: result.secure_url, public_id: result.public_id });
              }
            );
          });
        });

        const uploadedImages = await Promise.all(imagePromises);
        images.push(...uploadedImages);
      }

      const newPost = new ForumPost({
        title,
        content,
        author: req.user.id,
        isQuestion: isQuestion || title.trim().endsWith('?'),
        category: category || 'general',
        tags: tags || [],
        images
      });

      const post = await newPost.save();
      
      // Populate the author information for the response
      await post.populate('author', 'name profileImage role');
      
      res.status(201).json({ post });
    } catch (err) {
      console.error('Error in post creation:', err.message);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// @route   GET api/forum
// @desc    Get all forum posts with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      category,
      userType,
      isQuestion,
      author,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (isQuestion === 'true') query.isQuestion = true;
    if (author) query.author = author;
    
    if (search) {
      query.$text = { $search: search };
    }

    // Build aggregation pipeline for user type filtering
    let pipeline = [];
    
    // Start with matching the basic query
    pipeline.push({ $match: query });
    
    // Add lookup to get author info
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'authorInfo'
      }
    });
    
    // Unwind the author array
    pipeline.push({ $unwind: '$authorInfo' });
    
    // Filter by user type if specified
    if (userType) {
      pipeline.push({
        $match: { 'authorInfo.role': userType }
      });
    }
    
    // Sort the results
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    const sortOrder = sort.startsWith('-') ? -1 : 1;
    pipeline.push({ $sort: { [sortField]: sortOrder } });
    
    // Add pagination
    pipeline.push({ $skip: (page - 1) * parseInt(limit) });
    pipeline.push({ $limit: parseInt(limit) });
    
    // Project the fields we want to return
    pipeline.push({
      $project: {
        _id: 1,
        title: 1,
        content: 1,
        isQuestion: 1,
        category: 1,
        images: 1,
        tags: 1,
        createdAt: 1,
        updatedAt: 1,
        commentCount: 1,
        likes: 1,
        views: 1,
        author: {
          _id: '$authorInfo._id',
          name: '$authorInfo.name',
          profileImage: '$authorInfo.profileImage',
          userType: '$authorInfo.role'
        }
      }
    });
    
    // Execute the pipeline
    const posts = await ForumPost.aggregate(pipeline);
    
    // Get total count for pagination info
    const totalPipeline = [...pipeline.slice(0, pipeline.findIndex(stage => '$skip' in stage))];
    totalPipeline.push({ $count: 'total' });
    const totalResults = await ForumPost.aggregate(totalPipeline);
    const total = totalResults.length > 0 ? totalResults[0].total : 0;
    
    res.json({
      posts,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (err) {
    console.error('Error fetching posts:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET api/forum/:id
// @desc    Get forum post by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    // First fetch the post without incrementing views
    const existingPost = await ForumPost.findById(req.params.id);
    
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if the request has a client identifier (IP or user ID)
    const viewerId = req.headers['x-forwarded-for'] || 
                     req.connection.remoteAddress || 
                     req.user?.id || 
                     'anonymous';
    
    // Get the current time
    const currentTime = new Date();
    
    // We'll store viewer data in a separate collection or session store in a real app
    // For now, we'll use a simple approach - check last view timestamp in the request
    const lastViewTime = req.get('Last-View-Time');
    const shouldIncrementView = !lastViewTime || 
                               (currentTime - new Date(lastViewTime)) > 30 * 60 * 1000; // 30 minutes
    
    // Only increment the view if needed
    let post;
    if (shouldIncrementView) {
      post = await ForumPost.findByIdAndUpdate(
        req.params.id,
        { $inc: { views: 1 } },
        { new: true }
      )
      .populate('author', 'name profileImage role')
      .populate('comments.author', 'name profileImage role');
    } else {
      post = await ForumPost.findById(req.params.id)
        .populate('author', 'name profileImage role')
        .populate('comments.author', 'name profileImage role');
    }

    // Set a header to track the last view time
    res.set('Last-View-Time', currentTime.toISOString());
    
    res.json({ post });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT api/forum/:id
// @desc    Update a forum post
// @access  Private
router.put('/:id',
  protect,
  [
    check('title', 'Title is required').optional().not().isEmpty(),
    check('content', 'Content is required').optional().not().isEmpty(),
    check('category', 'Invalid category').optional().isIn([
      'general', 'crops', 'livestock', 'equipment', 'pricing', 'weather', 'other'
    ]),
    check('tags', 'Tags must be an array').optional().isArray()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let post = await ForumPost.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if the user is the author of the post
      if (post.author.toString() !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized to update this post' });
      }

      // Update the post
      const updateData = { ...req.body };
      if (updateData.title && updateData.title.trim().endsWith('?')) {
        updateData.isQuestion = true;
      }

      post = await ForumPost.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true }
      ).populate('author', 'name profileImage role');

      res.json({ post });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// @route   DELETE api/forum/:id
// @desc    Delete a forum post
// @access  Private
router.delete('/:id',
  protect,
  async (req, res) => {
    try {
      const post = await ForumPost.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if the user is the author of the post
      if (post.author.toString() !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized to delete this post' });
      }

      // Delete images from Cloudinary if any
      if (post.images && post.images.length > 0) {
        const deletePromises = post.images.map(image => {
          return new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(image.public_id, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            });
          });
        });
        await Promise.all(deletePromises);
      }

      await post.deleteOne();
      res.json({ message: 'Post removed' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Post not found' });
      }
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// @route   POST api/forum/:id/comments
// @desc    Add a comment to a post
// @access  Private
router.post('/:id/comments',
  protect,
  [
    check('content', 'Comment content is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const post = await ForumPost.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      const newComment = {
        content: req.body.content,
        author: req.user.id
      };

      post.comments.unshift(newComment);
      post.commentCount = post.comments.length;

      await post.save();
      
      // Return the new comment with author details
      const populatedPost = await ForumPost.findById(req.params.id)
        .populate('comments.author', 'name profileImage role');
        
      const addedComment = populatedPost.comments[0];
      
      res.json({ comment: addedComment });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// @route   DELETE api/forum/:id/comments/:commentId
// @desc    Delete a comment
// @access  Private
router.delete('/:id/comments/:commentId',
  protect,
  async (req, res) => {
    try {
      const post = await ForumPost.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Find the comment
      const comment = post.comments.find(
        comment => comment._id.toString() === req.params.commentId
      );

      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      // Check if the user is the author of the comment
      if (comment.author.toString() !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized to delete this comment' });
      }

      // Get the index of the comment to remove
      const removeIndex = post.comments
        .map(comment => comment._id.toString())
        .indexOf(req.params.commentId);

      post.comments.splice(removeIndex, 1);
      post.commentCount = post.comments.length;
      
      await post.save();
      res.json({ message: 'Comment removed' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// @route   POST api/forum/:id/like
// @desc    Like a post
// @access  Private
router.post('/:id/like',
  protect,
  async (req, res) => {
    try {
      const post = await ForumPost.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if the post has already been liked by this user
      if (post.likes.some(like => like.toString() === req.user.id)) {
        return res.status(400).json({ message: 'Post already liked' });
      }

      post.likes.unshift(req.user.id);
      await post.save();

      res.json({ likes: post.likes });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// @route   POST api/forum/:id/unlike
// @desc    Unlike a post
// @access  Private
router.post('/:id/unlike',
  protect,
  async (req, res) => {
    try {
      const post = await ForumPost.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if the post has been liked by this user
      if (!post.likes.some(like => like.toString() === req.user.id)) {
        return res.status(400).json({ message: 'Post has not yet been liked' });
      }

      // Remove the like
      post.likes = post.likes.filter(like => like.toString() !== req.user.id);
      await post.save();

      res.json({ likes: post.likes });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// @route   POST api/forum/:id/addImages
// @desc    Add images to an existing post
// @access  Private
router.post('/:id/addImages',
  protect,
  upload.array('images', 5),
  async (req, res) => {
    try {
      const post = await ForumPost.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if the user is the author of the post
      if (post.author.toString() !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized to update this post' });
      }

      // Handle image uploads
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No images to upload' });
      }

      const imagePromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const base64Data = file.buffer.toString('base64');
          cloudinary.uploader.upload(`data:${file.mimetype};base64,${base64Data}`,
            { folder: 'forum_posts' },
            (error, result) => {
              if (error) reject(error);
              else resolve({ url: result.secure_url, public_id: result.public_id });
            }
          );
        });
      });

      const uploadedImages = await Promise.all(imagePromises);
      
      // Add new images to the post
      post.images.push(...uploadedImages);
      await post.save();

      res.json({ post });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// @route   DELETE api/forum/:id/images/:imageId
// @desc    Delete an image from a post
// @access  Private
router.delete('/:id/images/:imageId',
  protect,
  async (req, res) => {
    try {
      const post = await ForumPost.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if the user is the author of the post
      if (post.author.toString() !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized to update this post' });
      }

      // Find the image
      const image = post.images.find(img => img._id.toString() === req.params.imageId);

      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(image.public_id);

      // Remove from post
      post.images = post.images.filter(img => img._id.toString() !== req.params.imageId);
      await post.save();

      res.json({ message: 'Image removed', post });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

module.exports = router; 
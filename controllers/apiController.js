const mongoose = require('mongoose')
const { body, validationResult } = require('express-validator');
const Post = require('../models/post');

exports.allPosts_GET = (req, res, next) => {
  Post.find({}).exec((err, posts) => {
    if (err) { return next(err); }
    res.send(posts.reverse());
  });
};

exports.post_POST = [
  // Inputs must be unescaped then re-escaped, or else our data will be double escaped and we have no way to extract the information
  body('title').unescape().trim().escape().isLength({ min: 1}).withMessage('No Title Found'),
  body('content').unescape().trim().escape().isLength({ min: 1 }).withMessage('No Content Found'),

  // if there are no errors, save new post to DB
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.send({ "errorMessage": "Missing Title and/or Content" })
    }
    const newPost = new Post({
      title: req.body.title,
      content: req.body.content,
      hidden: req.body.hidden,
      date: new Date().toDateString() + ' at ' + new Date().toLocaleTimeString(),
      comments: [], // new post cant already have comments, so just initialize an empty array
    });
    newPost.save((err) => {
      if (err) { return next(err); }
      res.send(newPost)
    });
  }
];

exports.post_GET = (req, res, next) => {
  Post.findById(req.params.id).exec((err, post) => {
    if (err) { return next(err); }
    res.send(post)
  });
};

exports.post_PUT = [
  // Inputs must be unescaped then re-escaped, or else our data will be double escaped and we have no way to extract the information
  body('title').unescape().trim().escape().isLength({ min: 1 }).withMessage('No Title Found'),
  body('content').unescape().trim().escape().isLength({ min: 1 }).withMessage('No Content Found'),
  body('hidden').custom((value) => {
    // checks to see if the value for hidden is a raw true or false value
    if (value !== true && value !== false) {
      throw new Error('Bad Hidden Value');
    }
    return true;
  }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.send({ "errorMessage": "Missing Title and/or Content" })
    }
    Post.findById(req.params.id).exec((err, post) => {  
      if (err) { return next(err); }

      // if the values in req.body do not match the values of post (the result of DB lookup), add edited flags
      if (req.body.title !== post.title || req.body.content !== post.content) {
        post.edited = true;
        post.dateEdited = new Date().toDateString() + ' at ' + new Date().toLocaleTimeString();
      }

      post.title = req.body.title;
      post.content = req.body.content;
      post.hidden = req.body.hidden;

      post.save((err) => {
        if (err) { return(err); }
        res.send(post)
      });
    });
  }
];

exports.post_DELETE = (req, res, next) => {
  Post.findByIdAndDelete(req.params.id).exec((err, post) => {
    if (err) { return next(err); }
    res.send(post)
  })
};

// comments dont need a GET method because they are included with each post
// comments SHOULD NOT have a put method, comments can be deleted, but the admin should not be able to change your words

exports.comment_POST = [
  // Inputs must be unescaped then re-escaped, or else our data will be double escaped and we have no way to extract the information
  body('comment').unescape().trim().escape().isLength({ min: 1 }).withMessage('Comment not found'),
  body('author').unescape().trim().escape().isLength({ min: 1 }).withMessage('Author not found'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.send({ "errorMessage": "Missing author and/or comment" })
    }
    Post.findById(req.params.id).exec((err, post) => {
      if (err) { return next(err); }
      const newComment = {
        id: mongoose.Types.ObjectId().toString(), // this will provide us with an easy UID
        comment: req.body.comment,
        author: req.body.author,
        date: new Date().toDateString() + ' at ' + new Date().toLocaleTimeString()
      }
      post.comments.push(newComment)
      post.save((err) => {
        if (err) { return next(err); }
        res.send(post)
      });
    });
  }
];

exports.comment_DELETE = (req, res, next) => {
  Post.findById(req.params.id).exec((err, post) => {
    if (err) { return next(err); }

    // loop through comments to find the one with a matching id, then splice it from the comments array
    for (let i = 0; i < post.comments.length; i++) {
      if (post.comments[i].id === req.params.commentid) {
        post.comments.splice(i, 1)
        break;
      };
    };
    post.save((err) => {
      if (err) { return next(err); }
      res.send(post)
    });
  });
};

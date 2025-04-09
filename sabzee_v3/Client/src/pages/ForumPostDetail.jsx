import { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { forumApi } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';

const ForumPostDetail = () => {
  const { postId } = useParams();
  const { isAuthenticated, user, isFarmer } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated and is a farmer
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!isFarmer()) {
      navigate('/access-denied');
      return;
    }
    
    fetchPostDetails();
  }, [postId, isAuthenticated, isFarmer, navigate]);

  const fetchPostDetails = async () => {
    setIsLoading(true);
    try {
      const data = await forumApi.getPostById(postId);
      setPost(data.post);
      setComments(data.post.comments || []);
    } catch (error) {
      console.error('Error fetching post details:', error);
      setError('Failed to load post details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentChange = (e) => {
    setNewComment(e.target.value);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    try {
      await forumApi.addComment(postId, { content: newComment });
      setNewComment('');
      fetchPostDetails(); // Refresh to get the new comment
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await forumApi.deleteComment(postId, commentId);
      // Remove the comment from the local state
      setComments(comments.filter(comment => comment._id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment. Please try again.');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await forumApi.deletePost(postId);
      navigate('/forum');
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post. Please try again.');
    }
  };

  // Show loading while checking authentication or loading the post
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex justify-center items-center">
        <div className="relative">
          <div className="h-16 w-16 border-t-4 border-b-4 border-green-500 rounded-full animate-spin"></div>
          <div className="h-16 w-16 border-t-4 border-green-300 border-dotted rounded-full animate-spin absolute top-0 left-0 opacity-70" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
          <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700">{error}</p>
        </div>
        <div className="text-center">
          <Link to="/forum" className="text-green-600 hover:text-green-700 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to forum
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p>Post not found.</p>
        <Link to="/forum" className="text-green-600 hover:text-green-700 mt-4 inline-block">
          Back to forum
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/forum" className="text-green-600 hover:text-green-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to forum
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
            {post.isQuestion && (
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                Question
              </span>
            )}
          </div>

          <div className="flex items-center mb-6">
            <img
              src={post.author.profileImage || 'https://via.placeholder.com/40'}
              alt={post.author.name}
              className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-green-500"
            />
            <div>
              <p className="font-medium text-gray-800">
                {post.author.name}
                {post.author.userType === 'farmer' && (
                  <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-medium ml-2 px-2 py-0.5 rounded-full">
                    Farmer
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500">
                {format(new Date(post.createdAt), 'MMM d, yyyy')} at {format(new Date(post.createdAt), 'h:mm a')}
              </p>
            </div>
          </div>

          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-line">{post.content}</p>
          </div>

          {isAuthenticated && post.author._id === user._id && (
            <div className="flex justify-end space-x-4 mb-2">
              <Link
                to={`/forum/${post._id}/edit`}
                className="flex items-center px-3 py-1.5 text-sm rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
              <button
                onClick={handleDeletePost}
                className="flex items-center px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Comments ({comments.length})</h2>
          
          {isAuthenticated && (
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <div className="mb-4">
                <textarea
                  value={newComment}
                  onChange={handleCommentChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Write your comment here..."
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-medium hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-md transition-all duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Post Comment
                </button>
              </div>
            </form>
          )}

          {comments.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment._id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <img
                        src={comment.author.profileImage || 'https://via.placeholder.com/40'}
                        alt={comment.author.name}
                        className="w-8 h-8 rounded-full mr-2 object-cover border border-green-200"
                      />
                      <div>
                        <div className="flex items-center">
                          <p className="font-medium text-gray-800">{comment.author.name}</p>
                          {comment.author.userType === 'farmer' && (
                            <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-medium ml-2 px-2 py-0.5 rounded-full">
                              Farmer
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    {isAuthenticated && comment.author._id === user._id && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-red-400 hover:text-red-600 text-sm bg-red-50 rounded-full p-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-gray-700">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForumPostDetail; 
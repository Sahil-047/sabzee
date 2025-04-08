import { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { forumApi } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';

const ForumPostDetail = () => {
  const { postId } = useParams();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPostDetails();
  }, [postId]);

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
        <div className="text-center">
          <Link to="/forum" className="text-green-600 hover:text-green-700">
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
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/forum" className="text-green-600 hover:text-green-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to forum
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
            {post.isQuestion && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Question
              </span>
            )}
          </div>

          <div className="flex items-center mb-6">
            <img
              src={post.author.profileImage || 'https://via.placeholder.com/40'}
              alt={post.author.name}
              className="w-10 h-10 rounded-full mr-3 object-cover"
            />
            <div>
              <p className="font-medium text-gray-800">
                {post.author.name}
                {post.author.userType === 'farmer' && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium ml-2 px-2 py-0.5 rounded">
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
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
              <button
                onClick={handleDeletePost}
                className="text-red-600 hover:text-red-800 flex items-center"
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
          
          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <div className="mb-4">
                <textarea
                  value={newComment}
                  onChange={handleCommentChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  rows={3}
                  placeholder="Write your comment here..."
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  Post Comment
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-gray-100 p-4 rounded-md mb-6 text-center">
              <p className="text-gray-700">
                Please{' '}
                <Link to="/login" className="text-green-600 hover:text-green-800 font-medium">
                  log in
                </Link>{' '}
                to comment.
              </p>
            </div>
          )}

          {comments.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-md">
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
                        className="w-8 h-8 rounded-full mr-2 object-cover"
                      />
                      <div>
                        <div className="flex items-center">
                          <p className="font-medium text-gray-800">{comment.author.name}</p>
                          {comment.author.userType === 'farmer' && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium ml-2 px-2 py-0.5 rounded">
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
                        className="text-red-500 hover:text-red-700 text-sm"
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
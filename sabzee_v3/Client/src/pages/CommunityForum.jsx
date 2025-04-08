import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forumApi } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const CommunityForum = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [currentFilter, setCurrentFilter] = useState('all');
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, [currentFilter]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const filters = {};
      if (currentFilter === 'farmers') {
        filters.userType = 'farmer';
      } else if (currentFilter === 'questions') {
        filters.isQuestion = true;
      }
      
      const response = await forumApi.getPosts(filters);
      setPosts(response.posts || []);
    } catch (error) {
      setError('Failed to load posts. Please try again.');
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPost(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      return;
    }

    try {
      await forumApi.createPost({
        title: newPost.title,
        content: newPost.content,
        isQuestion: newPost.title.endsWith('?')
      });
      setNewPost({ title: '', content: '' });
      setShowNewPostForm(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again.');
    }
  };

  const renderPostCard = (post) => {
    return (
      <div key={post._id} className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            <Link to={`/forum/${post._id}`} className="hover:text-green-600">
              {post.title}
            </Link>
          </h3>
          {post.isQuestion && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              Question
            </span>
          )}
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>
        
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center">
            <img
              src={post.author.profileImage || 'https://via.placeholder.com/40'}
              alt={post.author.name}
              className="w-8 h-8 rounded-full mr-2 object-cover"
            />
            <div>
              <p className="font-medium">
                {post.author.name}
                {post.author.userType === 'farmer' && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium ml-2 px-2 py-0.5 rounded">
                    Farmer
                  </span>
                )}
              </p>
              <p>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {post.commentCount || 0}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Farmer Community Forum
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Connect, share knowledge, and get advice from local farmers and consumers.
          </p>
        </div>

        <div className="mb-8 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex space-x-2 mb-4 sm:mb-0">
            <button
              onClick={() => setCurrentFilter('all')}
              className={`px-4 py-2 rounded-md ${
                currentFilter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Posts
            </button>
            <button
              onClick={() => setCurrentFilter('farmers')}
              className={`px-4 py-2 rounded-md ${
                currentFilter === 'farmers'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Farmers Only
            </button>
            <button
              onClick={() => setCurrentFilter('questions')}
              className={`px-4 py-2 rounded-md ${
                currentFilter === 'questions'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Questions
            </button>
          </div>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login');
                return;
              }
              setShowNewPostForm(!showNewPostForm);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
            {showNewPostForm ? 'Cancel' : 'New Post'}
          </button>
        </div>

        {showNewPostForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-lg font-medium mb-4">Create a New Post</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newPost.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter post title (end with ? for questions)"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={4}
                  value={newPost.content}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Write your post content here..."
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg">No posts found. Be the first to create a post!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map(renderPostCard)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityForum; 
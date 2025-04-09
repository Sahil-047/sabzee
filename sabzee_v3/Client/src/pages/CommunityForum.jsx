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
  
  const { isAuthenticated, user, isFarmer } = useContext(AuthContext);
  const navigate = useNavigate();

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
    
    fetchPosts();
  }, [isAuthenticated, isFarmer, currentFilter, navigate]);

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

    if (!isFarmer()) {
      setError('Only farmers can create posts');
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
      <div key={post._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center mb-4">
              <img
                src={post.author.profileImage || 'https://via.placeholder.com/40'}
                alt={post.author.name}
                className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-green-500"
              />
              <div>
                <p className="font-semibold text-gray-800">
                  {post.author.name}
                  {post.author.userType === 'farmer' && (
                    <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-medium ml-2 px-2 py-0.5 rounded-full">
                      Farmer
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
              </div>
            </div>
            {post.isQuestion && (
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                Question
              </span>
            )}
          </div>
          
          <Link to={`/forum/${post._id}`} className="block">
            <h3 className="text-xl font-bold text-gray-800 mb-2 hover:text-green-600 transition-colors">
              {post.title}
            </h3>
            <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>
          </Link>
          
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
            <div className="flex space-x-4">
              <button className="flex items-center text-gray-500 hover:text-green-600 transition-colors">
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>Like</span>
              </button>
              <Link to={`/forum/${post._id}`} className="flex items-center text-gray-500 hover:text-green-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{post.commentCount || 0} Comments</span>
              </Link>
            </div>
            <div className="flex items-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{post.views || 0} views</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Show loading while checking authentication
  if (isLoading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex justify-center items-center">
        <div className="relative">
          <div className="h-16 w-16 border-t-4 border-b-4 border-green-500 rounded-full animate-spin"></div>
          <div className="h-16 w-16 border-t-4 border-green-300 border-dotted rounded-full animate-spin absolute top-0 left-0 opacity-70" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center mb-12 text-center">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-1 rounded-full inline-block mb-4">
            <div className="bg-white p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-3 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-400">
            Farmers-Only Community Forum
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-500">
            An exclusive space for farmers to connect, share knowledge, and get advice from peers.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-10 space-y-4 md:space-y-0">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrentFilter('all')}
              className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 ${
                currentFilter === 'all'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All Posts
            </button>
            <button
              onClick={() => setCurrentFilter('questions')}
              className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 ${
                currentFilter === 'questions'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Questions
            </button>
          </div>

          <div className="relative w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search posts..."
                className="py-3 px-4 pl-11 w-full md:w-64 rounded-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowNewPostForm(!showNewPostForm)}
            className="inline-flex items-center px-6 py-3 rounded-full text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 font-medium shadow-md transition-all duration-200"
          >
            {showNewPostForm ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Post
              </>
            )}
          </button>
        </div>

        {showNewPostForm && (
          <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden transform transition-all duration-300">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <h2 className="text-lg font-bold text-white">Create a New Post</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Write your post content here..."
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
                  Post
                </button>
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="h-16 w-16 border-t-4 border-b-4 border-green-500 rounded-full animate-spin"></div>
              <div className="h-16 w-16 border-t-4 border-green-300 border-dotted rounded-full animate-spin absolute top-0 left-0 opacity-70" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-10 text-center">
            <div className="inline-block mb-4 p-4 bg-gray-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No posts found</h3>
            <p className="text-gray-500 mb-6">Be the first to create a post and start the conversation!</p>
            <button 
              onClick={() => setShowNewPostForm(true)}
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-medium shadow-md hover:from-green-600 hover:to-green-700 transition-all duration-200"
            >
              Create First Post
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map(renderPostCard)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityForum; 
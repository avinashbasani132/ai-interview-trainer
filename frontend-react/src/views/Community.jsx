import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { MessageSquare, ThumbsUp, Plus, X, MessageCircle, Send, Calendar } from 'lucide-react';

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [replies, setReplies] = useState({});
  const [visibleReplies, setVisibleReplies] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getCommunityPosts();
      setPosts(data.posts || []);
    } catch (e) {
      setError(e.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReplies = async (postId) => {
    const isVisible = visibleReplies[postId];
    setVisibleReplies(prev => ({ ...prev, [postId]: !isVisible }));

    // If opening and not yet loaded, load replies
    if (!isVisible) {
      setReplies(prev => ({ ...prev, [postId]: { loading: true, list: [] } }));
      try {
        const data = await api.getCommunityReplies(postId);
        setReplies(prev => ({
          ...prev,
          [postId]: { loading: false, list: data.replies || [] }
        }));
      } catch (e) {
        setReplies(prev => ({
          ...prev,
          [postId]: { loading: false, list: [], error: 'Failed to load replies' }
        }));
      }
    }
  };

  const handleSubmitReply = async (postId) => {
    const text = replyInputs[postId] || '';
    if (!text.trim()) return;

    try {
      await api.createCommunityReply(postId, text.trim());
      setReplyInputs(prev => ({ ...prev, [postId]: '' }));
      
      // Reload replies list
      const data = await api.getCommunityReplies(postId);
      setReplies(prev => ({
        ...prev,
        [postId]: { loading: false, list: data.replies || [] }
      }));

      // Update reply count locally in posts state
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, replies_count: (p.replies_count || 0) + 1 };
        }
        return p;
      }));
    } catch (e) {
      alert('Failed to post reply.');
    }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!modalTitle.trim() || !modalContent.trim()) return;

    try {
      setSubmittingPost(true);
      await api.createCommunityPost(modalTitle.trim(), modalContent.trim());
      setShowModal(false);
      setModalTitle('');
      setModalContent('');
      loadPosts();
    } catch (e) {
      alert(e.message || 'Failed to submit post.');
    } finally {
      setSubmittingPost(false);
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-fade-in relative">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white font-outfit">Community Hub</h2>
          <p className="text-slate-400 mt-1 text-sm">Share preparation strategies, mock suggestions, and interview outcomes with peers.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Post
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Posts list */}
      <div className="space-y-6 max-w-4xl">
        {posts.length > 0 ? (
          posts.map(p => (
            <div key={p.id} className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-4">
              {/* Post author and meta */}
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs">
                    {(p.author || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-slate-200 font-bold text-xs">{p.author}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-950/60 border border-slate-800/80 text-slate-400 px-2.5 py-1 rounded-full font-bold">
                  {p.replies_count || 0} replies
                </span>
              </div>

              {/* Title & Body */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-white text-base leading-tight">{p.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap">{p.content}</p>
              </div>

              {/* Engagement Panel */}
              <div className="flex items-center gap-6 border-t border-slate-850 pt-3">
                <button 
                  onClick={() => handleToggleReplies(p.id)}
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-colors"
                >
                  <MessageCircle className="w-4.5 h-4.5" />
                  {visibleReplies[p.id] ? 'Hide Discussion' : 'View & Reply'}
                </button>
                <span className="text-slate-500 text-xs">👍 {p.upvotes || 0}</span>
              </div>

              {/* Replies Thread */}
              {visibleReplies[p.id] && (
                <div className="mt-4 border-t border-slate-850 pt-4 space-y-3">
                  {replies[p.id]?.loading ? (
                    <p className="text-slate-500 text-[10px] animate-pulse">Retrieving conversation replies...</p>
                  ) : replies[p.id]?.list && replies[p.id].list.length > 0 ? (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {replies[p.id].list.map((r, rIdx) => (
                        <div key={rIdx} className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-400">
                            {(r.author || 'U')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-slate-300 text-[11px] font-bold">{r.author}</span>
                              <span className="text-[9px] text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed">{r.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs italic">No replies posted yet. Share your inputs!</p>
                  )}

                  {/* Add reply input */}
                  <div className="flex gap-2 items-center bg-slate-950/30 p-2 border border-slate-850 rounded-xl">
                    <input 
                      type="text" 
                      value={replyInputs[p.id] || ''}
                      onChange={(e) => setReplyInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply(p.id)}
                      placeholder="Write a supportive reply..."
                      className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none px-2"
                    />
                    <button 
                      onClick={() => handleSubmitReply(p.id)}
                      className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center">
            <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-50" />
            <h3 className="text-base font-bold text-slate-400 mb-2">Discussion Forum Empty</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">Be the first to create a topic and discuss preparation insights.</p>
          </div>
        )}
      </div>

      {/* 3. Create Post Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-2xl p-6 relative shadow-2xl">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-6">Create New Discussion Post</h3>
            
            <form onSubmit={handleSubmitPost} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Title</label>
                <input 
                  type="text" 
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g., Python mock interviews at Amazon"
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Content description</label>
                <textarea 
                  value={modalContent}
                  onChange={(e) => setModalContent(e.target.value)}
                  placeholder="Describe your questions, strategies, or experiences..."
                  rows="5"
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <button 
                type="submit"
                disabled={submittingPost}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {submittingPost ? 'Posting topic...' : 'Publish Post'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

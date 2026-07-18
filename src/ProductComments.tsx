import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { User } from 'lucide-react';
import { Comment } from './App';

export default function ProductComments({ productId, user }: { productId: string, user: any }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;
    const q = query(collection(db, `products/${productId}/comments`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fbComments: Comment[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        fbComments.push({
          id: doc.id,
          productId,
          userId: data.userId,
          userName: data.userName || 'Anonymous',
          text: data.text,
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString()
        });
      });
      setComments(fbComments);
    });
    return () => unsubscribe();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, `products/${productId}/comments`), {
        userId: user.uid,
        userName: user.email,
        text: newComment.trim(),
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (err) {
      console.error(err);
      alert("Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await deleteDoc(doc(db, `products/${productId}/comments`, commentId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete comment");
    }
  };

  return (
    <div className="mt-16 pt-12 border-t-2 border-neutral-800">
      <h2 className="text-3xl font-black text-white mb-8 uppercase tracking-tighter">COMMENTS & REVIEWS ({comments.length})</h2>
      
      {user ? (
        <form onSubmit={handleSubmit} className="mb-12">
          <div className="flex flex-col gap-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What do you think about this product?"
              className="w-full bg-neutral-900 border-2 border-neutral-800 text-white p-4 focus:border-[#D4FF00] outline-none min-h-[100px] resize-y"
              required
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="self-end bg-[#D4FF00] hover:bg-white text-black font-black uppercase tracking-widest py-3 px-8 transition-colors disabled:opacity-50"
            >
              POST COMMENT
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 p-6 mb-12 text-center text-neutral-400 font-bold uppercase tracking-widest text-sm">
          Please log in to post a comment.
        </div>
      )}

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black border border-neutral-800 flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">{comment.userName}</div>
                  <div className="text-neutral-500 font-mono text-xs">{new Date(comment.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              {user && (user.uid === comment.userId || user.email === 'admin-001@primestock.com') && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-widest underline decoration-red-500/30 underline-offset-4"
                >
                  Delete
                </button>
              )}
            </div>
            <p className="text-neutral-300 font-medium whitespace-pre-wrap leading-relaxed">
              {comment.text}
            </p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm text-center py-12">
            No comments yet. Be the first to review!
          </p>
        )}
      </div>
    </div>
  );
}

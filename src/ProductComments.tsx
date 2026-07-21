import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'lucide-react';
import { Comment } from './App';

export default function ProductComments({ productId, user, productSellerId }: { productId: string, user: any, productSellerId?: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

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
          rating: data.rating,
          replyText: data.replyText,
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
          replyAt: data.replyAt?.toDate().toISOString()
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
        rating,
        createdAt: serverTimestamp()
      });
      setNewComment('');
      setRating(5);
    } catch (err) {
      console.error(err);
      alert("Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, `products/${productId}/comments`, commentId), {
        replyText: replyText.trim(),
        replyAt: serverTimestamp()
      });
      setReplyingTo(null);
      setReplyText('');
    } catch(err) {
      alert('Failed to reply');
    } finally {
      setLoading(false);
    }
  }

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
            <div>
              <label className="text-neutral-500 font-bold uppercase tracking-widest text-xs mb-2 block">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star} type="button" 
                    onClick={() => setRating(star)}
                    className={`text-2xl ${star <= rating ? 'text-[#D4FF00]' : 'text-neutral-700'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

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
                  {comment.rating && (
                    <div className="text-[#D4FF00] text-xs">
                      {'★'.repeat(comment.rating)}{'☆'.repeat(5 - comment.rating)}
                    </div>
                  )}
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

            {comment.replyText && (
              <div className="mt-4 p-4 bg-black border border-neutral-800 ml-8">
                <div className="text-[#D4FF00] font-bold text-xs uppercase tracking-widest mb-2">Seller Reply</div>
                <p className="text-neutral-400 font-medium whitespace-pre-wrap">{comment.replyText}</p>
              </div>
            )}

            {user?.uid === productSellerId && !comment.replyText && (
              <div className="mt-4 text-right">
                {replyingTo === comment.id ? (
                  <div className="mt-2 text-left bg-black p-4 border border-neutral-800">
                    <textarea 
                      value={replyText} onChange={e => setReplyText(e.target.value)}
                      className="w-full bg-neutral-900 border-2 border-neutral-800 text-white p-3 focus:border-[#D4FF00] outline-none min-h-[80px]"
                      placeholder="Write your reply..."
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setReplyingTo(null)} className="text-neutral-500 text-xs font-bold uppercase tracking-widest px-4">Cancel</button>
                      <button onClick={() => handleReply(comment.id)} disabled={loading} className="bg-[#D4FF00] text-black px-4 py-2 font-bold text-xs uppercase tracking-widest">Reply</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setReplyingTo(comment.id)} className="text-[#D4FF00] text-xs font-bold uppercase tracking-widest underline decoration-[#D4FF00]/30 underline-offset-4">
                    Reply to user
                  </button>
                )}
              </div>
            )}
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

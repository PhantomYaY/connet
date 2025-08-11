import React, { useState, useEffect, useRef } from 'react';
import Avatar from '../ui/Avatar';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Bookmark,
  Send,
  Award,
  Hash,
  Check,
  Shield,
  ChevronUp,
  ChevronDown,
  Reply
} from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { useTheme } from '../../context/ThemeContext';
import OptimizedModernLoader from '../OptimizedModernLoader';
import UserContextMenu from '../UserContextMenu';
import * as S from '../../pages/communities/PostDetailStyles';
import {
  getCommunityPostById,
  getPostComments,
  createComment,
  likePost,
  dislikePost,
  likeComment,
  dislikeComment,
  getUserPostReaction,
  getUserCommentReactions,
  setUserReaction,
  isPostSaved,
  savePost,
  unsavePost,
  sendFriendRequest,
  createConversation
} from '../../lib/firestoreService';
import { auth } from '../../lib/firebase';

const PostDetailView = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDarkMode } = useTheme();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedComments, setExpandedComments] = useState(new Set());
  
  // User interactions
  const [postReaction, setPostReaction] = useState(null);
  const [commentReactions, setCommentReactions] = useState({});
  const [savedState, setSavedState] = useState(false);
  const [userContextMenu, setUserContextMenu] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [typingComment, setTypingComment] = useState('');
  const commentInputRef = useRef(null);

  useEffect(() => {
    loadPostData();
    loadComments();
    loadUserReactions();
    checkIfPostSaved();
  }, [postId]);

  const loadPostData = async () => {
    try {
      setLoading(true);
      if (!postId) {
        throw new Error('No post ID provided');
      }
      const postData = await getCommunityPostById(postId);
      setPost(postData);
    } catch (error) {
      console.error('Error loading post:', error);
      setPost(null);
      toast({
        title: "Error",
        description: error.message || "Failed to load post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      if (!postId) {
        setComments([]);
        return;
      }
      const commentsData = await getPostComments(postId);
      setComments(commentsData || []);

      // Load comment reactions after comments are loaded
      if (auth.currentUser && commentsData && commentsData.length > 0) {
        const commentIds = commentsData.map(c => c.id);
        const allCommentIds = [...commentIds];
        // Add reply IDs
        commentsData.forEach(comment => {
          if (comment.replies) {
            allCommentIds.push(...comment.replies.map(r => r.id));
          }
        });

        const reactions = await getUserCommentReactions(allCommentIds);
        setCommentReactions(reactions);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
      toast({
        title: "Error",
        description: "Failed to load comments.",
        variant: "destructive"
      });
    } finally {
      setCommentsLoading(false);
    }
  };

  const loadUserReactions = async () => {
    try {
      if (!postId || !auth.currentUser) {
        setPostReaction(null);
        setCommentReactions({});
        return;
      }

      // Load post reaction
      const postReactionType = await getUserPostReaction(postId);
      setPostReaction(postReactionType);

      // Load comment reactions
      if (comments.length > 0) {
        const commentIds = comments.map(c => c.id);
        const allCommentIds = [...commentIds];
        // Add reply IDs
        comments.forEach(comment => {
          if (comment.replies) {
            allCommentIds.push(...comment.replies.map(r => r.id));
          }
        });

        const reactions = await getUserCommentReactions(allCommentIds);
        setCommentReactions(reactions);
      }
    } catch (error) {
      console.error('Error loading user reactions:', error);
    }
  };

  const checkIfPostSaved = () => {
    // For now, just set to false to avoid Firebase-related errors during mounting
    // This can be improved later once the user authentication state is stable
    setSavedState(false);
  };

  const handlePostReaction = async (type) => {
    if (isAnimating) return;

    try {
      if (!auth.currentUser) {
        toast({
          title: "🔒 Sign in required",
          description: "You need to sign in to react to posts.",
          variant: "warning"
        });
        return;
      }

      setIsAnimating(true);
      const currentReaction = postReaction;

      // Update UI optimistically with animation
      const newReaction = currentReaction === type ? null : type;
      setPostReaction(newReaction);

      // Add haptic feedback for mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Update persistent reaction
      const actualReaction = await setUserReaction(postId, 'post', type);
      setPostReaction(actualReaction);

      // Update post like/dislike counts
      if (type === 'like') {
        await likePost(postId);
        toast({
          title: "👍 Liked!",
          description: "You liked this post",
          variant: "success"
        });
      } else if (type === 'dislike') {
        await dislikePost(postId);
        toast({
          title: "👎 Disliked",
          description: "You disliked this post",
          variant: "default"
        });
      }

      // Reload post data to get updated counts
      await loadPostData();

    } catch (error) {
      console.error('Error updating post reaction:', error);
      // Revert optimistic update
      setPostReaction(postReaction);
      toast({
        title: "❌ Error",
        description: "Failed to update reaction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handleCommentReaction = async (commentId, type) => {
    if (isAnimating) return;

    try {
      if (!auth.currentUser) {
        toast({
          title: "🔒 Sign in required",
          description: "You need to sign in to react to comments.",
          variant: "warning"
        });
        return;
      }

      setIsAnimating(true);
      const currentReaction = commentReactions[commentId];

      // Update UI optimistically
      const newReaction = currentReaction === type ? null : type;
      setCommentReactions(prev => ({
        ...prev,
        [commentId]: newReaction
      }));

      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }

      // Update persistent reaction
      const actualReaction = await setUserReaction(commentId, 'comment', type);
      setCommentReactions(prev => ({
        ...prev,
        [commentId]: actualReaction
      }));

      // Update comment like/dislike counts
      if (type === 'like') {
        await likeComment(commentId);
      } else if (type === 'dislike') {
        await dislikeComment(commentId);
      }

      // Reload comments to get updated counts
      await loadComments();

    } catch (error) {
      console.error('Error updating comment reaction:', error);
      // Revert optimistic update
      setCommentReactions(prev => ({
        ...prev,
        [commentId]: currentReaction
      }));
      toast({
        title: "❌ Error",
        description: "Failed to update reaction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsAnimating(false), 200);
    }
  };

  const handleSavePost = async () => {
    if (isAnimating) return;

    try {
      if (!auth.currentUser) {
        toast({
          title: "🔒 Sign in required",
          description: "You need to sign in to save posts.",
          variant: "warning"
        });
        return;
      }

      setIsAnimating(true);
      const currentSavedState = savedState;

      // Update UI optimistically
      setSavedState(!currentSavedState);

      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(40);
      }

      if (currentSavedState) {
        await unsavePost(postId);
        toast({
          title: "🗑️ Post unsaved",
          description: "Post removed from your saved items.",
          variant: "default"
        });
      } else {
        await savePost(postId);
        toast({
          title: "🔖 Post saved!",
          description: "Post added to your saved items.",
          variant: "success"
        });
      }
    } catch (error) {
      console.error('Error saving/unsaving post:', error);
      // Revert optimistic update
      setSavedState(savedState);
      toast({
        title: "❌ Error",
        description: "Failed to save post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isAnimating) return;

    try {
      setIsAnimating(true);

      await createComment({
        postId,
        content: newComment,
        parentId: replyingTo
      });

      setNewComment('');
      setTypingComment('');
      setReplyingTo(null);

      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]);
      }

      await loadComments();

      toast({
        title: "💬 Comment posted!",
        description: "Your comment has been added successfully.",
        variant: "success"
      });

      // Focus back to comment input for better UX
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "❌ Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handleUserClick = (author, event) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = event.target.getBoundingClientRect();
    const position = {
      x: Math.min(rect.left + rect.width / 2, window.innerWidth - 220),
      y: rect.bottom + 10
    };

    setUserContextMenu({ user: author, position });
  };

  const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '0';
    const numValue = Number(num);
    if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`;
    if (numValue >= 1000) return `${(numValue / 1000).toFixed(1)}k`;
    return numValue.toString();
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'unknown';

    let jsDate;
    try {
      if (date.toDate) {
        jsDate = date.toDate();
      } else if (date instanceof Date) {
        jsDate = date;
      } else {
        jsDate = new Date(date);
      }

      if (isNaN(jsDate.getTime())) {
        return 'unknown';
      }

      const now = new Date();
      const diffMs = now - jsDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return jsDate.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'unknown';
    }
  };

  const handleMessage = async (user) => {
    try {
      // Navigate to messages page and optionally create conversation
      navigate('/messages');

      toast({
        title: "💬 Messages Opened",
        description: `Start chatting with ${user.displayName}`,
        variant: "success"
      });
    } catch (error) {
      console.error('Error opening messages:', error);
      toast({
        title: "❌ Error",
        description: "Failed to open messages. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFriendRequest = async (user) => {
    try {
      // Send actual friend request
      await sendFriendRequest(user.uid || user.authorId);

      toast({
        title: "👋 Friend Request Sent!",
        description: `Friend request sent to ${user.displayName}`,
        variant: "success"
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "❌ Request Failed",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderComment = (comment, depth = 0) => {
    const isExpanded = expandedComments.has(comment.id);
    
    return (
      <S.CommentItem key={comment.id} $depth={depth} $isDarkMode={isDarkMode}>
        <S.CommentHeader>
          <S.AuthorInfo>
            <Avatar
              user={comment.author}
              size="sm"
              isDarkMode={isDarkMode}
              clickable
              onClick={(e) => handleUserClick(comment.author, e)}
            />
            <S.AuthorName
              $isDarkMode={isDarkMode}
              $clickable={true}
              onClick={(e) => handleUserClick(comment.author, e)}
            >
              {comment.author.displayName}
              {comment.author.isVerified && <Check size={12} />}
              {comment.author.isModerator && <Shield size={12} />}
            </S.AuthorName>
            <S.CommentTime $isDarkMode={isDarkMode}>
              {formatTimeAgo(comment.createdAt)}
            </S.CommentTime>
          </S.AuthorInfo>
        </S.CommentHeader>

        <S.CommentContent $isDarkMode={isDarkMode}>
          {comment.content}
        </S.CommentContent>

        <S.CommentFooter>
          <S.CommentStats>
            <S.VoteButton
              $active={commentReactions[comment.id] === 'like'}
              $type="like"
              onClick={() => handleCommentReaction(comment.id, 'like')}
              disabled={isAnimating}
              style={{
                transform: isAnimating && commentReactions[comment.id] === 'like' ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.2s ease'
              }}
            >
              <ThumbsUp size={14} style={{
                transform: commentReactions[comment.id] === 'like' ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.3s ease'
              }} />
              {formatNumber(comment.likes || 0)}
            </S.VoteButton>
            <S.VoteButton
              $active={commentReactions[comment.id] === 'dislike'}
              $type="dislike"
              onClick={() => handleCommentReaction(comment.id, 'dislike')}
              disabled={isAnimating}
              style={{
                transform: isAnimating && commentReactions[comment.id] === 'dislike' ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.2s ease'
              }}
            >
              <ThumbsDown size={14} style={{
                transform: commentReactions[comment.id] === 'dislike' ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.3s ease'
              }} />
              {comment.dislikes > 0 && formatNumber(comment.dislikes)}
            </S.VoteButton>
            <S.ReplyButton 
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              $active={replyingTo === comment.id}
            >
              <Reply size={14} />
              Reply
            </S.ReplyButton>
          </S.CommentStats>
        </S.CommentFooter>

        {replyingTo === comment.id && (
          <S.ReplyBox $isDarkMode={isDarkMode}>
            <S.CommentInput
              placeholder="Write a thoughtful reply..."
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                setTypingComment(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              $isDarkMode={isDarkMode}
              autoFocus
            />
            <S.CommentSubmitButtons>
              <S.CancelButton onClick={() => setReplyingTo(null)}>
                Cancel
              </S.CancelButton>
              <S.SubmitButton
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isAnimating}
                style={{
                  opacity: isAnimating ? 0.7 : 1,
                  transform: isAnimating ? 'scale(0.95)' : 'scale(1)'
                }}
              >
                <Send size={14} style={{
                  transform: isAnimating ? 'rotate(45deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }} />
                {isAnimating ? 'Replying...' : 'Reply'}
              </S.SubmitButton>
            </S.CommentSubmitButtons>
          </S.ReplyBox>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <S.RepliesContainer>
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </S.RepliesContainer>
        )}
      </S.CommentItem>
    );
  };

  if (loading) {
    return <OptimizedModernLoader />;
  }

  if (!post) {
    return (
      <S.ErrorContainer $isDarkMode={isDarkMode}>
        <h2>Post not found</h2>
        <p>The post you're looking for doesn't exist or has been removed.</p>
        <S.BackButton onClick={() => navigate('/communities')}>
          <ArrowLeft size={16} />
          Back to Communities
        </S.BackButton>
      </S.ErrorContainer>
    );
  }

  return (
    <S.PostDetailContainer $isDarkMode={isDarkMode}>
      {/* Header */}
      <S.Header $isDarkMode={isDarkMode}>
        <S.BackButton $isDarkMode={isDarkMode} onClick={() => navigate('/communities')}>
          <ArrowLeft size={20} />
        </S.BackButton>
        <S.HeaderInfo>
          <S.CommunityBadge $isDarkMode={isDarkMode}>
            <Hash size={12} />
            {post.community}
          </S.CommunityBadge>
        </S.HeaderInfo>
      </S.Header>

      <S.ContentContainer>
        {/* Main Post */}
        <S.PostContainer $isDarkMode={isDarkMode}>
          <S.PostHeader>
            <S.AuthorInfo>
              <Avatar
                user={post.author}
                size="lg"
                isDarkMode={isDarkMode}
                clickable
                onClick={(e) => handleUserClick(post.author, e)}
              />
              <S.AuthorDetails>
                <S.AuthorName
                  $isDarkMode={isDarkMode}
                  $clickable={true}
                  onClick={(e) => handleUserClick(post.author, e)}
                >
                  {post.author.displayName}
                  {post.author.isVerified && <Check size={12} />}
                  {post.author.isModerator && <Shield size={12} />}
                </S.AuthorName>
                <S.PostTime $isDarkMode={isDarkMode}>
                  {formatTimeAgo(post.createdAt)}
                  {post.editedAt && <span> • edited</span>}
                </S.PostTime>
              </S.AuthorDetails>
            </S.AuthorInfo>
          </S.PostHeader>

          <S.PostContent>
            <S.PostTitle $isDarkMode={isDarkMode}>
              {post.type === 'poll' && <span>📊 </span>}
              {post.type === 'image' && <span>🖼️ </span>}
              {post.type === 'video' && <span>🎥 </span>}
              {post.type === 'link' && <span>🔗 </span>}
              {post.title}
            </S.PostTitle>

            {post.flair && (
              <S.PostFlair $color={post.flair.color}>
                {post.flair.text}
              </S.PostFlair>
            )}

            <S.PostText $isDarkMode={isDarkMode}>
              {post.content}
            </S.PostText>

            {/* Media Attachments */}
            {post.mediaAttachments?.length > 0 && (
              <S.MediaContainer>
                {post.mediaAttachments.map((media, index) => (
                  <S.MediaItem key={index}>
                    {media.type === 'image' && (
                      <img src={media.url} alt={media.caption} />
                    )}
                  </S.MediaItem>
                ))}
              </S.MediaContainer>
            )}

            {/* Poll */}
            {post.poll && (
              <S.PollContainer $isDarkMode={isDarkMode}>
                <S.PollQuestion>{post.poll.question}</S.PollQuestion>
                <S.PollOptions>
                  {post.poll.options.map(option => {
                    const percentage = post.poll.totalVotes > 0 
                      ? (option.votes / post.poll.totalVotes) * 100 
                      : 0;
                    return (
                      <S.PollOption
                        key={option.id}
                        $percentage={percentage}
                        $voted={post.poll.hasVoted}
                      >
                        <S.PollOptionText>{option.text}</S.PollOptionText>
                        <S.PollOptionStats>
                          <span>{percentage.toFixed(1)}%</span>
                          <span>({option.votes} votes)</span>
                        </S.PollOptionStats>
                      </S.PollOption>
                    );
                  })}
                </S.PollOptions>
                <S.PollFooter>
                  <span>{formatNumber(post.poll.totalVotes)} total votes</span>
                  <span>Ends {formatTimeAgo(post.poll.endsAt)}</span>
                </S.PollFooter>
              </S.PollContainer>
            )}

            {/* Tags */}
            {post.tags?.length > 0 && (
              <S.TagsContainer>
                {post.tags.map(tag => (
                  <S.Tag
                    key={tag}
                    onClick={() => {
                      navigate(`/communities?tag=${encodeURIComponent(tag)}`);
                    }}
                  >
                    {tag}
                  </S.Tag>
                ))}
              </S.TagsContainer>
            )}
          </S.PostContent>

          <S.PostFooter $isDarkMode={isDarkMode}>
            <S.PostStats>
              <S.VoteButton
              $active={postReaction === 'like'}
              $type="like"
              onClick={() => handlePostReaction('like')}
              disabled={isAnimating}
              style={{
                transform: isAnimating && postReaction === 'like' ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.2s ease'
              }}
            >
              <ThumbsUp size={16} style={{
                transform: postReaction === 'like' ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.3s ease'
              }} />
              {formatNumber(post.likes)}
            </S.VoteButton>
            <S.VoteButton
              $active={postReaction === 'dislike'}
              $type="dislike"
              onClick={() => handlePostReaction('dislike')}
              disabled={isAnimating}
              style={{
                transform: isAnimating && postReaction === 'dislike' ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.2s ease'
              }}
            >
              <ThumbsDown size={16} style={{
                transform: postReaction === 'dislike' ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.3s ease'
              }} />
              {post.dislikes > 0 && formatNumber(post.dislikes)}
            </S.VoteButton>

              <S.ActionButton>
                <MessageSquare size={16} />
                {formatNumber(comments.length)} Comments
              </S.ActionButton>

              <S.ActionButton
                onClick={handleSavePost}
                disabled={isAnimating}
                style={{
                  transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <Bookmark
                  size={16}
                  fill={savedState ? 'currentColor' : 'none'}
                  style={{
                    transform: savedState ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 0.3s ease'
                  }}
                />
                {savedState ? '✓ Saved' : 'Save'}
              </S.ActionButton>
            </S.PostStats>

            {/* Awards */}
            {post.awards?.length > 0 && (
              <S.AwardsList>
                {post.awards.map((award, index) => (
                  <S.AwardBadge key={index}>
                    <Award size={12} />
                    {award.count}
                  </S.AwardBadge>
                ))}
              </S.AwardsList>
            )}
          </S.PostFooter>
        </S.PostContainer>

        {/* Comments Section */}
        <S.CommentsSection $isDarkMode={isDarkMode}>
          <S.CommentsHeader>
            <h3>Comments ({formatNumber(comments.length)})</h3>
          </S.CommentsHeader>

          {/* Add Comment */}
          <S.AddCommentSection $isDarkMode={isDarkMode}>
            <S.CommentInput
              ref={commentInputRef}
              placeholder="What are your thoughts? Share your insights..."
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                setTypingComment(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              $isDarkMode={isDarkMode}
            />
            <S.CommentSubmitButtons>
              <S.SubmitButton
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isAnimating}
                style={{
                  opacity: isAnimating ? 0.7 : 1,
                  transform: isAnimating ? 'scale(0.95)' : 'scale(1)'
                }}
              >
                <Send size={14} style={{
                  transform: isAnimating ? 'rotate(45deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }} />
                {isAnimating ? 'Posting...' : 'Comment'}
              </S.SubmitButton>
              {newComment.trim() && (
                <span style={{
                  fontSize: '0.75rem',
                  color: isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)',
                  alignSelf: 'center',
                  marginLeft: '0.5rem'
                }}>
                  ⌘+Enter to post
                </span>
              )}
            </S.CommentSubmitButtons>
          </S.AddCommentSection>

          {/* Comments List */}
          <S.CommentsList>
            {commentsLoading ? (
              <S.LoadingMessage>Loading comments...</S.LoadingMessage>
            ) : comments.length === 0 ? (
              <S.EmptyComments $isDarkMode={isDarkMode}>
                <MessageSquare size={48} />
                <h4>No comments yet</h4>
                <p>Be the first to share your thoughts!</p>
              </S.EmptyComments>
            ) : (
              comments.map(comment => renderComment(comment))
            )}
          </S.CommentsList>
        </S.CommentsSection>
      </S.ContentContainer>

      {/* User Context Menu */}
      {userContextMenu && (
        <UserContextMenu
          user={userContextMenu.user}
          position={userContextMenu.position}
          onClose={() => setUserContextMenu(null)}
          onMessage={handleMessage}
          onFriendRequest={handleFriendRequest}
          isDarkMode={isDarkMode}
        />
      )}
    </S.PostDetailContainer>
  );
};

export default PostDetailView;

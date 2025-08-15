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
  Reply,
  Eye,
  Calendar,
  Star
} from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { useTheme } from '../../context/ThemeContext';
import OptimizedModernLoader from '../OptimizedModernLoader';
import UserContextMenu from '../UserContextMenu';
import styled from 'styled-components';
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
          title: "���� Sign in required",
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
      <CommentItem key={comment.id} $depth={depth}>
        <CommentHeader>
          <AuthorInfo>
            <Avatar
              user={comment.author}
              size="sm"
              isDarkMode={isDarkMode}
              clickable
              onClick={(e) => handleUserClick(comment.author, e)}
            />
            <AuthorName
              $clickable={true}
              onClick={(e) => handleUserClick(comment.author, e)}
            >
              {comment.author.displayName}
              {comment.author.isVerified && <Check size={12} />}
              {comment.author.isModerator && <Shield size={12} />}
            </AuthorName>
            <CommentTime>
              {formatTimeAgo(comment.createdAt)}
            </CommentTime>
          </AuthorInfo>
        </CommentHeader>

        <CommentContent>
          {comment.content}
        </CommentContent>

        <CommentFooter>
          <CommentStats>
            <VoteButton
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
            </VoteButton>
            <VoteButton
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
            </VoteButton>
            <ReplyButton
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              $active={replyingTo === comment.id}
            >
              <Reply size={14} />
              Reply
            </ReplyButton>
          </CommentStats>
        </CommentFooter>

        {replyingTo === comment.id && (
          <ReplyBox>
            <CommentInput
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
              autoFocus
            />
            <CommentSubmitButtons>
              <CancelButton onClick={() => setReplyingTo(null)}>
                Cancel
              </CancelButton>
              <SubmitButton
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
              </SubmitButton>
            </CommentSubmitButtons>
          </ReplyBox>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <RepliesContainer>
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </RepliesContainer>
        )}
      </CommentItem>
    );
  };

  if (loading) {
    return <OptimizedModernLoader />;
  }

  if (!post) {
    return (
      <StyledWrapper className="bg-slate-100 dark:bg-slate-900">
        <div
          className="absolute inset-0 pointer-events-none [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]
          bg-[linear-gradient(to_right,theme(colors.slate.300)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.300)_1px,transparent_1px)]
          dark:bg-[linear-gradient(to_right,theme(colors.slate.800)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.800)_1px,transparent_1px)]
          bg-[size:40px_40px]"
        />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-cyan-400/10 via-blue-500/0 to-teal-400/10 animate-pulse-slow" />
        
        <ErrorContainer>
          <div className="glass-card">
            <h2>Post not found</h2>
            <p>The post you're looking for doesn't exist or has been removed.</p>
            <BackButton onClick={() => navigate('/communities')}>
              <ArrowLeft size={16} />
              Back to Communities
            </BackButton>
          </div>
        </ErrorContainer>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper className="bg-slate-100 dark:bg-slate-900">
      {/* Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]
        bg-[linear-gradient(to_right,theme(colors.slate.300)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.300)_1px,transparent_1px)]
        dark:bg-[linear-gradient(to_right,theme(colors.slate.800)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.800)_1px,transparent_1px)]
        bg-[size:40px_40px]"
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-cyan-400/10 via-blue-500/0 to-teal-400/10 animate-pulse-slow" />

      {/* Header */}
      <Header>
        <BackButton onClick={() => navigate('/communities')}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </BackButton>
        <HeaderInfo>
          <CommunityBadge>
            <Hash size={12} />
            {post.community}
          </CommunityBadge>
        </HeaderInfo>
      </Header>

      {/* Content Container */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <ContentContainer>
        {/* Main Post */}
        <PostContainer className="glass-card">
          <PostHeader>
            <AuthorInfo>
              <Avatar
                user={post.author}
                size="lg"
                isDarkMode={isDarkMode}
                clickable
                onClick={(e) => handleUserClick(post.author, e)}
              />
              <AuthorDetails>
                <AuthorName
                  $clickable={true}
                  onClick={(e) => handleUserClick(post.author, e)}
                >
                  {post.author.displayName}
                  {post.author.isVerified && <Check size={12} />}
                  {post.author.isModerator && <Shield size={12} />}
                </AuthorName>
                <PostTime>
                  <Calendar size={12} />
                  {formatTimeAgo(post.createdAt)}
                  {post.editedAt && <span> • edited</span>}
                </PostTime>
              </AuthorDetails>
            </AuthorInfo>
          </PostHeader>

          <PostContent>
            <PostTitle>
              {post.type === 'poll' && <span>📊 </span>}
              {post.type === 'image' && <span>🖼️ </span>}
              {post.type === 'video' && <span>🎥 </span>}
              {post.type === 'link' && <span>🔗 </span>}
              {post.title}
            </PostTitle>

            {post.flair && (
              <PostFlair $color={post.flair.color}>
                {post.flair.text}
              </PostFlair>
            )}

            <PostText>
              {post.content}
            </PostText>

            {/* Media Attachments */}
            {post.mediaAttachments?.length > 0 && (
              <MediaContainer>
                {post.mediaAttachments.map((media, index) => (
                  <MediaItem key={index}>
                    {media.type === 'image' && (
                      <img src={media.url} alt={media.caption} />
                    )}
                  </MediaItem>
                ))}
              </MediaContainer>
            )}

            {/* Poll */}
            {post.poll && (
              <PollContainer>
                <PollQuestion>{post.poll.question}</PollQuestion>
                <PollOptions>
                  {post.poll.options.map(option => {
                    const percentage = post.poll.totalVotes > 0 
                      ? (option.votes / post.poll.totalVotes) * 100 
                      : 0;
                    return (
                      <PollOption
                        key={option.id}
                        $percentage={percentage}
                        $voted={post.poll.hasVoted}
                      >
                        <PollOptionText>{option.text}</PollOptionText>
                        <PollOptionStats>
                          <span>{percentage.toFixed(1)}%</span>
                          <span>({option.votes} votes)</span>
                        </PollOptionStats>
                      </PollOption>
                    );
                  })}
                </PollOptions>
                <PollFooter>
                  <span>{formatNumber(post.poll.totalVotes)} total votes</span>
                  <span>Ends {formatTimeAgo(post.poll.endsAt)}</span>
                </PollFooter>
              </PollContainer>
            )}

            {/* Tags */}
            {post.tags?.length > 0 && (
              <TagsContainer>
                {post.tags.map(tag => (
                  <Tag
                    key={tag}
                    onClick={() => {
                      navigate(`/communities?tag=${encodeURIComponent(tag)}`);
                    }}
                  >
                    {tag}
                  </Tag>
                ))}
              </TagsContainer>
            )}
          </PostContent>

          <PostFooter>
            <PostStats>
              <VoteButton
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
              </VoteButton>
              <VoteButton
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
              </VoteButton>

              <ActionButton>
                <MessageSquare size={16} />
                {formatNumber(comments.length)} Comments
              </ActionButton>

              <ActionButton
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
              </ActionButton>
            </PostStats>

            {/* Awards */}
            {post.awards?.length > 0 && (
              <AwardsList>
                {post.awards.map((award, index) => (
                  <AwardBadge key={index}>
                    <Award size={12} />
                    {award.count}
                  </AwardBadge>
                ))}
              </AwardsList>
            )}
          </PostFooter>
        </PostContainer>

        {/* Comments Section */}
        <CommentsSection className="glass-card">
          <CommentsHeader>
            <h3>
              <MessageSquare size={20} />
              Comments ({formatNumber(comments.length)})
            </h3>
          </CommentsHeader>

          {/* Add Comment */}
          <AddCommentSection>
            <CommentInput
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
            />
            <CommentSubmitButtons>
              <SubmitButton
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
              </SubmitButton>
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
            </CommentSubmitButtons>
          </AddCommentSection>

          {/* Comments List */}
          <CommentsList>
            {commentsLoading ? (
              <LoadingMessage>Loading comments...</LoadingMessage>
            ) : comments.length === 0 ? (
              <EmptyComments>
                <MessageSquare size={48} />
                <h4>No comments yet</h4>
                <p>Be the first to share your thoughts!</p>
              </EmptyComments>
            ) : (
              comments.map(comment => renderComment(comment))
            )}
          </CommentsList>
        </CommentsSection>
        </ContentContainer>
      </div>

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
    </StyledWrapper>
  );
};

// Styled Components with Glass Card Theme
const StyledWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;

  .glass-card {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 1.5rem;
    padding: 1.75rem;
    border: 1px solid rgba(255, 255, 255, 0.25);
    transition: box-shadow 0.3s ease;

    .dark & {
      background: rgba(30, 41, 59, 0.25);
      border: 1px solid rgba(148, 163, 184, 0.15);
    }

    &:hover {
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      
      .dark & {
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }
    }
  }

  @keyframes pulse-slow {
    0%, 100% {
      transform: scale(1);
      opacity: 0.08;
    }
    50% {
      transform: scale(1.03);
      opacity: 0.16;
    }
  }

  .animate-pulse-slow {
    animation: pulse-slow 20s ease-in-out infinite;
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 100;
  
  .dark & {
    background: rgba(15, 23, 42, 0.8);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  color: #374151;
  font-weight: 500;
  transition: all 0.2s;
  
  .dark & {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #d1d5db;
  }
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
    
    .dark & {
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const CommunityBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid rgba(59, 130, 246, 0.2);
  
  .dark & {
    background: rgba(96, 165, 250, 0.1);
    color: #60a5fa;
    border: 1px solid rgba(96, 165, 250, 0.2);
  }
`;

const ContentContainer = styled.main`
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    padding: 1rem;
    gap: 1.5rem;
  }
`;

const PostContainer = styled.article`
  position: relative;
`;

const PostHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const AuthorDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const AuthorName = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};

  .dark & {
    color: #f9fafb;
  }

  ${props => props.$clickable && `
    &:hover {
      color: #2563eb;
      
      .dark & {
        color: #60a5fa;
      }
    }
  `}

  svg {
    color: #22c55e;
  }
`;

const PostTime = styled.time`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  .dark & {
    color: #9ca3af;
  }
`;

const PostContent = styled.div`
  margin-bottom: 1.5rem;
`;

const PostTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem 0;
  line-height: 1.4;

  .dark & {
    color: #f9fafb;
  }

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const PostFlair = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: ${props => props.$color || '#6b7280'};
  color: white;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const PostText = styled.div`
  color: #374151;
  line-height: 1.7;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;

  .dark & {
    color: #d1d5db;
  }

  @media (max-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const MediaContainer = styled.div`
  margin: 1.5rem 0;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
  
  .dark & {
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const MediaItem = styled.div`
  position: relative;
  overflow: hidden;

  img {
    width: 100%;
    height: auto;
    max-height: 500px;
    object-fit: cover;
  }
`;

const PollContainer = styled.div`
  margin: 1.5rem 0;
  padding: 1.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.5);
  
  .dark & {
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const PollQuestion = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
  line-height: 1.4;
  
  .dark & {
    color: #f9fafb;
  }
`;

const PollOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const PollOption = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: ${props => {
    const percentage = props.$percentage || 0;
    const baseColor = 'rgba(59, 130, 246, 0.1)';
    return `linear-gradient(90deg, 
      ${baseColor} 0%, 
      ${baseColor} ${percentage}%, 
      transparent ${percentage}%
    )`;
  }};
  border-radius: 0.75rem;
  cursor: ${props => props.$voted ? 'default' : 'pointer'};
  transition: all 0.2s ease;
  border: 1px solid rgba(59, 130, 246, 0.2);
  position: relative;
  
  &:hover {
    background: ${props => props.$voted ? '' : 'rgba(59, 130, 246, 0.05)'};
    transform: ${props => props.$voted ? '' : 'translateY(-1px)'};
  }
`;

const PollOptionText = styled.span`
  font-weight: 500;
  color: #111827;
  position: relative;
  z-index: 1;
  
  .dark & {
    color: #f9fafb;
  }
`;

const PollOptionStats = styled.div`
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  position: relative;
  z-index: 1;
  
  .dark & {
    color: #9ca3af;
  }
`;

const PollFooter = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  
  .dark & {
    color: #9ca3af;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
`;

const Tag = styled.span`
  padding: 0.25rem 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid rgba(59, 130, 246, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;

  .dark & {
    background: rgba(96, 165, 250, 0.1);
    color: #60a5fa;
    border: 1px solid rgba(96, 165, 250, 0.2);
  }

  &:hover {
    background: rgba(59, 130, 246, 0.2);
    transform: translateY(-1px);
    
    .dark & {
      background: rgba(96, 165, 250, 0.2);
    }
  }

  &::before {
    content: '#';
    opacity: 0.7;
    margin-right: 0.125rem;
  }
`;

const PostFooter = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);

  .dark & {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
`;

const PostStats = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: space-between;
  }
`;

const VoteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${props => {
    if (props.$active && props.$type === 'like') return '#10b981';
    if (props.$active && props.$type === 'dislike') return '#ef4444';
    return 'rgba(0, 0, 0, 0.1)';
  }};
  border-radius: 0.75rem;
  background: ${props => {
    if (props.$active && props.$type === 'like') return 'rgba(16, 185, 129, 0.1)';
    if (props.$active && props.$type === 'dislike') return 'rgba(239, 68, 68, 0.1)';
    return 'rgba(255, 255, 255, 0.5)';
  }};
  color: ${props => {
    if (props.$active && props.$type === 'like') return '#10b981';
    if (props.$active && props.$type === 'dislike') return '#ef4444';
    return '#6b7280';
  }};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  backdrop-filter: blur(10px);

  .dark & {
    background: ${props => {
      if (props.$active && props.$type === 'like') return 'rgba(16, 185, 129, 0.1)';
      if (props.$active && props.$type === 'dislike') return 'rgba(239, 68, 68, 0.1)';
      return 'rgba(30, 41, 59, 0.5)';
    }};
    border: 1px solid ${props => {
      if (props.$active && props.$type === 'like') return '#10b981';
      if (props.$active && props.$type === 'dislike') return '#ef4444';
      return 'rgba(255, 255, 255, 0.1)';
    }};
    color: ${props => {
      if (props.$active && props.$type === 'like') return '#10b981';
      if (props.$active && props.$type === 'dislike') return '#ef4444';
      return '#9ca3af';
    }};
  }

  &:hover {
    background: ${props => {
      if (props.$type === 'like') return 'rgba(16, 185, 129, 0.15)';
      if (props.$type === 'dislike') return 'rgba(239, 68, 68, 0.15)';
      return 'rgba(59, 130, 246, 0.1)';
    }};
    border-color: ${props => {
      if (props.$type === 'like') return '#10b981';
      if (props.$type === 'dislike') return '#ef4444';
      return '#3b82f6';
    }};
    transform: translateY(-1px);
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.5);
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  backdrop-filter: blur(10px);

  .dark & {
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #9ca3af;
  }

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: #3b82f6;
    color: #2563eb;
    transform: translateY(-1px);
    
    .dark & {
      background: rgba(96, 165, 250, 0.1);
      border-color: #60a5fa;
      color: #60a5fa;
    }
  }
`;

const AwardsList = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const AwardBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid rgba(245, 158, 11, 0.2);
`;

const CommentsSection = styled.section`
  position: relative;
`;

const CommentsHeader = styled.div`
  margin-bottom: 1.5rem;

  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .dark & {
      color: #f9fafb;
    }
  }
`;

const AddCommentSection = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  
  .dark & {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const CommentInput = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.7);
  color: #111827;
  font-size: 0.875rem;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
  margin-bottom: 1rem;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);

  .dark & {
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f9fafb;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    background: rgba(255, 255, 255, 0.9);
    
    .dark & {
      background: rgba(30, 41, 59, 0.9);
      border-color: #60a5fa;
    }
  }

  &::placeholder {
    color: #9ca3af;
    
    .dark & {
      color: #6b7280;
    }
  }
`;

const CommentSubmitButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #1d4ed8, #1e40af);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  backdrop-filter: blur(10px);

  .dark & {
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #9ca3af;
  }

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
    color: #ef4444;
    
    .dark & {
      background: rgba(239, 68, 68, 0.1);
    }
  }
`;

const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CommentItem = styled.div`
  padding: 1.5rem;
  margin-left: ${props => props.$depth * 2}rem;
  border-left: ${props => props.$depth > 0 ? '2px solid rgba(59, 130, 246, 0.3)' : 'none'};
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(15px);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;

  .dark & {
    background: rgba(30, 41, 59, 0.3);
    border: 1px solid rgba(148, 163, 184, 0.1);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.4);
    transform: translateY(-1px);
    
    .dark & {
      background: rgba(30, 41, 59, 0.4);
    }
  }

  @media (max-width: 768px) {
    margin-left: ${props => props.$depth * 1}rem;
    padding: 1rem;
  }
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const CommentContent = styled.div`
  color: #374151;
  line-height: 1.6;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;

  .dark & {
    color: #d1d5db;
  }
`;

const CommentFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const CommentStats = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const CommentTime = styled.time`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  
  .dark & {
    color: #9ca3af;
  }
`;

const ReplyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  background: ${props => props.$active ? '#3b82f6' : 'rgba(255, 255, 255, 0.7)'};
  color: ${props => props.$active ? 'white' : '#6b7280'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
  font-weight: 500;
  backdrop-filter: blur(10px);

  .dark & {
    background: ${props => props.$active ? '#60a5fa' : 'rgba(30, 41, 59, 0.7)'};
    border: 1px solid ${props => props.$active ? '#60a5fa' : 'rgba(255, 255, 255, 0.1)'};
    color: ${props => props.$active ? 'white' : '#9ca3af'};
  }

  &:hover {
    background: ${props => props.$active ? '#1d4ed8' : 'rgba(59, 130, 246, 0.1)'};
    border-color: #3b82f6;
    color: ${props => props.$active ? 'white' : '#2563eb'};
    
    .dark & {
      background: ${props => props.$active ? '#3b82f6' : 'rgba(96, 165, 250, 0.1)'};
      border-color: #60a5fa;
      color: ${props => props.$active ? 'white' : '#60a5fa'};
    }
  }
`;

const ReplyBox = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 0.75rem;
  border: 1px solid rgba(59, 130, 246, 0.2);
  
  .dark & {
    background: rgba(96, 165, 250, 0.05);
    border: 1px solid rgba(96, 165, 250, 0.2);
  }
`;

const RepliesContainer = styled.div`
  margin-top: 1rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  
  .dark & {
    color: #9ca3af;
  }
`;

const EmptyComments = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  color: #6b7280;

  .dark & {
    color: #9ca3af;
  }

  svg {
    opacity: 0.5;
    margin-bottom: 1rem;
  }

  h4 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem 0;
    
    .dark & {
      color: #f9fafb;
    }
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.6;
    opacity: 0.7;
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;
  position: relative;
  z-index: 10;

  .glass-card {
    text-align: center;
    max-width: 500px;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    color: #111827;
    
    .dark & {
      color: #f9fafb;
    }
  }

  p {
    font-size: 1rem;
    color: #6b7280;
    margin: 0 0 1.5rem 0;
    line-height: 1.5;
    
    .dark & {
      color: #9ca3af;
    }
  }
`;

export default PostDetailView;

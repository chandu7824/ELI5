import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import {
  FiThumbsUp,
  FiThumbsDown,
  FiMessageCircle,
  FiSend,
  FiX,
} from "react-icons/fi";
import { FaRobot } from "react-icons/fa";
import toast from "react-hot-toast";
import io from "socket.io-client";

const CommentSection = ({ postId, newAnswer, onNewAnswerAdded }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      withCredentials: true,
    });
    setSocket(newSocket);

    newSocket.emit("join-post", postId);

    newSocket.on("new-user-answer", (data) => {
      if (data.postId === postId) {
        console.log("New user answer received!", data.comment);
        setComments((prevComments) => {
          const exists = prevComments.some((c) => c._id === data.comment._id);
          if (!exists) {
            toast.success("New answer added!");
            return [...prevComments, data.comment];
          }
          return prevComments;
        });
      }
    });

    newSocket.on("answer-count-updated", (data) => {
      if (data.postId === postId) {
        console.log("Answer count updated:", data.totalAnswers);
      }
    });

    return () => {
      newSocket.emit("leave-post", postId);
      newSocket.disconnect();
    };
  }, [postId]);

  useEffect(() => {
    if (newAnswer) {
      setComments((prevComments) => {
        const exists = prevComments.some((c) => c._id === newAnswer._id);
        if (!exists) {
          toast.success("🤖 AI has answered!", {
            icon: "🤖",
            duration: 5000,
          });
          return [newAnswer, ...prevComments];
        }
        return prevComments;
      });

      if (onNewAnswerAdded) {
        onNewAnswerAdded();
      }

      setTimeout(() => {
        const newCommentElement = document.getElementById(
          `comment-${newAnswer._id}`
        );
        if (newCommentElement) {
          newCommentElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          newCommentElement.classList.add("bg-green-50", "animate-pulse");
          setTimeout(() => {
            newCommentElement.classList.remove("bg-green-50", "animate-pulse");
          }, 3000);
        }
      }, 500);
    }
  }, [newAnswer]);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const response = await api.get(`/comments/post/${postId}`);
      setComments(response.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (commentId, voteType) => {
    if (!user) {
      toast.error("Please login to vote");
      return;
    }

    try {
      await api.post("/votes", {
        targetId: commentId,
        targetType: "comment",
        voteType,
      });
      await fetchComments();
      toast.success(`Voted ${voteType === "upvote" ? "up" : "down"}!`);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to vote");
    }
  };

  const handleAddComment = async (parentId = null) => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      const response = await api.post("/comments", {
        postId,
        content: newComment,
        parentId,
      });
      setNewComment("");
      setReplyTo(null);
      await fetchComments();
      toast.success("Comment added!");

      setTimeout(() => {
        const newCommentElement = document.getElementById(
          `comment-${response.data.commentId}`
        );
        if (newCommentElement) {
          newCommentElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          newCommentElement.classList.add("bg-yellow-50");
          setTimeout(() => {
            newCommentElement.classList.remove("bg-yellow-50");
          }, 2000);
        }
      }, 100);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add comment");
    }
  };

  const CommentItem = ({ comment, depth = 0 }) => {
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isVoting, setIsVoting] = useState(false);

    const maxDepth = 3;
    const canReply = depth < maxDepth && !comment.isAI;

    const submitReply = async () => {
      if (!replyText.trim()) {
        toast.error("Please enter a reply");
        return;
      }

      if (!user) {
        toast.error("Please login to reply");
        return;
      }

      try {
        await api.post("/comments", {
          postId,
          content: replyText,
          parentId: comment._id,
        });
        setReplyText("");
        setShowReply(false);
        await fetchComments();
        toast.success("Reply added!");
      } catch (error) {
        toast.error(error.response?.data?.error || "Failed to add reply");
      }
    };

    const handleVoteClick = async (voteType) => {
      setIsVoting(true);
      await handleVote(comment._id, voteType);
      setIsVoting(false);
    };

    return (
      <div
        id={`comment-${comment._id}`}
        className={`mt-4 transition-all duration-300 ${
          depth > 0 ? "ml-4 sm:ml-6 md:ml-8" : ""
        }`}
      >
        <div className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2 flex-wrap">
                {comment.isAI ? (
                  <>
                    <div className="flex items-center space-x-1 bg-purple-100 px-2 py-1 rounded-full">
                      <FaRobot className="text-purple-600 text-sm" />
                      <span className="font-medium text-purple-600 text-sm">
                        ELI5 AI Assistant
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-green-600 font-medium">
                      ✓ AI Generated
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-gray-700">
                      {comment.authorName || "Anonymous"}
                    </span>
                    {comment.userId === user?.id && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(comment.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {comment.isAccepted && (
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                    ✓ Accepted Answer
                  </span>
                )}
              </div>

              <p className="text-gray-700 mb-3 whitespace-pre-wrap break-words">
                {comment.content}
              </p>

              <div className="flex items-center space-x-4 text-sm">
                <button
                  onClick={() => handleVoteClick("upvote")}
                  disabled={isVoting}
                  className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                >
                  <FiThumbsUp className="text-sm" />
                  <span>{comment.metrics?.upvotes || 0}</span>
                </button>
                <button
                  onClick={() => handleVoteClick("downvote")}
                  disabled={isVoting}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  <FiThumbsDown className="text-sm" />
                  <span>{comment.metrics?.downvotes || 0}</span>
                </button>
                {!comment.isAI && canReply && (
                  <button
                    onClick={() => setShowReply(!showReply)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <FiMessageCircle className="text-sm" />
                    <span>Reply</span>
                  </button>
                )}
              </div>

              {showReply && (
                <div className="mt-3 animate-slide-in-left">
                  <div className="flex items-start space-x-2">
                    <div className="flex-1">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${
                          comment.authorName || "Anonymous"
                        }...`}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={submitReply}
                        className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <FiSend />
                      </button>
                      <button
                        onClick={() => setShowReply(false)}
                        className="bg-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        <FiX />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="replies-container">
            {comment.replies.map((reply) => (
              <CommentItem key={reply._id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-gray-200 rounded-lg shimmer"></div>
        <div className="h-24 bg-gray-200 rounded-lg shimmer"></div>
        <div className="h-24 bg-gray-200 rounded-lg shimmer"></div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">
          Answers ({comments.length}){" "}
        </h3>
        <div className="text-sm text-gray-500">
          {user ? (
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Logged in as {user.username}</span>
            </span>
          ) : (
            <span className="text-yellow-600">⚠️ Login to vote and reply</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h4 className="font-semibold text-gray-700 mb-3">Your Answer</h4>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write your answer here... You can mention users with @username"
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-gray-500">
            💡 Tip: Use @username to mention other users
          </p>
          <button
            onClick={() => handleAddComment()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-all transform hover:scale-105"
          >
            Post Answer
          </button>
        </div>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FiMessageCircle className="text-6xl text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            No answers yet. Be the first to answer!
          </p>
          <p className="text-sm text-gray-400 mt-2">
            The AI will generate an answer shortly...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;

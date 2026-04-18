import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CommentSection from "../components/CommentSection";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import {
  FiThumbsUp,
  FiThumbsDown,
  FiArrowLeft,
  FiUser,
  FiCalendar,
  FiTag,
  FiEye,
  FiMessageCircle,
} from "react-icons/fi";
import { FaRobot } from "react-icons/fa";
import io from "socket.io-client";
import toast from "react-hot-toast";

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [newAnswer, setNewAnswer] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io("http://localhost:5000", {
        withCredentials: true,
        transports: ["websocket"],
      });
    }

    socketRef.current.emit("join-post", id);

    socketRef.current.on("new-ai-answer", (data) => {
      if (data.postId === id) {
        console.log("New AI answer received!", data.comment);
        setNewAnswer(data.comment);
        toast.success("🤖 AI has answered this question!", {
          icon: "🤖",
          duration: 5000,
        });
      }
    });

    socketRef.current.on("new-user-answer", (data) => {
      if (data.postId === id) {
        console.log("New user answer received!", data.comment);
        setNewAnswer(data.comment);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave-post", id);
      }
    };
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await api.get(`/posts/${id}`);
      setPost(response.data);
    } catch (error) {
      console.error("Error fetching post:", error);
      toast.error("Failed to load question");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    if (!user) {
      toast.error("Please login to vote");
      return;
    }

    setVoting(true);
    try {
      await api.post("/votes", {
        targetId: id,
        targetType: "post",
        voteType,
      });
      await fetchPost();
      toast.success(`Voted ${voteType === "upvote" ? "up" : "down"}!`);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to vote");
    } finally {
      setVoting(false);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (let [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`;
      }
    }
    return "just now";
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="h-8 bg-gray-200 rounded shimmer mb-4 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded shimmer mb-2 w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded shimmer mt-4"></div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="max-w-4xl mx-auto fade-in">
      <button
        onClick={() => navigate("/")}
        className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 mb-4 transition"
      >
        <FiArrowLeft />
        <span>Back to all questions</span>
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                {post.title}
              </h1>

              <div className="flex items-center space-x-4 text-sm text-gray-500 flex-wrap gap-2">
                <div className="flex items-center space-x-1">
                  <FiUser size={14} />
                  <span>{post.authorName || "Anonymous"}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiCalendar size={14} />
                  <span>{getTimeAgo(post.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiEye size={14} />
                  <span>{post.metrics?.views || 0} views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiMessageCircle size={14} />
                  <span>{post.metrics?.totalAnswers || 0} answers</span>
                </div>
              </div>
            </div>

            {post.aiResponseStatus === "generated" && (
              <div className="flex flex-col items-center">
                <div className="bg-purple-100 p-2 rounded-full">
                  <FaRobot className="text-purple-600 text-xl" />
                </div>
                <span className="text-xs text-purple-600 mt-1">
                  AI Answered
                </span>
              </div>
            )}
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full"
                >
                  <FiTag className="inline mr-1" size={10} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {post.description}
            </p>
          </div>

          <div className="flex items-center space-x-6 pt-4 border-t">
            <button
              onClick={() => handleVote("upvote")}
              disabled={voting}
              className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition disabled:opacity-50"
            >
              <FiThumbsUp size={20} />
              <span className="font-semibold">
                {post.metrics?.upvotes || 0}
              </span>
            </button>
            <button
              onClick={() => handleVote("downvote")}
              disabled={voting}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition disabled:opacity-50"
            >
              <FiThumbsDown size={20} />
              <span className="font-semibold">
                {post.metrics?.downvotes || 0}
              </span>
            </button>
          </div>
        </div>
      </div>

      <CommentSection
        postId={id}
        newAnswer={newAnswer}
        onNewAnswerAdded={() => setNewAnswer(null)}
      />
    </div>
  );
};

export default PostDetail;

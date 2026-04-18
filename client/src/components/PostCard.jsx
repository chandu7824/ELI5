import React from "react";
import { Link } from "react-router-dom";
import {
  FiMessageCircle,
  FiEye,
  FiThumbsUp,
  FiThumbsDown,
  FiUser,
} from "react-icons/fi";
import { FaRobot } from "react-icons/fa";

const PostCard = ({ post }) => {
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

  return (
    <Link to={`/post/${post._id}`}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 fade-in">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <FiUser size={14} />
                <span>{post.authorName || "Anonymous"}</span>
              </div>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-500">
                {getTimeAgo(post.createdAt)}
              </span>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-2 hover:text-purple-600 transition">
              {post.title}
            </h3>

            <p className="text-gray-600 mb-4 line-clamp-2">
              {post.description}
            </p>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <FiMessageCircle />
                <span>{post.metrics?.totalAnswers || 0} answers</span>
              </div>
              <div className="flex items-center space-x-1">
                <FiEye />
                <span>{post.metrics?.views || 0} views</span>
              </div>
              <div className="flex items-center space-x-1">
                <FiThumbsUp className="text-green-600" />
                <span>{post.metrics?.upvotes || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <FiThumbsDown className="text-red-600" />
                <span>{post.metrics?.downvotes || 0}</span>
              </div>
            </div>
          </div>

          {post.aiResponseStatus === "generated" && (
            <div className="flex flex-col items-center ml-4">
              <div className="bg-purple-100 p-2 rounded-full">
                <FaRobot className="text-purple-600 text-xl" />
              </div>
              <span className="text-xs text-purple-600 mt-1">AI Answered</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default PostCard;

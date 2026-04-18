import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import {
  FiUser,
  FiMail,
  FiCalendar,
  FiMessageCircle,
  FiThumbsUp,
  FiArrowLeft,
  FiLoader,
} from "react-icons/fi";

const Profile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("questions");

  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    fetchProfile();
  }, [userId, user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userIdToFetch = isOwnProfile ? user?.id : userId;

      if (!userIdToFetch) {
        setLoading(false);
        return;
      }

      const userResponse = await api.get(`/users/${userIdToFetch}`);
      setProfileUser(userResponse.data.user);

      const postsResponse = await api.get(`/users/${userIdToFetch}/posts`);
      setUserPosts(postsResponse.data.posts);

      const commentsResponse = await api.get(
        `/users/${userIdToFetch}/comments`
      );
      setUserComments(commentsResponse.data.comments);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <FiLoader className="animate-spin text-4xl text-purple-600 mx-auto mb-4" />
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!profileUser && !loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-500 text-lg">User not found</p>
        <Link
          to="/"
          className="mt-4 inline-block text-purple-600 hover:text-purple-700"
        >
          Go back home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto fade-in">
      <button
        onClick={() => window.history.back()}
        className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 mb-4 transition"
      >
        <FiArrowLeft />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
            <FiUser className="text-white text-4xl" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {profileUser.username}
            </h1>
            {isOwnProfile && (
              <p className="text-gray-500 text-sm mt-1">{profileUser.email}</p>
            )}

            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-3 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <FiCalendar size={14} />
                <span>
                  Joined{" "}
                  {new Date(profileUser.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <FiMessageCircle size={14} />
                <span>{profileUser.stats?.totalAnswers || 0} answers</span>
              </div>
              <div className="flex items-center space-x-1">
                <FiThumbsUp size={14} />
                <span>
                  {profileUser.stats?.reputationScore || 0} reputation
                </span>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <div className="text-center bg-purple-50 px-4 py-2 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {profileUser.stats?.totalQuestions || 0}
              </div>
              <div className="text-xs text-gray-500">Questions</div>
            </div>
            <div className="text-center bg-green-50 px-4 py-2 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {profileUser.stats?.totalAnswers || 0}
              </div>
              <div className="text-xs text-gray-500">Answers</div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {profileUser.profile?.bio && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-gray-600 italic">"{profileUser.profile.bio}"</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("questions")}
            className={`flex-1 px-6 py-3 text-center font-medium transition ${
              activeTab === "questions"
                ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Questions ({userPosts.length})
          </button>
          <button
            onClick={() => setActiveTab("answers")}
            className={`flex-1 px-6 py-3 text-center font-medium transition ${
              activeTab === "answers"
                ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Answers ({userComments.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === "questions" && (
            <>
              {userPosts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No questions asked yet</p>
                  {isOwnProfile && (
                    <Link
                      to="/"
                      className="mt-2 inline-block text-purple-600 hover:text-purple-700"
                    >
                      Ask your first question →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <div key={post._id} className="border-b last:border-0 pb-4">
                      <Link to={`/post/${post._id}`}>
                        <h3 className="font-semibold text-gray-800 hover:text-purple-600 transition">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {post.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        <span>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <span>{post.metrics?.totalAnswers || 0} answers</span>
                        <span>{post.metrics?.views || 0} views</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "answers" && (
            <>
              {userComments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No answers given yet</p>
                  {isOwnProfile && (
                    <p className="text-sm text-gray-400 mt-2">
                      Go answer some questions!
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {userComments.map((comment) => (
                    <div
                      key={comment._id}
                      className="border-b last:border-0 pb-4"
                    >
                      <Link to={`/post/${comment.postId}`}>
                        <p className="text-gray-700 hover:text-purple-600 transition line-clamp-2">
                          {comment.content}
                        </p>
                      </Link>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        <span>
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                        <span>{comment.metrics?.upvotes || 0} upvotes</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

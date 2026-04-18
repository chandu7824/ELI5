import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import {
  FiUsers,
  FiUserCheck,
  FiFileText,
  FiMessageCircle,
  FiThumbsUp,
  FiTrash2,
  FiLoader,
  FiShield,
  FiLogOut,
  FiTrendingUp,
  FiUserPlus,
  FiEye,
  FiCalendar,
  FiActivity,
  FiStar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import toast from "react-hot-toast";

const AddAdminModal = ({ isOpen, onClose, onAdminAdded }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/admin/users/create-admin", {
        email,
        username,
        password,
      });
      toast.success("New admin created successfully!");
      onAdminAdded();
      onClose();
      setEmail("");
      setUsername("");
      setPassword("");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Add New Admin</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
            >
              {loading ? "Creating..." : "Create Admin"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [userPage, setUserPage] = useState(1);
  const [postPage, setPostPage] = useState(1);
  const [commentPage, setCommentPage] = useState(1);
  const [userFilter, setUserFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserActivity, setShowUserActivity] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
    fetchPosts();
    fetchComments();
  }, [userPage, userFilter, userSearch, postPage, commentPage]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/admin/stats");
      setStats(response.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get(
        `/admin/users?page=${userPage}&role=${userFilter}&search=${userSearch}`
      );
      setUsers(response.data);
    } catch (error) {
      toast.error("Failed to load users");
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await api.get(`/admin/posts?page=${postPage}`);
      setPosts(response.data);
    } catch (error) {
      toast.error("Failed to load posts");
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/admin/comments?page=${commentPage}`);
      setComments(response.data);
    } catch (error) {
      toast.error("Failed to load comments");
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      toast.success(`User role updated to ${role}`);
      fetchUsers();
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update role");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure? This will delete all user data."))
      return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success("User deleted successfully");
      fetchUsers();
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete user");
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/admin/posts/${postId}`);
      toast.success("Post deleted");
      fetchPosts();
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;
    try {
      await api.delete(`/admin/comments/${commentId}`);
      toast.success("Comment deleted");
      fetchComments();
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const viewUserActivity = async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}/activity`);
      setSelectedUser(response.data);
      setShowUserActivity(true);
    } catch (error) {
      toast.error("Failed to load user activity");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FiLoader className="animate-spin text-4xl text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-purple-100 mt-1">
                Welcome back, {user?.username}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition"
            >
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex space-x-4 mb-8 bg-white rounded-lg shadow-md p-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 px-6 py-2 rounded-lg font-medium transition ${
              activeTab === "dashboard"
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FiTrendingUp className="inline mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 px-6 py-2 rounded-lg font-medium transition ${
              activeTab === "users"
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FiUsers className="inline mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 px-6 py-2 rounded-lg font-medium transition ${
              activeTab === "posts"
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FiFileText className="inline mr-2" />
            Posts
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`flex-1 px-6 py-2 rounded-lg font-medium transition ${
              activeTab === "comments"
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FiMessageCircle className="inline mr-2" />
            Comments
          </button>
        </div>

        {activeTab === "dashboard" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {stats.stats.totalUsers}
                    </p>
                    <p className="text-sm text-purple-600">
                      Admins: {stats.stats.totalAdmins}
                    </p>
                  </div>
                  <FiUsers className="text-4xl text-purple-600" />
                </div>
                <div className="mt-2 text-sm text-green-600">
                  +{stats.stats.newUsersToday} new today
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Posts</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {stats.stats.totalPosts}
                    </p>
                  </div>
                  <FiFileText className="text-4xl text-blue-600" />
                </div>
                <div className="mt-2 text-sm text-green-600">
                  +{stats.stats.newPostsToday} new today
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Comments</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {stats.stats.totalComments}
                    </p>
                  </div>
                  <FiMessageCircle className="text-4xl text-green-600" />
                </div>
                <div className="mt-2 text-sm text-green-600">
                  +{stats.stats.newCommentsToday} new today
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Votes</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {stats.stats.totalVotes}
                    </p>
                  </div>
                  <FiThumbsUp className="text-4xl text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Posts</h3>
                <div className="space-y-3">
                  {stats.recentPosts.map((post) => (
                    <div key={post._id} className="border-b pb-2">
                      <p className="font-medium text-gray-800 truncate">
                        {post.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString()} •{" "}
                        {post.metrics?.views || 0} views
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Top Users by Reputation
                </h3>
                <div className="space-y-3">
                  {stats.topUsers.map((u) => (
                    <div
                      key={u._id}
                      className="border-b pb-2 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {u.username}
                        </p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                      <div className="flex items-center space-x-1 text-yellow-600">
                        <FiStar />
                        <span>{u.stats?.reputationScore || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Users</option>
                  <option value="user">Regular Users</option>
                  <option value="admin">Admins</option>
                </select>
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="border rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                onClick={() => setShowAddAdminModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center space-x-2"
              >
                <FiUserPlus />
                <span>Add New Admin</span>
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Questions
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Answers
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Reputation
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.users?.map((u) => (
                      <tr key={u._id}>
                        <td className="px-6 py-4 font-medium">{u.username}</td>
                        <td className="px-6 py-4 text-sm">{u.email}</td>
                        <td className="px-6 py-4 text-center">
                          <select
                            value={u.role}
                            onChange={(e) =>
                              updateUserRole(u._id, e.target.value)
                            }
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={u._id === user?.id}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {u.stats?.totalQuestions || 0}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {u.stats?.totalAnswers || 0}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {u.stats?.reputationScore || 0}
                        </td>
                        <td className="px-6 py-4 text-center text-sm">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center space-x-2">
                          <button
                            onClick={() => viewUserActivity(u._id)}
                            className="text-blue-600 hover:text-blue-800 transition"
                            title="View Activity"
                          >
                            <FiActivity />
                          </button>
                          {u._id !== user?.id && (
                            <button
                              onClick={() => deleteUser(u._id)}
                              className="text-red-600 hover:text-red-800 transition"
                              title="Delete User"
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "posts" && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Author
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Answers
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Views
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      AI Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {posts.posts?.map((p) => (
                    <tr key={p._id}>
                      <td className="px-6 py-4">
                        <p className="font-medium truncate max-w-md">
                          {p.title}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {p.author?.username || "Anonymous"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {p.metrics?.totalAnswers || 0}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {p.metrics?.views || 0}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            p.aiResponseStatus === "generated"
                              ? "bg-green-100 text-green-700"
                              : p.aiResponseStatus === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {p.aiResponseStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => deletePost(p._id)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Delete Post"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "comments" && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Author
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Upvotes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {comments.comments?.map((c) => (
                    <tr key={c._id}>
                      <td className="px-6 py-4">
                        <p className="truncate max-w-md">{c.content}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {c.authorName || "Anonymous"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {c.isAI ? (
                          <span className="text-purple-600">🤖 AI</span>
                        ) : (
                          <span className="text-gray-500">User</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {c.metrics?.upvotes || 0}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => deleteComment(c._id)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Delete Comment"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AddAdminModal
        isOpen={showAddAdminModal}
        onClose={() => setShowAddAdminModal(false)}
        onAdminAdded={() => {
          fetchUsers();
          fetchDashboardData();
        }}
      />

      {showUserActivity && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">User Activity</h2>
              <button
                onClick={() => setShowUserActivity(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedUser.totalPosts}
                  </p>
                  <p className="text-sm text-gray-600">Posts</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {selectedUser.totalComments}
                  </p>
                  <p className="text-sm text-gray-600">Comments</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {selectedUser.totalVotes}
                  </p>
                  <p className="text-sm text-gray-600">Votes</p>
                </div>
              </div>

              <h3 className="font-semibold mt-4">Recent Posts</h3>
              {selectedUser.posts.slice(0, 5).map((post) => (
                <div key={post._id} className="border-b pb-2">
                  <p className="font-medium">{post.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}

              <h3 className="font-semibold mt-4">Recent Comments</h3>
              {selectedUser.comments.slice(0, 5).map((comment) => (
                <div key={comment._id} className="border-b pb-2">
                  <p className="text-sm">{comment.content}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

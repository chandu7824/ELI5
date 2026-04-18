import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import NotificationBell from "./NotificationBell";
import CreatePostModal from "./CreatePostModal";
import LoginModal from "./LoginModal";
import {
  FiPlus,
  FiUser,
  FiLogOut,
  FiLogIn,
  FiX,
  FiSearch,
  FiShield,
} from "react-icons/fi";
import { FaRobot } from "react-icons/fa";
import io from "socket.io-client";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );
  const [onlineCount, setOnlineCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io("http://localhost:5000", {
        withCredentials: true,
        transports: ["websocket"],
      });

      socketRef.current.on("connect", () => {
        console.log("Socket connected");
      });

      socketRef.current.on("online-count", (count) => {
        setOnlineCount(count);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/?search=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    navigate("/");
  };

  return (
    <>
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/"
              className="flex items-center space-x-2 hover:opacity-80 transition"
            >
              <FaRobot className="text-3xl text-purple-600" />
              <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ELI5
              </span>
              <span className="text-sm text-gray-500 hidden sm:inline">
                Explain Like I'm 5
              </span>
            </Link>

            <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  {searchInput && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="text-gray-400 hover:text-purple-600 p-1"
                  >
                    <FiSearch size={16} />
                  </button>
                </div>
              </div>
            </form>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-1 bg-green-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">
                  {onlineCount} online
                </span>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center space-x-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition transform hover:scale-105"
              >
                <FiPlus />
                <span className="hidden sm:inline">Ask Question</span>
              </button>

              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 transition"
                >
                  <FiShield />
                  <span className="hidden md:inline">Admin</span>
                </Link>
              )}

              {user ? (
                <div className="flex items-center space-x-3">
                  <NotificationBell />
                  <Link
                    to={`/profile/${user.id}`}
                    className="flex items-center space-x-1 hover:text-purple-600 transition"
                  >
                    <FiUser />
                    <span className="hidden md:inline">{user.username}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition"
                  >
                    <FiLogOut />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center space-x-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  <FiLogIn />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
};

export default Navbar;

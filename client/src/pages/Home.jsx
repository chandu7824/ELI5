import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import PostCard from "../components/PostCard";
import api from "../services/api";
import { FiLoader, FiAlertCircle, FiX, FiSearch } from "react-icons/fi";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    if (searchQuery) {
      setSearchInput(searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    fetchPosts(1);
  }, [searchQuery]);

  const fetchPosts = async (pageNum = page) => {
    try {
      setLoading(true);
      const response = await api.get(
        `/feed?page=${pageNum}&limit=10&search=${searchQuery || ""}`
      );

      if (pageNum === 1) {
        setPosts(response.data.posts);
      } else {
        setPosts((prev) => [...prev, ...response.data.posts]);
      }

      setHasMore(response.data.posts.length === 10);
      setError(null);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("Failed to load questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ search: searchInput.trim() });
      setIsSearching(true);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (value.trim() === "") {
      clearSearch();
      return;
    }

    const timeout = setTimeout(() => {
      if (value.trim()) {
        setSearchParams({ search: value.trim() });
        setIsSearching(true);
      }
    }, 500);

    setSearchTimeout(timeout);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchParams({});
    setIsSearching(false);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  };

  if (error && posts.length === 0) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="text-6xl text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => fetchPosts(1)}
          className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8 fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Explain Like I'm 5
        </h1>
        <p className="text-gray-600">
          Ask anything, get simple answers that a 5-year-old would understand!
        </p>
      </div>

      {searchQuery && (
        <div className="mb-6 bg-blue-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FiSearch className="text-blue-600" />
            <span className="text-blue-800">
              Showing results for: <strong>"{searchQuery}"</strong>
            </span>
          </div>
          <button
            onClick={clearSearch}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition"
          >
            <FiX />
            <span>Clear search</span>
          </button>
        </div>
      )}

      {posts.length === 0 && !loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          {searchQuery ? (
            <>
              <p className="text-gray-500 text-lg">
                No results found for "{searchQuery}"
              </p>
              <p className="text-gray-400 mt-2">Try different keywords or</p>
              <button
                onClick={clearSearch}
                className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
              >
                view all questions
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-lg">No questions found</p>
              <p className="text-gray-400 mt-2">
                Be the first to ask something!
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div
              key={post._id}
              style={{ animationDelay: `${index * 0.05}s` }}
              className="fade-in"
            >
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <FiLoader className="animate-spin text-4xl text-purple-600 mx-auto" />
          <p className="text-gray-500 mt-2">Loading questions...</p>
        </div>
      )}

      {!loading && hasMore && posts.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;

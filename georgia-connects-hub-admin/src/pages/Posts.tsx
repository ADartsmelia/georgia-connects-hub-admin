import React, { useState, useEffect } from "react";
import { postsAPI } from "../lib/api";
import { toast } from "sonner";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Image as ImageIcon,
  X,
} from "lucide-react";

interface Post {
  id: string;
  content: string;
  type: string;
  mediaUrl?: string;
  mediaType?: string;
  approvalStatus: string;
  createdAt: string;
  views: number;
  likes: number;
  commentCount: number;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
}

export const Posts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const statusOptions = [
    { value: "all", label: "All Posts", color: "bg-gray-100 text-gray-800" },
    {
      value: "pending",
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "approved",
      label: "Approved",
      color: "bg-green-100 text-green-800",
    },
    { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
  ];

  useEffect(() => {
    fetchPosts();
  }, [currentPage, filterStatus]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "DESC",
      };

      if (filterStatus !== "all") {
        params.approvalStatus = filterStatus;
      }

      const response = await postsAPI.getPosts(params);
      const postsData = response.data?.posts || [];
      const pagination = response.data?.pagination || {};

      setPosts(Array.isArray(postsData) ? postsData : []);
      setTotalPages(pagination.pages || 1);
      setTotalPosts(pagination.total || 0);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePost = async (postId: string) => {
    try {
      await postsAPI.approvePost(postId, "approve");
      toast.success("Post approved successfully");
      fetchPosts();
    } catch (error) {
      console.error("Error approving post:", error);
      toast.error("Failed to approve post");
    }
  };

  const handleRejectPost = async (postId: string, reason: string) => {
    try {
      await postsAPI.approvePost(postId, "reject", reason);
      toast.success("Post rejected successfully");
      fetchPosts();
    } catch (error) {
      console.error("Error rejecting post:", error);
      toast.error("Failed to reject post");
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status);
    return statusOption?.color || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to get the correct URL for images
  const getImageUrl = (mediaUrl: string): string => {
    // If the URL is already absolute (starts with http/https), return it as-is
    if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
      return mediaUrl;
    }

    // For relative paths, prepend the API base URL
    const baseUrl =
      import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
      "http://localhost:3000";
    return `${baseUrl}${mediaUrl}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
          <p className="mt-2 text-gray-600">Manage and moderate user posts</p>
        </div>
        <div className="text-sm text-gray-500">Total: {totalPosts} posts</div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search posts by content or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-transparent"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading posts...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900 truncate">
                          {post.content.length > 100
                            ? post.content.substring(0, 100) + "..."
                            : post.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Type: {post.type}
                        </p>
                        {/* Image Preview */}
                        {post.type === "image" && post.mediaUrl && (
                          <div className="mt-2">
                            <div
                              className="relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() =>
                                setSelectedImage(getImageUrl(post.mediaUrl!))
                              }
                            >
                              <img
                                src={getImageUrl(post.mediaUrl)}
                                alt="Post preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-white" />
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Click to view
                            </p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {post.author.firstName} {post.author.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {post.author.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          post.approvalStatus
                        )}`}
                      >
                        {getStatusIcon(post.approvalStatus)}
                        <span className="ml-1 capitalize">
                          {post.approvalStatus}
                        </span>
                      </span>
                      {post.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">
                          Reason: {post.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-4">
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {post.views}
                        </div>
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          {post.likes}
                        </div>
                        <div className="flex items-center">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {post.commentCount}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {post.approvalStatus === "pending" && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprovePost(post.id)}
                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Rejection reason:");
                              if (reason) {
                                handleRejectPost(post.id, reason);
                              }
                            }}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {post.approvalStatus === "approved" && (
                        <span className="text-green-600 text-xs">
                          Approved{" "}
                          {post.approvedAt && formatDate(post.approvedAt)}
                        </span>
                      )}
                      {post.approvalStatus === "rejected" && (
                        <span className="text-red-600 text-xs">Rejected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page{" "}
                  <span className="font-medium">{currentPage}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
            <img
              src={selectedImage}
              alt="Post image preview"
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                toast.error("Failed to load image");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Calendar,
  Award,
  UserCheck,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { dashboardAPI } from "../lib/api";
import { toast } from "sonner";

interface DashboardStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalPosts: number;
    pendingPosts: number;
    totalSponsors: number;
    totalConnections: number;
    totalChats: number;
    totalMessages: number;
    totalCheckIns: number;
    uniqueCheckInUsers: number;
  };
  usersByType: Array<{ userType: string; count: number }>;
  usersByPassType: Array<{ passType: string; count: number }>;
  recentUsers: Array<any>;
  recentPosts: Array<any>;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };


  const statsCards = stats
    ? [
        {
          name: "Total Users",
          value: stats.overview.totalUsers?.toString() || "0",
          change: "+12%",
          changeType: "positive",
          icon: Users,
        },
        {
          name: "Active Users",
          value: stats.overview.activeUsers?.toString() || "0",
          change: "+8%",
          changeType: "positive",
          icon: UserCheck,
        },
        {
          name: "Total Posts",
          value: stats.overview.totalPosts?.toString() || "0",
          change: "+15%",
          changeType: "positive",
          icon: FileText,
        },
        {
          name: "Pending Posts",
          value: stats.overview.pendingPosts?.toString() || "0",
          change: "+5%",
          changeType: "positive",
          icon: Calendar,
        },
        {
          name: "Total Connections",
          value: stats.overview.totalConnections?.toString() || "0",
          change: "+22%",
          changeType: "positive",
          icon: Award,
        },
        {
          name: "Check-ins Today",
          value: stats.overview.totalCheckIns?.toString() || "0",
          change: "+18%",
          changeType: "positive",
          icon: Calendar,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to the Networking Georgia admin dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-500">
              Loading dashboard data...
            </span>
          </div>
        ) : (
          statsCards.map((stat, index) => (
            <div
              key={stat.name}
              className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div
                      className={`p-3 rounded-lg ${
                        index === 0
                          ? "bg-blue-50"
                          : index === 1
                          ? "bg-green-50"
                          : index === 2
                          ? "bg-purple-50"
                          : index === 3
                          ? "bg-orange-50"
                          : index === 4
                          ? "bg-yellow-50"
                          : "bg-gray-50"
                      }`}
                    >
                      <stat.icon
                        className={`h-6 w-6 ${
                          index === 0
                            ? "text-blue-600"
                            : index === 1
                            ? "text-green-600"
                            : index === 2
                            ? "text-purple-600"
                            : index === 3
                            ? "text-orange-600"
                            : index === 4
                            ? "text-yellow-600"
                            : "text-gray-600"
                        }`}
                      />
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-600 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-bold text-gray-900">
                          {stat.value}
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          {stat.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Additional Statistics Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User Type Distribution */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <div className="px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              User Type Distribution
            </h3>
            <div className="space-y-4">
              {stats?.usersByType.map((item, index) => (
                <div
                  key={item.userType}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        index === 0
                          ? "bg-blue-500"
                          : index === 1
                          ? "bg-green-500"
                          : index === 2
                          ? "bg-purple-500"
                          : index === 3
                          ? "bg-orange-500"
                          : index === 4
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }`}
                    ></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {item.userType}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 font-semibold">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pass Type Distribution */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <div className="px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Pass Type Distribution
            </h3>
            <div className="space-y-4">
              {stats?.usersByPassType.map((item, index) => (
                <div
                  key={item.passType}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        index === 0
                          ? "bg-emerald-500"
                          : index === 1
                          ? "bg-indigo-500"
                          : index === 2
                          ? "bg-rose-500"
                          : "bg-gray-500"
                      }`}
                    ></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {item.passType.replace("_", " ")}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 font-semibold">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Post Approval Status */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <div className="px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Post Approval Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Pending
                  </span>
                </div>
                <span className="text-sm text-gray-600 font-semibold">
                  {stats?.overview.pendingPosts || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Approved
                  </span>
                </div>
                <span className="text-sm text-gray-600 font-semibold">
                  {(stats?.overview.totalPosts || 0) -
                    (stats?.overview.pendingPosts || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Rejected
                  </span>
                </div>
                <span className="text-sm text-gray-600 font-semibold">0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Activity */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <div className="px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Platform Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Total Connections
                  </span>
                </div>
                <span className="text-sm text-gray-600 font-semibold">
                  {stats?.overview.totalConnections || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-purple-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Active Chats
                  </span>
                </div>
                <span className="text-sm text-gray-600 font-semibold">
                  {stats?.overview.totalChats || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-orange-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Messages Sent
                  </span>
                </div>
                <span className="text-sm text-gray-600 font-semibold">
                  {stats?.overview.totalMessages || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Check-in Statistics */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <div className="px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Event Check-ins
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Total Check-ins
                  </span>
                </div>
                <span className="text-sm text-gray-600 font-semibold">
                  {stats?.overview.totalCheckIns || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserCheck className="h-5 w-5 text-blue-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Unique Users
                  </span>
                </div>
                <span className="text-sm text-gray-600 font-semibold">
                  {stats?.overview.uniqueCheckInUsers || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-purple-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Engagement Rate
                  </span>
                </div>
                <span className="text-sm text-gray-600 font-semibold">
                  {stats?.overview.totalUsers
                    ? Math.round(
                        (stats.overview.totalCheckIns /
                          stats.overview.totalUsers) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100">
        <div className="px-6 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {/* Recent Users */}
            {stats?.recentUsers.slice(0, 3).map((user, index) => (
              <div
                key={user.id}
                className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      New user registered:{" "}
                      <span className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </span>
                    </p>
                    <span className="text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {user.email} • {user.userType}
                  </p>
                </div>
              </div>
            ))}

            {/* Recent Posts */}
            {stats?.recentPosts.slice(0, 2).map((post, index) => (
              <div
                key={post.id}
                className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      post.approvalStatus === "pending"
                        ? "bg-yellow-100"
                        : post.approvalStatus === "approved"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    <FileText
                      className={`h-5 w-5 ${
                        post.approvalStatus === "pending"
                          ? "text-yellow-600"
                          : post.approvalStatus === "approved"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      New post created:{" "}
                      <span className="font-medium text-gray-900">
                        "
                        {post.content.length > 30
                          ? post.content.substring(0, 30) + "..."
                          : post.content}
                        "
                      </span>
                    </p>
                    <span className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    by {post.author.firstName} {post.author.lastName} •
                    <span
                      className={`ml-1 ${
                        post.approvalStatus === "pending"
                          ? "text-yellow-600"
                          : post.approvalStatus === "approved"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {post.approvalStatus}
                    </span>
                  </p>
                </div>
              </div>
            ))}

            {/* Show message if no recent activity */}
            {!stats?.recentUsers.length && !stats?.recentPosts.length && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity to display</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

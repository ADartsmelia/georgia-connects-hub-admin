import { useState, useEffect } from "react";
import { QrCode, Filter, Download, Eye } from "lucide-react";
import axios from "axios";
import { config } from "../config/environment";

interface QRCodeItem {
  id: string;
  code: string;
  passType: "day_pass" | "full_pass";
  userId: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  status: "active" | "used" | "expired";
  scannedAt: string | null;
  scannedBy: string | null;
  scanner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
}

interface Stats {
  total: number;
  active: number;
  used: number;
  expired: number;
}

export default function QRManagement() {
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "used" | "expired">(
    "all"
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchQRCodes();
    fetchStats();
  }, [filter, page]);

  const fetchQRCodes = async () => {
    try {
      const token = localStorage.getItem("admin_auth_token");
      const url =
        filter === "all"
          ? `${config.API_URL}/qr/all?page=${page}`
          : `${config.API_URL}/qr/all?status=${filter}&page=${page}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setQrCodes(response.data.data.qrCodes);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("admin_auth_token");
      const response = await axios.get(`${config.API_URL}/qr/stats/overview`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Code",
      "Pass Type",
      "Status",
      "User Email",
      "User Name",
      "Created At",
      "Scanned At",
      "Scanned By",
    ];
    const rows = qrCodes.map((qr) => [
      qr.code,
      qr.passType === "day_pass" ? "Day Pass" : "Full Pass",
      qr.status,
      qr.user?.email || "N/A",
      qr.user ? `${qr.user.firstName} ${qr.user.lastName}` : "N/A",
      new Date(qr.createdAt).toLocaleString(),
      qr.scannedAt ? new Date(qr.scannedAt).toLocaleString() : "N/A",
      qr.scanner ? `${qr.scanner.firstName} ${qr.scanner.lastName}` : "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-codes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <QrCode className="w-7 h-7" />
          QR Code Management
        </h1>
        <p className="text-gray-600 mt-1">
          View and manage all generated QR codes
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Total QR Codes</div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.total}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4">
            <div className="text-sm text-green-600 mb-1">Active</div>
            <div className="text-3xl font-bold text-green-700">
              {stats.active}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4">
            <div className="text-sm text-blue-600 mb-1">Used</div>
            <div className="text-3xl font-bold text-blue-700">{stats.used}</div>
          </div>
          <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Expired</div>
            <div className="text-3xl font-bold text-gray-700">
              {stats.expired}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Export */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as any);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>
      </div>

      {/* QR Codes Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : qrCodes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No QR codes found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pass Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scanned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scanned By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {qrCodes.map((qr) => (
                    <tr key={qr.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-gray-900">
                          {qr.code.substring(0, 16)}...
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            qr.passType === "full_pass"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {qr.passType === "day_pass" ? "🎫 Day" : "🎟️ Full"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            qr.status === "active"
                              ? "bg-green-100 text-green-800"
                              : qr.status === "used"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {qr.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {qr.user ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {qr.user.firstName} {qr.user.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {qr.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(qr.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {qr.scannedAt
                          ? new Date(qr.scannedAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        {qr.scanner ? (
                          <div className="text-sm text-gray-900">
                            {qr.scanner.firstName} {qr.scanner.lastName}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

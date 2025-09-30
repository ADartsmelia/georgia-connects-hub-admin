import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, RefreshCw, QrCode, Upload } from "lucide-react";
import axios from "axios";
import { config } from "../config/environment";
import { toast } from "sonner";

interface QRData {
  id: string;
  code: string;
  passType: "day_pass" | "full_pass";
  userId: string | null;
  firstName?: string;
  lastName?: string;
  status: "active" | "used";
  createdAt: string;
  s3Url?: string;
}

export default function QRGenerator() {
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [passType, setPassType] = useState<"day_pass" | "full_pass">(
    "day_pass"
  );

  const generateQRCode = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("admin_auth_token");
      const response = await axios.post(
        `${config.API_URL}/qr/generate`,
        {
          userEmail: userEmail || undefined,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          passType: passType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const qrData = response.data.data;
      setQrData(qrData);

      // Generate PNG and upload to S3
      await uploadQRToS3(qrData.code);

      toast.success("QR code generated and uploaded to S3!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate QR code");
      console.error("Error generating QR code:", err);
    } finally {
      setLoading(false);
    }
  };

  const uploadQRToS3 = async (qrCode: string) => {
    try {
      // Convert SVG to PNG
      const svg = document.getElementById("qr-code-svg");
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      return new Promise<void>((resolve, reject) => {
        img.onload = async () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          // Convert to PNG blob
          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error("Failed to convert to PNG"));
              return;
            }

            try {
              // Upload to backend which will handle S3 upload
              const token = localStorage.getItem("admin_auth_token");
              const formData = new FormData();
              formData.append("qrCode", qrCode);
              formData.append("image", blob, `qr-${qrCode}.png`);

              const response = await axios.post(
                `${config.API_URL}/qr/upload-to-s3`,
                formData,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                  },
                }
              );

              // Update QR data with S3 URL
              setQrData((prev) =>
                prev ? { ...prev, s3Url: response.data.s3Url } : null
              );
              toast.success("QR code uploaded to S3!");
              resolve();
            } catch (error) {
              console.error("Error uploading to S3:", error);
              reject(error);
            }
          }, "image/png");
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
      });
    } catch (error) {
      console.error("Error uploading QR to S3:", error);
      throw error;
    }
  };

  const downloadQRCode = () => {
    if (!qrData) return;

    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-code-${qrData.code}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();

      toast.success("QR code downloaded!");
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <QrCode className="w-7 h-7" />
          QR Code Generator
        </h1>
        <p className="text-gray-600 mt-1">
          Generate unique QR codes for Georgia Connects Hub
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Pass Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Pass Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPassType("day_pass")}
              className={`p-4 rounded-lg border-2 transition-all ${
                passType === "day_pass"
                  ? "border-blue-600 bg-blue-50 text-blue-900"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">🎫</div>
                <div className="font-semibold">Day Pass</div>
                <div className="text-xs text-gray-500 mt-1">
                  Single day access
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPassType("full_pass")}
              className={`p-4 rounded-lg border-2 transition-all ${
                passType === "full_pass"
                  ? "border-blue-600 bg-blue-50 text-blue-900"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">🎟️</div>
                <div className="font-semibold">Full Pass</div>
                <div className="text-xs text-gray-500 mt-1">
                  Full event access
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* User Email Input */}
        <div className="mb-6">
          <label
            htmlFor="userEmail"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            User Email (Optional)
          </label>
          <input
            id="userEmail"
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
          <p className="mt-1 text-sm text-gray-500">
            Leave empty to generate a generic QR code
          </p>
        </div>

        {/* Name Fields */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Attendee Information (Optional)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            These will be displayed when the QR code is scanned
          </p>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateQRCode}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <QrCode className="w-5 h-5" />
              Generate QR Code
            </>
          )}
        </button>

        {/* QR Code Display */}
        {qrData && (
          <div className="mt-8 space-y-6">
            <div className="border-t border-gray-200 pt-6">
              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={qrData.code}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* QR Code Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Pass Type:
                  </span>
                  <span className="text-sm font-semibold text-blue-600 flex items-center gap-1">
                    {qrData.passType === "day_pass"
                      ? "🎫 Day Pass"
                      : "🎟️ Full Pass"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Code:
                  </span>
                  <span className="text-sm text-gray-900 font-mono break-all">
                    {qrData.code}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Status:
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      qrData.status === "active"
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {qrData.status.toUpperCase()}
                  </span>
                </div>
                {(qrData.firstName || qrData.lastName) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Attendee:
                    </span>
                    <span className="text-sm text-gray-900 font-semibold">
                      {qrData.firstName} {qrData.lastName}
                    </span>
                  </div>
                )}
                {qrData.userId && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      User ID:
                    </span>
                    <span className="text-sm text-gray-900 font-mono">
                      {qrData.userId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Created:
                  </span>
                  <span className="text-sm text-gray-900">
                    {new Date(qrData.createdAt).toLocaleString()}
                  </span>
                </div>
                {qrData.s3Url && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      S3 URL:
                    </span>
                    <a
                      href={qrData.s3Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      View Image
                    </a>
                  </div>
                )}
              </div>

              {/* Download Button */}
              <button
                onClick={downloadQRCode}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download QR Code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

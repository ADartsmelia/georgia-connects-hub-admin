import { useState, useEffect } from "react";
import {
  QrCode,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Camera,
  X,
} from "lucide-react";
import axios from "axios";
import { config } from "../config/environment";
import QrScanner from "react-qr-scanner";

interface QRScanResult {
  id: string;
  code: string;
  passType: "day_pass" | "full_pass";
  userId: string | null;
  firstName?: string;
  lastName?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  } | null;
  status: "active" | "used" | "expired";
  scannedAt: string;
  createdAt: string;
  scanner?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export default function QRScanner() {
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
    data?: QRScanResult;
  } | null>(null);

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!qrCode.trim()) {
      setResult({
        success: false,
        message: "Please enter a QR code",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem("admin_auth_token");
      const response = await axios.post(
        `${config.API_URL}/qr/scan`,
        { code: qrCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResult({
        success: true,
        message: response.data.message,
        details: response.data.details,
        data: response.data.data,
      });

      // Clear input and close camera after successful scan
      setQrCode("");
      setCameraActive(false);
    } catch (error: any) {
      setResult({
        success: false,
        message:
          error.response?.data?.message ||
          "❌ Scan Failed - Unable to validate QR code",
        details:
          error.response?.data?.details ||
          "Please check your connection and try again.",
        data: error.response?.data?.data,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCameraScan = async (data: any) => {
    if (data && data.text && !loading) {
      const scannedCode = data.text;
      setQrCode(scannedCode);
      setCameraActive(false);

      // Auto-submit immediately
      setLoading(true);
      setResult(null);

      try {
        const token = localStorage.getItem("admin_auth_token");
        const response = await axios.post(
          `${config.API_URL}/qr/scan`,
          { code: scannedCode },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setResult({
          success: true,
          message: response.data.message,
          details: response.data.details,
          data: response.data.data,
        });
      } catch (error: any) {
        setResult({
          success: false,
          message:
            error.response?.data?.message ||
            "❌ Scan Failed - Unable to validate QR code",
          details:
            error.response?.data?.details ||
            "Please check your connection and try again.",
          data: error.response?.data?.data,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCameraError = (err: any) => {
    console.error("Camera error:", err);
    setCameraError(
      "Failed to access camera. Please check permissions or use manual input."
    );
    setCameraActive(false);
  };

  const toggleCamera = () => {
    setCameraActive(!cameraActive);
    setCameraError(null);
    setResult(null);
  };

  const scanNext = () => {
    setResult(null);
    setQrCode("");
    setCameraActive(true);
    setCameraError(null);
  };

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <QrCode className="w-6 h-6 sm:w-7 sm:h-7" />
          QR Code Scanner
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Scan QR codes to validate and mark them as used
        </p>
      </div>

      {/* Camera Scanner */}
      {cameraActive && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Camera Scanner</span>
              <span className="sm:hidden">Scanner</span>
              {loading && (
                <span className="flex items-center gap-1 text-xs sm:text-sm text-blue-600">
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  <span className="hidden sm:inline">Processing...</span>
                </span>
              )}
            </h2>
            <button
              onClick={toggleCamera}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              disabled={loading}
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div
            className="relative bg-black rounded-lg overflow-hidden w-full"
            style={{ maxWidth: "500px", margin: "0 auto", aspectRatio: "1/1" }}
          >
            {loading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <div className="text-white text-center px-4">
                  <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin mx-auto mb-2" />
                  <p className="text-xs sm:text-sm">Validating QR code...</p>
                </div>
              </div>
            )}
            <QrScanner
              delay={300}
              onError={handleCameraError}
              onScan={handleCameraScan}
              style={{ width: "100%", height: "100%" }}
              constraints={{
                video: { facingMode: "environment" },
              }}
            />
          </div>

          <div className="mt-3 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Position the QR code within the camera view
            </p>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
              Camera Active
            </div>
          </div>
        </div>
      )}

      {/* Camera Error */}
      {cameraError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">{cameraError}</div>
          </div>
        </div>
      )}

      {/* Start Scanning Button */}
      {!cameraActive && !result && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 mb-4 sm:mb-6 text-center">
          <Camera className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Ready to Scan
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Click the button below to start scanning QR codes
          </p>
          <button
            onClick={toggleCamera}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-base sm:text-lg"
          >
            <Camera className="w-5 h-5" />
            Start Camera Scanner
          </button>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div
          className={`rounded-lg border-2 p-4 sm:p-6 ${
            result.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-0.5" />
            )}

            <div className="flex-1">
              <h3
                className={`font-bold text-xl mb-3 ${
                  result.success ? "text-green-900" : "text-red-900"
                }`}
              >
                {result.success ? "✓ Valid QR Code" : "✗ Invalid QR Code"}
              </h3>

              <div
                className={`text-base mb-2 p-3 rounded-lg ${
                  result.success
                    ? "bg-green-100 text-green-900"
                    : "bg-red-100 text-red-900"
                }`}
              >
                {result.message}
              </div>

              {result.details && (
                <div
                  className={`text-sm mb-4 p-3 rounded-lg border ${
                    result.success
                      ? "bg-green-50 text-green-800 border-green-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  {result.details}
                </div>
              )}

              {/* Quick Summary for Successful Scans */}
              {result.success && result.data && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 mb-4">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Scan Summary
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Pass Type:</span>
                      <span
                        className={`font-semibold px-2 py-1 rounded-full text-xs ${
                          result.data.passType === "full_pass"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {result.data.passType === "day_pass"
                          ? "🎫 Day Pass"
                          : "🎟️ Full Pass"}
                      </span>
                    </div>
                    {result.data.user && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">User:</span>
                        <span className="font-medium text-gray-900">
                          {result.data.user.firstName}{" "}
                          {result.data.user.lastName}
                        </span>
                      </div>
                    )}
                    {(result.data.firstName || result.data.lastName) &&
                      !result.data.user && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Attendee:</span>
                          <span className="font-medium text-gray-900">
                            {result.data.firstName} {result.data.lastName}
                          </span>
                        </div>
                      )}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-semibold text-green-600">
                        {result.data.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Scanned:</span>
                      <span className="text-gray-900">
                        {new Date(result.data.scannedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Show scanner info for already used codes */}
              {!result.success && result.data?.scanner && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mb-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">
                    Previously Scanned By:
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Admin:</span>
                      <span className="font-medium text-yellow-900">
                        {result.data.scanner.firstName}{" "}
                        {result.data.scanner.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Email:</span>
                      <span className="font-medium text-yellow-900">
                        {result.data.scanner.email}
                      </span>
                    </div>
                    {result.data.scannedAt && (
                      <div className="flex justify-between">
                        <span className="text-yellow-700">Time:</span>
                        <span className="font-medium text-yellow-900">
                          {new Date(result.data.scannedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.data && result.success && (
                <div className="space-y-4 mt-4">
                  {/* Pass Type Badge - Enhanced */}
                  <div className="text-center">
                    <div
                      className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-lg shadow-lg ${
                        result.data.passType === "full_pass"
                          ? "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-900 border-2 border-purple-400"
                          : "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 border-2 border-blue-400"
                      }`}
                    >
                      <span className="text-2xl">
                        {result.data.passType === "day_pass" ? "🎫" : "🎟️"}
                      </span>
                      <div className="text-center">
                        <div className="text-xl">
                          {result.data.passType === "day_pass"
                            ? "Day Pass"
                            : "Full Pass"}
                        </div>
                        <div className="text-sm font-normal opacity-80">
                          {result.data.passType === "day_pass"
                            ? "Single Day Access"
                            : "Full Event Access"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Info */}
                  {result.data.user && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        User Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium text-gray-900">
                            {result.data.user.firstName}{" "}
                            {result.data.user.lastName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium text-gray-900">
                            {result.data.user.email}
                          </span>
                        </div>
                        {result.data.user.phoneNumber && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Phone:</span>
                            <span className="font-medium text-gray-900">
                              {result.data.user.phoneNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Attendee Info (when no linked user but has firstName/lastName) */}
                  {(result.data.firstName || result.data.lastName) &&
                    !result.data.user && (
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Attendee Information
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Name:</span>
                            <span className="font-medium text-gray-900">
                              {result.data.firstName} {result.data.lastName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span className="font-medium text-gray-900">
                              Guest Attendee
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* QR Code Info */}
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <QrCode className="w-5 h-5" />
                      QR Code Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Pass Type:</span>
                        <span
                          className={`font-semibold px-2 py-1 rounded-full text-xs ${
                            result.data.passType === "full_pass"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {result.data.passType === "day_pass"
                            ? "🎫 Day Pass"
                            : "🎟️ Full Pass"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Code:</span>
                        <span className="font-mono text-gray-900 text-xs bg-gray-100 px-2 py-1 rounded">
                          {result.data.code}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-semibold text-green-600">
                          {result.data.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="text-gray-900">
                          {new Date(result.data.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Scanned:</span>
                        <span className="text-gray-900">
                          {new Date(result.data.scannedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scan Next Button */}
          <div className="mt-4 sm:mt-6 flex gap-3">
            <button
              onClick={scanNext}
              className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 sm:px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
            >
              <Camera className="w-5 h-5" />
              <span className="hidden sm:inline">Scan Next QR Code</span>
              <span className="sm:hidden">Scan Next</span>
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!result && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 sm:p-4 mt-4 sm:mt-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-900">
              <p className="font-semibold mb-1">How to scan:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Click "Start Camera Scanner" to begin</li>
                <li>Point camera at QR code</li>
                <li>Code will be automatically validated</li>
                <li>Click "Scan Next" to scan another code</li>
                <li className="hidden sm:list-item">
                  Each QR code can only be scanned once
                </li>
              </ul>
              <p className="mt-2 text-xs text-blue-700">
                💡 Tip: Use the rear camera for better scanning
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

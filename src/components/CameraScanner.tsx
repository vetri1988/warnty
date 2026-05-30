import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Upload, Check, Sparkles, Smartphone } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface CameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export default function CameraScanner({ isOpen, onClose, onScanSuccess }: CameraScannerProps) {
  const [initError, setInitError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [qrScanner, setQrScanner] = useState<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [fileScanError, setFileScanError] = useState<string | null>(null);
  const [fileScanning, setFileScanning] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start scanner when opened, release when closed
  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    // Small timeout ensures the DOM renders container #scanner-view before initialization
    const timer = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [isOpen, selectedCameraId]);

  const cleanup = async () => {
    if (qrScanner) {
      try {
        if (qrScanner.isScanning) {
          await qrScanner.stop();
        }
      } catch (err) {
        console.warn("Non-fatal error stopping scan container:", err);
      }
    }
    setInitError(null);
    setFileScanError(null);
    setIsScanning(false);
  };

  const handleCameraChange = async (cameraId: string) => {
    setSelectedCameraId(cameraId);
  };

  const startScanner = async () => {
    try {
      setInitError(null);
      setFileScanError(null);
      const scannerEl = document.getElementById('scanner-view');
      if (!scannerEl) return;

      // Instantiate local qrcode scanner
      const scanner = new Html5Qrcode('scanner-view');
      setQrScanner(scanner);

      // Attempt to retrieve hardware camera sources
      let cameraList: any[] = [];
      try {
        cameraList = await Html5Qrcode.getCameras();
        setCameras(cameraList);
      } catch (error) {
        console.warn("Direct camera discovery rejected. Falling back to environment camera:", error);
      }

      // Configure scan constraints optimized for barcode / serial scanning (wide rectangle)
      const scanConfig = {
        fps: 24,
        qrbox: (width: number, height: number) => {
          return {
            width: Math.min(width * 0.90, 320),
            height: Math.min(height * 0.45, 110)
          };
        },
        aspectRatio: 1.777778
      };

      // Select camera: user preferred, else fallback to backward-facing camera standard (environment)
      const cameraSource = selectedCameraId 
        ? selectedCameraId 
        : { facingMode: 'environment' };

      await scanner.start(
        cameraSource,
        scanConfig,
        (decodedText) => {
          onScanSuccess(decodedText.trim().toUpperCase());
          cleanup();
        },
        () => {
          // Silent frame parses are normal, ignore
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error("Camera scan startup error:", err);
      setInitError(
        err?.message || 
        "Camera stream blocked. Ensure camera permissions are allowed in your browser settings, or swap to dynamic image file upload."
      );
      setIsScanning(false);
    }
  };

  // Trigger barcode scanning on an uploaded local image file (failsafe fallback)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileScanError(null);
    setFileScanning(true);

    try {
      const fileScanner = new Html5Qrcode('scanner-view-placeholder', { verbose: false });
      
      const text = await fileScanner.scanFile(file, true);
      onScanSuccess(text.trim().toUpperCase());
      cleanup();
    } catch (err: any) {
      console.error("Image file barcode resolve failure:", err);
      setFileScanError("Unable to decode barcode from image. Make sure the code is centered, well-lit, and in-focus.");
    } finally {
      setFileScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-scale-up">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer z-20"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center gap-2">
          <Camera className="w-5 h-5 text-sky-400 animate-pulse" />
          <div className="text-left">
            <h3 className="font-bold text-sm font-display tracking-tight text-white m-0">Live Camera Barcode Scanner</h3>
            <p className="text-[10px] text-slate-300">Point mobile back camera at the serial number sticker</p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* Main Visual Scanning Frame Container */}
          <div className="relative bg-slate-950 aspect-[4/3] rounded-2.5xl overflow-hidden border-2 border-slate-900 flex flex-col items-center justify-center">
            
            {/* Target overlay guide */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-4 border-l-4 border-sky-400 rounded-tl-md"></div>
                  <div className="w-5 h-5 border-t-4 border-r-4 border-sky-400 rounded-tr-md"></div>
                </div>
                
                {/* Horizontal scanner trace animation */}
                <div className="w-full bg-linear-to-r from-transparent via-sky-400/50 to-transparent h-0.5 relative">
                  <div className="absolute inset-0 bg-sky-400 animate-pulse shadow-[0_0_8px_#38bdf8]"></div>
                </div>

                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-4 border-l-4 border-sky-400 rounded-bl-md"></div>
                  <div className="w-5 h-5 border-b-4 border-r-4 border-sky-400 rounded-br-md"></div>
                </div>
              </div>
            )}

            {/* Html5Qrcode target hook element */}
            <div id="scanner-view" className="w-full h-full [&>video]:object-cover" />

            {/* Hidden hook for scanning files */}
            <div id="scanner-view-placeholder" className="hidden" />

            {/* Inactive or Error States overlays */}
            {!isScanning && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-3">
                {initError ? (
                  <>
                    <AlertCircle className="w-8 h-8 text-rose-500 animate-bounce" />
                    <p className="text-[11px] text-slate-300 font-semibold leading-relaxed max-w-sm">
                      {initError}
                    </p>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
                    <p className="text-[11px] text-slate-300">Waking up mobile camera lens...</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Camera selector and Switch controls */}
          {cameras.length > 1 && isScanning && (
            <div className="flex items-center gap-1.5 justify-start bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Active Lens:</span>
              <select
                value={selectedCameraId}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="bg-white border border-slate-200 text-[11px] font-medium outline-none rounded-lg px-2 py-1 max-w-[200px] flex-1 text-slate-700"
              >
                {cameras.map((c, idx) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Alternative upload fallback if camera access fails or is bypassed or preferred */}
          <div className="border-t border-dashed border-slate-250 pt-4 space-y-2.5 text-left">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
              Alternative Web Method
            </span>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment" // Permits mobile device to launch camera as a camera capturing/taking file directly!
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={fileScanning}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 px-4 py-2.5 rounded-xl font-bold text-slate-700 cursor-pointer transition-colors"
              >
                {fileScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-600" /> Scanning Image...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-slate-500" /> Upload Barcode Photo or Snap Camera
                  </>
                )}
              </button>
              {fileScanError && (
                <div className="flex gap-1.5 text-[11px] bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded-xl leading-relaxed items-start">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{fileScanError}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl cursor-pointer transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={() => {
              cleanup();
              setTimeout(() => {
                startScanner();
              }, 150);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
          </button>
        </div>

      </div>
    </div>
  );
}

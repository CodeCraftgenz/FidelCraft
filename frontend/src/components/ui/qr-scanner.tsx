import { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";

interface QrScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [hasBarcodeDetector] = useState(
    () => "BarcodeDetector" in window,
  );

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!hasBarcodeDetector) {
      setError(
        "Seu navegador nao suporta leitura de QR Code. Use Chrome ou Edge na versao mais recente.",
      );
      return;
    }

    let cancelled = false;
    const detector = new (window as any).BarcodeDetector({
      formats: ["qr_code"],
    });

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          scanLoop(detector);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Nao foi possivel acessar a camera. Verifique as permissoes do navegador.",
          );
        }
      }
    }

    function scanLoop(det: any) {
      if (cancelled || !videoRef.current) return;

      det
        .detect(videoRef.current)
        .then((barcodes: any[]) => {
          if (barcodes.length > 0) {
            const value = barcodes[0].rawValue;
            stopCamera();
            onScan(value);
            return;
          }
          if (!cancelled) {
            animationRef.current = requestAnimationFrame(() => scanLoop(det));
          }
        })
        .catch(() => {
          if (!cancelled) {
            animationRef.current = requestAnimationFrame(() => scanLoop(det));
          }
        });
    }

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [hasBarcodeDetector, onScan, stopCamera]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="relative w-full max-w-sm mx-4">
        {/* Close button */}
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute -top-12 right-0 p-2 text-zinc-400 hover:text-white transition"
        >
          <X className="h-6 w-6" />
        </button>

        {error ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
            <p className="text-zinc-400">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition"
            >
              Fechar
            </button>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              className="w-full aspect-square object-cover"
              playsInline
              muted
            />

            {/* Scanning frame overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Dimmed corners */}
              <div className="absolute inset-0 bg-black/40" />

              {/* Clear center area */}
              <div className="relative w-56 h-56">
                <div className="absolute inset-0 bg-transparent" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)" }} />

                {/* Animated corner borders */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-400 animate-pulse" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-400 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-400 animate-pulse" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-400 animate-pulse" />

                {/* Scan line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-emerald-400/60 animate-bounce" />
              </div>
            </div>

            <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-zinc-300">
              Aponte a camera para o QR Code
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

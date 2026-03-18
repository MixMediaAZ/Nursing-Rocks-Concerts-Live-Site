import { useEffect, useRef, useState, useCallback } from "react";
import { Helmet } from "react-helmet";
import { CheckCircle2, XCircle, AlertTriangle, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ScanResult =
  | { type: "valid"; name: string }
  | { type: "used"; name: string; message: string }
  | { type: "invalid"; message: string }
  | null;

const SCANNER_PIN = import.meta.env.VITE_SCANNER_PIN || "1234";
const AUTO_RESET_MS = 3500;

export default function ScanPage() {
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<any>(null);
  const scannerDivId = "nrpx-qr-scanner";
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/nrpx/stats");
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (authed) {
      fetchStats();
      const interval = setInterval(fetchStats, 15000);
      return () => clearInterval(interval);
    }
  }, [authed, fetchStats]);

  // Start scanner
  useEffect(() => {
    if (!authed || !scanning) return;

    let stopped = false;
    let html5QrCode: any = null;

    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        html5QrCode = new Html5Qrcode(scannerDivId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
          async (decodedText: string) => {
            if (processing || stopped) return;
            setProcessing(true);
            await verifyCode(decodedText.trim());
          },
          () => { /* scan failure — ignore */ }
        );
      } catch (err) {
        console.error("Scanner init error:", err);
        setScanning(false);
      }
    };

    initScanner();

    return () => {
      stopped = true;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current = null;
        });
      }
    };
  }, [authed, scanning]); // eslint-disable-line react-hooks/exhaustive-deps

  const verifyCode = async (code: string) => {
    try {
      const res = await fetch(`/api/nrpx/verify/${encodeURIComponent(code)}`);
      const data = await res.json();

      if (data.valid) {
        setResult({ type: "valid", name: data.name });
      } else if (data.alreadyUsed) {
        setResult({ type: "used", name: data.name, message: data.message });
      } else {
        setResult({ type: "invalid", message: data.message || "Ticket not found." });
      }

      fetchStats();
    } catch {
      setResult({ type: "invalid", message: "Network error. Please try again." });
    }

    // Auto-reset after delay
    resetTimerRef.current = setTimeout(() => {
      setResult(null);
      setProcessing(false);
    }, AUTO_RESET_MS);
  };

  const handleDismiss = () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setResult(null);
    setProcessing(false);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === SCANNER_PIN) {
      setAuthed(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  // PIN gate
  if (!authed) {
    return (
      <>
        <Helmet><title>NRPX Door Scanner</title></Helmet>
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
          <div className="w-full max-w-xs text-center space-y-6">
            <div>
              <div className="text-5xl mb-3">🎸</div>
              <h1 className="text-2xl font-bold text-white">NRPX Door Scanner</h1>
              <p className="text-gray-400 mt-1 text-sm">Enter volunteer PIN to continue</p>
            </div>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                autoFocus
                value={pinInput}
                onChange={e => { setPinInput(e.target.value); setPinError(false); }}
                className="w-full text-center text-3xl tracking-[0.5em] font-mono bg-gray-800 border-2 border-gray-600 text-white rounded-xl px-4 py-4 outline-none focus:border-blue-400"
                placeholder="••••"
              />
              {pinError && <p className="text-red-400 text-sm">Incorrect PIN. Try again.</p>}
              <Button type="submit" className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700">
                Unlock Scanner
              </Button>
            </form>
          </div>
        </div>
      </>
    );
  }

  // Result overlay
  if (result) {
    const isValid = result.type === "valid";
    const isUsed = result.type === "used";

    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-8 text-white text-center cursor-pointer select-none transition-colors ${
          isValid ? "bg-green-600" : isUsed ? "bg-orange-600" : "bg-red-700"
        }`}
        onClick={handleDismiss}
      >
        <div className="space-y-6">
          {isValid ? (
            <CheckCircle2 className="h-32 w-32 mx-auto opacity-90" />
          ) : isUsed ? (
            <AlertTriangle className="h-32 w-32 mx-auto opacity-90" />
          ) : (
            <XCircle className="h-32 w-32 mx-auto opacity-90" />
          )}

          <div>
            <p className="text-5xl font-black tracking-tight uppercase">
              {isValid ? "WELCOME" : isUsed ? "ALREADY IN" : "INVALID"}
            </p>
            {(result.type === "valid" || result.type === "used") && (
              <p className="text-3xl font-bold mt-3 opacity-90">{result.name}</p>
            )}
            {result.type === "used" && (
              <p className="text-xl mt-2 opacity-75">{result.message}</p>
            )}
            {result.type === "invalid" && (
              <p className="text-xl mt-3 opacity-80">{result.message}</p>
            )}
          </div>

          <p className="text-base opacity-60 mt-8">Tap to scan again</p>
        </div>

        {/* Stats bar */}
        <div className="absolute bottom-6 left-0 right-0 text-center opacity-70 text-sm">
          Checked in: {stats.checkedIn} / {stats.total} registered
        </div>
      </div>
    );
  }

  // Main scanner view
  return (
    <>
      <Helmet>
        <title>NRPX Door Scanner</title>
        <meta name="theme-color" content="#030712" />
      </Helmet>

      <div className="min-h-screen bg-gray-950 flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">NRPX Scanner</h1>
            <p className="text-gray-400 text-xs">Nursing Rocks Phoenix — May 16, 2026</p>
          </div>
          <div className="text-right">
            <p className="text-green-400 font-bold text-lg">{stats.checkedIn}</p>
            <p className="text-gray-400 text-xs">/ {stats.total} in</p>
          </div>
        </div>

        {/* Scanner area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          {!scanning ? (
            <div className="text-center space-y-4">
              <Camera className="h-20 w-20 text-gray-600 mx-auto" />
              <p className="text-gray-400 text-lg">Camera stopped</p>
              <Button
                onClick={() => setScanning(true)}
                className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-base"
              >
                Start Camera
              </Button>
            </div>
          ) : (
            <div className="w-full max-w-sm space-y-4">
              {/* QR scanner container */}
              <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: "1" }}>
                <div id={scannerDivId} className="w-full h-full" />
                {/* Scanning overlay corners */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                  <div className="absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                  <div className="absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                  <div className="absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                </div>
                {processing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                  </div>
                )}
              </div>

              <p className="text-center text-gray-400 text-sm">
                Hold QR code steady in the frame
              </p>

              <Button
                variant="outline"
                onClick={() => setScanning(false)}
                className="w-full border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
              >
                Stop Camera
              </Button>
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 text-center">
          <p className="text-gray-400 text-sm">
            <span className="text-green-400 font-semibold">{stats.checkedIn}</span> checked in ·{" "}
            <span className="text-gray-300 font-semibold">{stats.total - stats.checkedIn}</span> remaining ·{" "}
            <span className="text-gray-300 font-semibold">{stats.total}</span> total
          </p>
        </div>
      </div>
    </>
  );
}

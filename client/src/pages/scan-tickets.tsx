import { useEffect, useRef, useState, useCallback } from "react";
import { Helmet } from "react-helmet";
import { CheckCircle2, XCircle, AlertTriangle, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const GATE_TOKEN_KEY = "nr_gate_scanner_jwt";
const AUTO_EVENT = 0;

type ScanApiResult = {
  ok?: boolean;
  reason?: string;
  message?: string;
  ticketCode?: string;
  userName?: string;
};

type UiResult =
  | { kind: "ok"; ticketCode?: string; userName?: string }
  | { kind: "used"; message: string; userName?: string; ticketCode?: string }
  | { kind: "fail"; message: string }
  | null;

const AUTO_RESET_MS = 4000;

function getDeviceFingerprint(): string {
  try {
    let fp = sessionStorage.getItem("gate_device_fp");
    if (!fp) {
      fp = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `fp_${Date.now()}_${Math.random()}`;
      sessionStorage.setItem("gate_device_fp", fp);
    }
    return fp;
  } catch {
    return "fp_unknown";
  }
}

export default function ScanTicketsPage() {
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [gateToken, setGateToken] = useState<string | null>(() =>
    typeof sessionStorage !== "undefined" ? sessionStorage.getItem(GATE_TOKEN_KEY) : null
  );
  const [events, setEvents] = useState<Array<{ id: number; title: string }>>([]);
  const [selectedEventId, setSelectedEventId] = useState<number>(() => {
    const v = import.meta.env.VITE_GATE_DEFAULT_EVENT_ID;
    if (v) {
      const n = parseInt(String(v), 10);
      return Number.isFinite(n) && n > 0 ? n : AUTO_EVENT;
    }
    return AUTO_EVENT;
  });
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<UiResult>(null);
  const [processing, setProcessing] = useState(false);
  const [bluetoothInput, setBluetoothInput] = useState("");
  const processingRef = useRef(false);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const scannerDivId = "nr-gate-qr-scanner";
  const bluetoothInputRef = useRef<HTMLInputElement | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const authed = Boolean(gateToken);

  useEffect(() => {
    if (!authed) return;
    fetch("/api/events")
      .then((r) => r.json())
      .then((data: { id?: number; title?: string }[]) => {
        if (Array.isArray(data)) {
          setEvents(data.map((e) => ({ id: e.id as number, title: String(e.title ?? "Event") })));
        }
      })
      .catch(() => setEvents([]));
  }, [authed]);

  const persistToken = useCallback((token: string) => {
    sessionStorage.setItem(GATE_TOKEN_KEY, token);
    setGateToken(token);
  }, []);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(false);
    try {
      const res = await fetch("/api/gate/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) {
        setPinError(true);
        setPinInput("");
        return;
      }
      persistToken(data.token);
      setPinInput("");
    } catch {
      setPinError(true);
      setPinInput("");
    }
  };

  const signOutGate = () => {
    sessionStorage.removeItem(GATE_TOKEN_KEY);
    setGateToken(null);
    setScanning(false);
  };

  const verifyQr = useCallback(async (qrToken: string) => {
    if (!gateToken) return;
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    // Detect code type for logging
    const isQrCode = qrToken.length > 50 || qrToken.includes("%");
    const codeType = isQrCode ? "QR" : "Barcode";
    console.log(`✓ ${codeType} verified:`, qrToken.substring(0, 50));

    try {
      const body: { qrToken: string; eventId?: number; deviceFingerprint: string } = {
        qrToken,
        deviceFingerprint: getDeviceFingerprint(),
      };
      if (selectedEventId > 0) {
        body.eventId = selectedEventId;
      }

      const res = await fetch("/api/tickets/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${gateToken}`,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        sessionStorage.removeItem(GATE_TOKEN_KEY);
        setGateToken(null);
        setResult({ kind: "fail", message: "Session expired. Unlock again with PIN." });
        processingRef.current = false;
        setProcessing(false);
        resetTimerRef.current = setTimeout(() => {
          setResult(null);
        }, AUTO_RESET_MS);
        return;
      }

      const data = (await res.json().catch(() => ({}))) as ScanApiResult;

      if (data.ok) {
        setResult({
          kind: "ok",
          ticketCode: data.ticketCode,
          userName: data.userName,
        });
      } else if (data.reason === "already_used") {
        setResult({
          kind: "used",
          message: data.message || "Already checked in",
          userName: data.userName,
          ticketCode: data.ticketCode,
        });
      } else {
        setResult({
          kind: "fail",
          message: data.message || data.reason || "Invalid ticket",
        });
      }
    } catch {
      setResult({ kind: "fail", message: "Network error. Try again." });
    }

    resetTimerRef.current = setTimeout(() => {
      setResult(null);
      processingRef.current = false;
      setProcessing(false);
    }, AUTO_RESET_MS);
  }, [gateToken, selectedEventId]);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraRetries, setCameraRetries] = useState(0);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const maxRetries = 3;

  // Enumerate available cameras when authed
  useEffect(() => {
    if (!authed) return;
    let cancelled = false;

    const loadCameras = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const cameras = await Html5Qrcode.getCameras();
        if (cancelled) return;
        const list = (cameras || []).map((c: { id: string; label: string }) => ({
          id: c.id,
          label: c.label || `Camera ${c.id.substring(0, 6)}`,
        }));
        setAvailableCameras(list);
        // Auto-select rear camera if available, otherwise first
        if (list.length > 0 && !selectedCameraId) {
          const rear = list.find((c) =>
            /back|rear|environment/i.test(c.label)
          );
          setSelectedCameraId(rear?.id || list[0].id);
        }
      } catch (err) {
        console.warn("Could not enumerate cameras:", err);
      }
    };

    loadCameras();
    return () => {
      cancelled = true;
    };
  }, [authed, selectedCameraId]);

  useEffect(() => {
    if (!authed || !scanning) return;

    let stopped = false;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const initScanner = async () => {
      try {
        setCameraError(null);
        const { Html5Qrcode } = await import("html5-qrcode");
        const html5QrCode = new Html5Qrcode(scannerDivId);
        scannerRef.current = html5QrCode;

        // Check if camera access is available before starting
        try {
          await navigator.mediaDevices.enumerateDevices();
        } catch (checkErr) {
          throw new Error("Camera access not available on this device");
        }

        // Use selected camera ID if available, otherwise fallback to facingMode
        const cameraConfig = selectedCameraId
          ? { deviceId: { exact: selectedCameraId } }
          : { facingMode: "environment" };

        await html5QrCode.start(
          cameraConfig,
          { fps: 15, qrbox: { width: 280, height: 280 }, aspectRatio: 1.0 },
          async (decodedText: string) => {
            if (processingRef.current || stopped) return;
            console.log("✓ QR detected:", decodedText.trim());
            processingRef.current = true;
            setProcessing(true);
            await verifyQr(decodedText.trim());
          },
          (errorMsg: string) => {
            // Silent detection attempts are normal - only log critical errors
            if (errorMsg && !errorMsg.includes("NotFoundException")) {
              console.debug("QR scan attempt:", errorMsg);
            }
          }
        );
        setCameraRetries(0); // Reset retries on success
      } catch (err) {
        console.error("Scanner init error:", err);
        const errorMsg = err instanceof Error ? err.message : String(err);

        // Determine error type and user-friendly message
        let userMessage = "Camera error. ";
        if (errorMsg.includes("NotAllowedError") || errorMsg.includes("Permission denied")) {
          userMessage += "Please grant camera permission when prompted. Retry or use Bluetooth scanner.";
        } else if (errorMsg.includes("NotFoundError") || errorMsg.includes("not available")) {
          userMessage += "No camera found on device. Use Bluetooth scanner instead.";
          setCameraError(userMessage);
          setScanning(false);
          return;
        } else if (errorMsg.includes("NotReadableError")) {
          userMessage += "Camera is in use by another app. Close it and retry.";
        } else if (errorMsg.includes("SecurityError")) {
          userMessage += "HTTPS required for camera access. Check your connection.";
        } else {
          userMessage += "Retrying...";
        }

        setCameraError(userMessage);

        // Retry logic with exponential backoff
        if (cameraRetries < maxRetries && !stopped) {
          const delayMs = 1000 * (cameraRetries + 1);
          setCameraRetries(cameraRetries + 1);
          retryTimeout = setTimeout(() => {
            if (!stopped) {
              console.log(`Camera init retry ${cameraRetries + 1}/${maxRetries}`);
              initScanner();
            }
          }, delayMs);
        } else if (cameraRetries >= maxRetries) {
          setCameraError("Camera failed after retries. Use Bluetooth scanner or refresh page.");
          setScanning(false);
        }
      }
    };

    initScanner();

    return () => {
      stopped = true;
      clearTimeout(retryTimeout);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [authed, scanning, verifyQr, cameraRetries, selectedCameraId]);

  const handleDismiss = () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setResult(null);
    processingRef.current = false;
    setProcessing(false);
    // Refocus Bluetooth input after result clears
    setTimeout(() => bluetoothInputRef.current?.focus(), 100);
  };

  if (!authed) {
    return (
      <>
        <Helmet>
          <title>Door scanner | Nursing Rocks</title>
        </Helmet>
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
          <div className="w-full max-w-xs text-center space-y-6">
            <div>
              <div className="text-5xl mb-3">🎸</div>
              <h1 className="text-2xl font-bold text-white">Ticket scanner</h1>
              <p className="text-gray-400 mt-1 text-sm">Enter the 8-digit gate PIN</p>
            </div>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={12}
                autoComplete="off"
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, ""));
                  setPinError(false);
                }}
                className="w-full text-center text-3xl tracking-[0.3em] font-mono bg-gray-800 border-2 border-gray-600 text-white rounded-xl px-4 py-4 outline-none focus:border-blue-400"
                placeholder="••••••••"
                aria-label="Gate PIN"
              />
              {pinError && <p className="text-red-400 text-sm">Invalid PIN. Try again.</p>}
              <Button type="submit" className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700">
                Unlock scanner
              </Button>
            </form>
          </div>
        </div>
      </>
    );
  }

  if (result) {
    const ok = result.kind === "ok";
    const used = result.kind === "used";

    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-8 text-white text-center cursor-pointer select-none transition-colors ${
          ok ? "bg-green-600" : used ? "bg-orange-600" : "bg-red-700"
        }`}
        onClick={handleDismiss}
        onKeyDown={(e) => e.key === "Enter" && handleDismiss()}
        role="button"
        tabIndex={0}
      >
        <Helmet>
          <title>{ok ? "Welcome" : used ? "Already in" : "Invalid"} | Scanner</title>
        </Helmet>
        <div className="space-y-6 max-w-md">
          {ok ? (
            <CheckCircle2 className="h-28 w-28 mx-auto opacity-90" />
          ) : used ? (
            <AlertTriangle className="h-28 w-28 mx-auto opacity-90" />
          ) : (
            <XCircle className="h-28 w-28 mx-auto opacity-90" />
          )}

          <div>
            <p className="text-4xl sm:text-5xl font-black tracking-tight uppercase">
              {ok ? "Welcome" : used ? "Already in" : "Invalid"}
            </p>
            {(ok || used) && result.userName && (
              <p className="text-2xl sm:text-3xl font-bold mt-4 opacity-95 break-words">{result.userName}</p>
            )}
            {result.kind !== "fail" && result.ticketCode && (
              <p className="text-lg mt-2 font-mono opacity-90">{result.ticketCode}</p>
            )}
            {!ok && result.kind !== "used" && (
              <p className="text-lg mt-4 opacity-90">{result.message}</p>
            )}
            {result.kind === "used" && result.message && (
              <p className="text-base mt-3 opacity-85">{result.message}</p>
            )}
          </div>

          <p className="text-base opacity-60 mt-6">Tap to scan again</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Ticket scanner | Nursing Rocks</title>
        <meta name="theme-color" content="#030712" />
      </Helmet>

      <div className="min-h-screen bg-gray-950 flex flex-col">
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Nursing Rocks — Tickets</h1>
            <p className="text-gray-400 text-xs">Scan QR code, barcode, or enter ticket code</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 shrink-0"
            onClick={signOutGate}
          >
            Lock
          </Button>
        </div>

        {/* Hidden Bluetooth scanner input - captures scanner keystrokes */}
        <input
          ref={bluetoothInputRef}
          type="text"
          value={bluetoothInput}
          onChange={(e) => setBluetoothInput(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === "Enter" && bluetoothInput.trim()) {
              e.preventDefault();
              if (!processingRef.current && authed) {
                processingRef.current = true;
                setProcessing(true);
                await verifyQr(bluetoothInput.trim());
                setBluetoothInput("");
              }
            }
          }}
          autoFocus
          className="absolute -left-full"
          placeholder="Scanner input"
          aria-label="Bluetooth scanner"
        />

        <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/80 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Event (optional — leave Auto to read from QR)</label>
            <select
              title="Event filter"
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(Number(e.target.value));
                setTimeout(() => bluetoothInputRef.current?.focus(), 50);
              }}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value={AUTO_EVENT}>Auto — from QR</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          {availableCameras.length > 0 && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Camera ({availableCameras.length} available)
              </label>
              <select
                title="Camera selection"
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  setTimeout(() => bluetoothInputRef.current?.focus(), 50);
                }}
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
              >
                {availableCameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 gap-6">
          {!scanning ? (
            <div className="text-center space-y-4 w-full max-w-sm">
              <Camera className="h-20 w-20 text-gray-600 mx-auto" />
              <p className="text-gray-400 text-lg">Camera off</p>
              {cameraError && (
                <p className="text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded">
                  {cameraError}
                </p>
              )}

              {/* Manual entry field for barcodes/ticket codes */}
              <div className="pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-500 mb-2">Or enter ticket code manually:</p>
                <input
                  type="text"
                  inputMode="text"
                  placeholder="Ticket code or barcode..."
                  maxLength={100}
                  autoComplete="off"
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm placeholder-gray-600 focus:border-blue-400 outline-none"
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      const code = e.currentTarget.value.trim();
                      e.currentTarget.value = "";
                      if (!processingRef.current && authed) {
                        processingRef.current = true;
                        setProcessing(true);
                        await verifyQr(code);
                      }
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                onClick={() => {
                  setCameraError(null);
                  setCameraRetries(0);
                  setScanning(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-base"
              >
                Start camera
              </Button>
            </div>
          ) : (
            <div className="w-full max-w-sm space-y-4">
              {cameraError ? (
                <div className="text-center space-y-4 py-8">
                  <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto" />
                  <div>
                    <p className="text-yellow-400 font-semibold mb-2">Camera Issue</p>
                    <p className="text-gray-300 text-sm">{cameraError}</p>
                  </div>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      onClick={() => {
                        setCameraError(null);
                        setCameraRetries(0);
                        setScanning(true);
                      }}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 h-10"
                    >
                      Retry Camera
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setScanning(false)}
                      className="w-full border-gray-700 text-gray-400 hover:text-white"
                    >
                      Use Bluetooth Scanner
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-h-[70vh]">
                    <div id={scannerDivId} className="w-full h-full min-h-[240px]" />
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                      <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                    </div>
                    {processing && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="h-12 w-12 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <p className="text-center text-gray-400 text-sm">Hold QR code steady • Good lighting needed</p>
                  <p className="text-center text-gray-300 text-xs opacity-70">Or connect Bluetooth scanner (auto-reads)</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setScanning(false)}
                    className="w-full border-gray-700 text-gray-400 hover:text-white"
                  >
                    Stop camera
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

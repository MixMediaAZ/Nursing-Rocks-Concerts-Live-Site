import { useEffect, useRef, useState, useCallback } from "react";
import { Helmet } from "react-helmet";
import { CheckCircle2, XCircle, AlertTriangle, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const GATE_TOKEN_KEY = "nr_gate_scanner_jwt";
const AUTO_EVENT = 0;
const AUTO_RESET_MS = 4000;

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

function getDeviceFingerprint(): string {
  try {
    let fp = sessionStorage.getItem("gate_device_fp");
    if (!fp) {
      fp =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `fp_${Date.now()}_${Math.random()}`;
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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  // Refs that don't trigger re-renders
  const processingRef = useRef(false);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const bluetoothInputRef = useRef<HTMLInputElement | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraRetriesRef = useRef(0); // useRef instead of state — avoids double-init
  const maxRetries = 3;

  const authed = Boolean(gateToken);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const clearResetTimer = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
  }, []);

  const resetProcessing = useCallback(() => {
    processingRef.current = false;
    setProcessing(false);
  }, []);

  // Centralised stop — called by Lock, Stop Camera, Bluetooth buttons, token expiry
  const stopScanning = useCallback(() => {
    stopScanner();
    setScanning(false);
    resetProcessing();
    clearResetTimer();
  }, [stopScanner, resetProcessing]);

  // ── Auth events ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!authed) return;
    fetch("/api/events")
      .then((r) => r.json())
      .then((data: { id?: number; title?: string }[]) => {
        if (Array.isArray(data)) {
          setEvents(
            data.map((e) => ({ id: e.id as number, title: String(e.title ?? "Event") }))
          );
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

  const signOutGate = useCallback(() => {
    stopScanning();
    sessionStorage.removeItem(GATE_TOKEN_KEY);
    setGateToken(null);
  }, [stopScanning]);

  // ── Camera enumeration (once on auth, not on camera selection change) ────

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
          label: c.label || `Camera ${c.id.substring(0, 8)}`,
        }));
        setAvailableCameras(list);
        if (list.length > 0) {
          // Auto-select rear/back/environment camera, else first
          const rear = list.find((c) => /back|rear|environment/i.test(c.label));
          setSelectedCameraId((prev) => prev || rear?.id || list[0].id);
        }
      } catch (err) {
        console.warn("Camera enumeration failed:", err);
      }
    };

    loadCameras();
    return () => {
      cancelled = true;
    };
  }, [authed]); // ← NOT on selectedCameraId to avoid re-requesting permission

  // ── When camera ID changes while scanning, restart scanner ───────────────

  const prevCameraIdRef = useRef<string>("");
  useEffect(() => {
    if (!scanning || !selectedCameraId) return;
    if (prevCameraIdRef.current && prevCameraIdRef.current !== selectedCameraId) {
      // Camera changed mid-scan — stop and restart
      stopScanner();
      setScanning(false);
      cameraRetriesRef.current = 0;
      setTimeout(() => setScanning(true), 150);
    }
    prevCameraIdRef.current = selectedCameraId;
  }, [selectedCameraId, scanning, stopScanner]);

  // ── QR verification ──────────────────────────────────────────────────────

  const verifyCode = useCallback(
    async (rawCode: string) => {
      const token = sessionStorage.getItem(GATE_TOKEN_KEY);
      if (!token) {
        // Token expired — stop scanner and prompt re-auth
        stopScanning();
        setResult({ kind: "fail", message: "Session expired. Enter PIN to unlock." });
        resetTimerRef.current = setTimeout(() => setResult(null), AUTO_RESET_MS);
        return;
      }

      clearResetTimer();

      const code = rawCode.trim();
      if (!code) return;

      console.log(`[scanner] received code (${code.length} chars):`, code.substring(0, 60));

      try {
        const body: { qrToken: string; eventId?: number; deviceFingerprint: string } = {
          qrToken: code,
          deviceFingerprint: getDeviceFingerprint(),
        };
        if (selectedEventId > 0) body.eventId = selectedEventId;

        const res = await fetch("/api/tickets/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (res.status === 401) {
          sessionStorage.removeItem(GATE_TOKEN_KEY);
          setGateToken(null);
          stopScanning();
          setResult({ kind: "fail", message: "Session expired. Enter PIN to unlock." });
          resetTimerRef.current = setTimeout(() => setResult(null), AUTO_RESET_MS);
          return;
        }

        const data = (await res.json().catch(() => ({}))) as ScanApiResult;
        console.log(`[scanner] result:`, data.ok ? "✅ ACCEPTED" : `❌ ${data.reason}`);

        if (data.ok) {
          setResult({ kind: "ok", ticketCode: data.ticketCode, userName: data.userName });
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
        setResult({ kind: "fail", message: "Network error — try again." });
      }

      // Auto-clear result and unlock for next scan
      resetTimerRef.current = setTimeout(() => {
        setResult(null);
        resetProcessing();
      }, AUTO_RESET_MS);
    },
    [selectedEventId, stopScanning, resetProcessing]
  );

  const handleDismiss = useCallback(() => {
    clearResetTimer();
    setResult(null);
    resetProcessing();
    setTimeout(() => bluetoothInputRef.current?.focus(), 100);
  }, [resetProcessing]);

  // ── Camera scanner effect ─────────────────────────────────────────────────

  useEffect(() => {
    if (!authed || !scanning) return;

    let stopped = false;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const initScanner = async () => {
      try {
        setCameraError(null);

        const { Html5Qrcode } = await import("html5-qrcode");

        // Ensure any previous instance is stopped
        if (scannerRef.current) {
          await scannerRef.current.stop().catch(() => {});
          scannerRef.current = null;
        }

        const html5QrCode = new Html5Qrcode(scannerDivId, { verbose: false });
        scannerRef.current = html5QrCode;

        // Use exact device ID if selected, else fall back to rear facingMode
        const cameraConstraint =
          selectedCameraId
            ? { deviceId: { exact: selectedCameraId } }
            : { facingMode: "environment" };

        await html5QrCode.start(
          cameraConstraint,
          {
            fps: 15,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0,
            disableFlip: false, // allow mirrored codes
          },
          async (decodedText: string) => {
            if (processingRef.current || stopped) return;
            processingRef.current = true;
            setProcessing(true);
            await verifyCode(decodedText);
          },
          (_errorMsg: string) => {
            // NotFoundException fires on every frame with no QR — normal, suppress
          }
        );

        cameraRetriesRef.current = 0;
        console.log("[scanner] camera started");
      } catch (err) {
        if (stopped) return;
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("[scanner] init error:", errorMsg);

        let userMessage = "";
        if (
          errorMsg.includes("NotAllowedError") ||
          errorMsg.includes("Permission denied") ||
          errorMsg.includes("permissionDenied")
        ) {
          userMessage = "Camera permission denied. Tap allow when prompted, then retry.";
        } else if (
          errorMsg.includes("NotFoundError") ||
          errorMsg.includes("Requested device not found") ||
          errorMsg.includes("not available")
        ) {
          userMessage = "No camera found. Use Bluetooth scanner or enter code manually.";
          setCameraError(userMessage);
          setScanning(false);
          return;
        } else if (errorMsg.includes("NotReadableError") || errorMsg.includes("Could not start")) {
          userMessage = "Camera in use by another app. Close it and retry.";
        } else if (errorMsg.includes("SecurityError")) {
          userMessage = "Camera blocked — HTTPS required. Check connection.";
        } else if (errorMsg.includes("OverconstrainedError") || errorMsg.includes("Overconstrained")) {
          // Selected camera ID no longer valid — fall back to facingMode
          console.warn("[scanner] OverconstrainedError — clearing selected camera ID");
          setSelectedCameraId("");
          userMessage = "Selected camera unavailable. Switching to default…";
        } else {
          userMessage = "Camera error. Retrying…";
        }

        setCameraError(userMessage);

        if (cameraRetriesRef.current < maxRetries) {
          const delay = 1200 * Math.pow(2, cameraRetriesRef.current); // 1.2s, 2.4s, 4.8s
          cameraRetriesRef.current += 1;
          console.log(
            `[scanner] retry ${cameraRetriesRef.current}/${maxRetries} in ${delay}ms`
          );
          retryTimeout = setTimeout(() => {
            if (!stopped) initScanner();
          }, delay);
        } else {
          setCameraError("Camera failed after retries. Use Bluetooth or manual entry.");
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
    // ← cameraRetries NOT in deps (use ref instead to prevent double-init)
    // ← selectedCameraId handled by separate camera-change effect above
  }, [authed, scanning, verifyCode, selectedCameraId]);

  // ── Bluetooth / keyboard scanner ─────────────────────────────────────────

  const handleBluetoothKey = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      const code = bluetoothInput.trim();
      if (!code || processingRef.current || !authed) return;
      e.preventDefault();
      processingRef.current = true;
      setProcessing(true);
      setBluetoothInput("");
      await verifyCode(code);
    },
    [bluetoothInput, authed, verifyCode]
  );

  // ── Scanner div ID ────────────────────────────────────────────────────────

  const scannerDivId = "nr-gate-qr-scanner";

  // ── PIN screen ────────────────────────────────────────────────────────────

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

  // ── Result overlay ────────────────────────────────────────────────────────

  if (result) {
    const ok = result.kind === "ok";
    const used = result.kind === "used";

    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-8 text-white text-center cursor-pointer select-none ${
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
        <div className="space-y-6 max-w-md w-full">
          {ok ? (
            <CheckCircle2 className="h-28 w-28 mx-auto opacity-90" />
          ) : used ? (
            <AlertTriangle className="h-28 w-28 mx-auto opacity-90" />
          ) : (
            <XCircle className="h-28 w-28 mx-auto opacity-90" />
          )}

          <div>
            <p className="text-4xl sm:text-5xl font-black tracking-tight uppercase">
              {ok ? "Welcome" : used ? "Already In" : "Invalid"}
            </p>
            {(ok || used) && result.userName && (
              <p className="text-2xl sm:text-3xl font-bold mt-4 opacity-95 break-words">
                {result.userName}
              </p>
            )}
            {result.kind !== "fail" && result.ticketCode && (
              <p className="text-lg mt-2 font-mono opacity-80">{result.ticketCode}</p>
            )}
            {!ok && result.kind !== "used" && (
              <p className="text-lg mt-4 opacity-90">{result.message}</p>
            )}
            {result.kind === "used" && result.message && (
              <p className="text-base mt-3 opacity-85">{result.message}</p>
            )}
          </div>

          <p className="text-sm opacity-50 mt-8">Tap anywhere to scan next ticket</p>
        </div>
      </div>
    );
  }

  // ── Main scanner UI ───────────────────────────────────────────────────────

  return (
    <>
      <Helmet>
        <title>Ticket scanner | Nursing Rocks</title>
        <meta name="theme-color" content="#030712" />
      </Helmet>

      <div className="min-h-screen bg-gray-950 flex flex-col">

        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Nursing Rocks — Gate</h1>
            <p className="text-gray-400 text-xs">QR · Barcode · Manual entry</p>
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

        {/* Hidden capture input for Bluetooth scanner (always focused when not typing elsewhere) */}
        <input
          ref={bluetoothInputRef}
          type="text"
          value={bluetoothInput}
          onChange={(e) => setBluetoothInput(e.target.value)}
          onKeyDown={handleBluetoothKey}
          autoFocus
          className="absolute -left-[9999px] w-px h-px opacity-0"
          aria-label="Bluetooth scanner input"
          tabIndex={-1}
        />

        {/* Controls bar */}
        <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/80 space-y-3">
          {/* Event selector */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Event <span className="text-gray-600">(Auto reads from QR)</span>
            </label>
            <select
              title="Event"
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

          {/* Camera selector */}
          {availableCameras.length > 1 && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Camera <span className="text-gray-600">({availableCameras.length} found)</span>
              </label>
              <select
                title="Camera"
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

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 gap-5">

          {!scanning ? (
            /* ── Camera off state ── */
            <div className="w-full max-w-sm space-y-4 pt-4">
              <div className="text-center">
                <Camera className="h-16 w-16 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-base">Camera is off</p>
              </div>

              {cameraError && (
                <div className="bg-red-950/40 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">
                  {cameraError}
                </div>
              )}

              <Button
                type="button"
                onClick={() => {
                  setCameraError(null);
                  cameraRetriesRef.current = 0;
                  setScanning(true);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
              >
                Start camera
              </Button>

              {/* Manual / Bluetooth entry */}
              <div className="border-t border-gray-800 pt-4">
                <p className="text-xs text-gray-500 mb-2">
                  Or enter ticket code (also accepts Bluetooth scanner):
                </p>
                <div className="flex gap-2">
                  <input
                    id="manual-entry"
                    type="text"
                    inputMode="text"
                    placeholder="NR-2026-XXXXXX or scan barcode…"
                    maxLength={200}
                    autoComplete="off"
                    className="flex-1 bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm placeholder-gray-600 focus:border-blue-400 outline-none"
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        const code = e.currentTarget.value.trim();
                        if (!code || processingRef.current || !authed) return;
                        e.currentTarget.value = "";
                        processingRef.current = true;
                        setProcessing(true);
                        await verifyCode(code);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    disabled={processing}
                    onClick={async () => {
                      const input = document.getElementById("manual-entry") as HTMLInputElement;
                      const code = input?.value.trim();
                      if (!code || processingRef.current || !authed) return;
                      input.value = "";
                      processingRef.current = true;
                      setProcessing(true);
                      await verifyCode(code);
                    }}
                    className="bg-blue-700 hover:bg-blue-600 px-4"
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* ── Scanning state ── */
            <div className="w-full max-w-sm space-y-3">
              {cameraError ? (
                /* Camera error state */
                <div className="text-center space-y-4 py-6">
                  <AlertTriangle className="h-14 w-14 text-yellow-500 mx-auto" />
                  <div>
                    <p className="text-yellow-400 font-semibold mb-1">Camera issue</p>
                    <p className="text-gray-300 text-sm">{cameraError}</p>
                  </div>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      onClick={() => {
                        setCameraError(null);
                        cameraRetriesRef.current = 0;
                        setScanning(false);
                        setTimeout(() => setScanning(true), 100);
                      }}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 h-10"
                    >
                      Retry Camera
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        stopScanning();
                        setTimeout(() => bluetoothInputRef.current?.focus(), 100);
                      }}
                      className="w-full border-gray-700 text-gray-400 hover:text-white"
                    >
                      Use Manual Entry
                    </Button>
                  </div>
                </div>
              ) : (
                /* Live camera view */
                <>
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-square w-full">
                    {/* html5-qrcode mounts into this div */}
                    <div id={scannerDivId} className="w-full h-full min-h-[280px]" />

                    {/* Corner brackets overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                      <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                    </div>

                    {/* Processing overlay */}
                    {processing && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <Loader2 className="h-14 w-14 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <p className="text-center text-gray-400 text-sm">
                    Hold QR code steady inside the frame
                  </p>
                  <p className="text-center text-gray-600 text-xs">
                    Bluetooth scanner also active in background
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      stopScanning();
                      setTimeout(() => bluetoothInputRef.current?.focus(), 100);
                    }}
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

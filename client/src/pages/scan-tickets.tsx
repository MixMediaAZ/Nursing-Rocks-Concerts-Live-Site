import { useEffect, useRef, useState, useCallback } from "react";
import { Helmet } from "react-helmet";
import { CheckCircle2, XCircle, AlertTriangle, Camera, Loader2, Lightbulb, ZoomIn, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Camera capability types ───────────────────────────────────────────────────
interface TorchFeature {
  isSupported: () => boolean;
  apply: (val: boolean) => Promise<void>;
}
interface ZoomFeature {
  isSupported: () => boolean;
  apply: (val: number) => Promise<void>;
  min: () => number;
  max: () => number;
  step: () => number;
}
interface Html5QrcodeInstance {
  stop: () => Promise<void>;
  applyVideoConstraints: (c: MediaTrackConstraints) => Promise<void>;
  getRunningTrackCameraCapabilities: () => {
    torchFeature: () => TorchFeature;
    zoomFeature: () => ZoomFeature;
  };
}

// ── Scanner settings ──────────────────────────────────────────────────────────
interface ScanSettings {
  fps: 10 | 15 | 30;
  qrboxSize: 200 | 280 | 360;
  torch: boolean;
  zoom: number;
  sound: boolean;
  resetMs: 2000 | 4000 | 6000;
}
const DEFAULT_SETTINGS: ScanSettings = {
  fps: 15, qrboxSize: 280, torch: false, zoom: 1, sound: true, resetMs: 4000,
};
const FPS_LABELS: Record<ScanSettings["fps"], string> = { 10: "10 — battery saver", 15: "15 — normal", 30: "30 — fast" };
const BOX_LABELS: Record<ScanSettings["qrboxSize"], string> = { 200: "S — small", 280: "M — medium", 360: "L — large" };
const RESET_LABELS: Record<ScanSettings["resetMs"], string> = { 2000: "2s — fast queue", 4000: "4s — normal", 6000: "6s — slow" };

// ── Audio feedback (Web Audio API — no files needed) ─────────────────────────
function playBeep(type: "ok" | "used" | "fail"): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "ok") {
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "used") {
      osc.frequency.value = 520;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } else {
      // Two low pulses for fail
      osc.frequency.value = 220;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    }
    setTimeout(() => ctx.close().catch(() => {}), 1500);
  } catch { /* AudioContext not available */ }
}

// ── Vibration feedback ────────────────────────────────────────────────────────
function vibrate(type: "ok" | "used" | "fail"): void {
  try {
    if (!("vibrate" in navigator)) return;
    if (type === "ok")   navigator.vibrate(200);
    else if (type === "used") navigator.vibrate([100, 60, 100]);
    else                 navigator.vibrate([60, 40, 60, 40, 200]);
  } catch { /* vibrate not available */ }
}

// ── Decode JWT expiry (no verification — display only) ───────────────────────
function getTokenExpiryMs(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 - Date.now() : null;
  } catch { return null; }
}

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
  const [stats, setStats] = useState<{
    checkedIn: number;
    total: number;
    pct: number;
    recent: Array<{ ticketCode: string; name: string; checkedInAt: string | null }>;
  } | null>(null);

  const [scanSettings, setScanSettings] = useState<ScanSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [capabilities, setCapabilities] = useState<{
    torch: boolean;
    zoom: { min: number; max: number; step: number } | null;
  } | null>(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [tokenExpiresIn, setTokenExpiresIn] = useState<number | null>(null);

  // Refs that don't trigger re-renders
  const processingRef = useRef(false);
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const bluetoothInputRef = useRef<HTMLInputElement | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const cameraRetriesRef = useRef(0);
  const didAutoStartRef = useRef(false); // prevent re-auto-start after manual stop
  const scanSettingsRef = useRef<ScanSettings>(DEFAULT_SETTINGS); // ref copy used inside verifyCode to avoid stale closure
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
      // Turn torch off before stopping — some devices leave it on otherwise
      try {
        const caps = scannerRef.current.getRunningTrackCameraCapabilities();
        if (caps.torchFeature().isSupported()) {
          caps.torchFeature().apply(false).catch(() => {});
        }
      } catch { /* ignore — scanner may already be stopping */ }
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setCapabilities(null);
    setScanSettings((s) => ({ ...s, torch: false })); // reset torch state
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

  // ── Keep scanSettings ref in sync (lets verifyCode read current values without stale closure) ──
  useEffect(() => { scanSettingsRef.current = scanSettings; }, [scanSettings]);

  // ── Network status ────────────────────────────────────────────────────────
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // ── Token expiry countdown ────────────────────────────────────────────────
  useEffect(() => {
    if (!gateToken) { setTokenExpiresIn(null); return; }
    const update = () => setTokenExpiresIn(getTokenExpiryMs(gateToken));
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [gateToken]);

  // ── Screen wake lock — keep screen on while scanning ─────────────────────
  useEffect(() => {
    if (!scanning || !("wakeLock" in navigator)) return;

    let released = false;

    const acquire = async () => {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        console.log("[scanner] wake lock acquired");
        wakeLockRef.current.addEventListener("release", () => {
          if (!released) console.log("[scanner] wake lock released by browser");
        });
      } catch (err) {
        console.warn("[scanner] wake lock unavailable:", err);
      }
    };

    // Re-acquire when tab becomes visible again (browser releases on hide)
    const onVisibility = () => {
      if (document.visibilityState === "visible") acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [scanning]);

  // ── Auto-start camera on first auth ──────────────────────────────────────
  useEffect(() => {
    if (authed && !didAutoStartRef.current) {
      didAutoStartRef.current = true;
      setScanning(true);
    }
    if (!authed) {
      didAutoStartRef.current = false;
    }
  }, [authed]);

  // ── Live check-in stats (poll every 30s + after each successful scan) ────

  const fetchStats = useCallback(async () => {
    const token = sessionStorage.getItem(GATE_TOKEN_KEY);
    if (!token) return;
    try {
      const qs = selectedEventId > 0 ? `?eventId=${selectedEventId}` : "";
      const res = await fetch(`/api/gate/stats${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } catch {
      // non-critical — stats failure shouldn't affect scanning
    }
  }, [selectedEventId]);

  // Initial load + 30s polling
  useEffect(() => {
    if (!authed) return;
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [authed, fetchStats]);

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
        if (scanSettingsRef.current.sound) { playBeep("fail"); vibrate("fail"); }
        resetTimerRef.current = setTimeout(() => setResult(null), scanSettingsRef.current.resetMs);
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
          if (scanSettingsRef.current.sound) { playBeep("fail"); vibrate("fail"); }
          resetTimerRef.current = setTimeout(() => setResult(null), scanSettingsRef.current.resetMs);
          return;
        }

        const data = (await res.json().catch(() => ({}))) as ScanApiResult;
        console.log(`[scanner] result:`, data.ok ? "✅ ACCEPTED" : `❌ ${data.reason}`);

        if (data.ok) {
          fetchStats(); // refresh counter immediately on each check-in
          setResult({ kind: "ok", ticketCode: data.ticketCode, userName: data.userName });
          if (scanSettingsRef.current.sound) { playBeep("ok"); vibrate("ok"); }
        } else if (data.reason === "already_used") {
          setResult({
            kind: "used",
            message: data.message || "Already checked in",
            userName: data.userName,
            ticketCode: data.ticketCode,
          });
          if (scanSettingsRef.current.sound) { playBeep("used"); vibrate("used"); }
        } else {
          setResult({
            kind: "fail",
            message: data.message || data.reason || "Invalid ticket",
          });
          if (scanSettingsRef.current.sound) { playBeep("fail"); vibrate("fail"); }
        }
      } catch {
        setResult({ kind: "fail", message: "Network error — try again." });
        if (scanSettingsRef.current.sound) { playBeep("fail"); vibrate("fail"); }
      }

      // Auto-clear result and unlock for next scan
      resetTimerRef.current = setTimeout(() => {
        setResult(null);
        resetProcessing();
      }, scanSettingsRef.current.resetMs);
    },
    [selectedEventId, stopScanning, resetProcessing, fetchStats]
  );

  // ── Camera settings controls ──────────────────────────────────────────────

  /** Toggle flashlight — applies live, no scanner restart needed */
  const toggleTorch = useCallback(async () => {
    if (!scannerRef.current || !capabilities?.torch) return;
    const next = !scanSettings.torch;
    try {
      await scannerRef.current
        .getRunningTrackCameraCapabilities()
        .torchFeature()
        .apply(next);
      setScanSettings((s) => ({ ...s, torch: next }));
    } catch (err) {
      console.warn("[scanner] torch toggle failed:", err);
    }
  }, [capabilities, scanSettings.torch]);

  /** Adjust zoom — applies live, no scanner restart needed */
  const applyZoom = useCallback(async (zoom: number) => {
    if (!scannerRef.current || !capabilities?.zoom) return;
    const clamped = Math.max(capabilities.zoom.min, Math.min(capabilities.zoom.max, zoom));
    try {
      await scannerRef.current
        .getRunningTrackCameraCapabilities()
        .zoomFeature()
        .apply(clamped);
      setScanSettings((s) => ({ ...s, zoom: clamped }));
    } catch (err) {
      console.warn("[scanner] zoom apply failed:", err);
    }
  }, [capabilities]);

  /** Change FPS or qrbox size — requires scanner restart */
  const applyRestartSetting = useCallback(
    (patch: Partial<Pick<ScanSettings, "fps" | "qrboxSize">>) => {
      setScanSettings((s) => ({ ...s, ...patch }));
      if (scanning) {
        stopScanner();
        setScanning(false);
        cameraRetriesRef.current = 0;
        setTimeout(() => setScanning(true), 150);
      }
    },
    [scanning, stopScanner]
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
            fps: scanSettings.fps,
            qrbox: { width: scanSettings.qrboxSize, height: scanSettings.qrboxSize },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          async (decodedText: string) => {
            if (processingRef.current || stopped) return;
            processingRef.current = true;
            setProcessing(true);
            await verifyCode(decodedText);
          },
          (_errorMsg: string) => {
            // NotFoundException fires on every frame — normal, suppress
          }
        );

        cameraRetriesRef.current = 0;
        console.log("[scanner] camera started");

        // ── Detect what this device actually supports ─────────────────────
        // Must happen AFTER start() — capabilities only available on live stream
        try {
          const caps = html5QrCode.getRunningTrackCameraCapabilities();
          const torchFeat = caps.torchFeature();
          const zoomFeat = caps.zoomFeature();
          const zoomCap = zoomFeat.isSupported()
            ? { min: zoomFeat.min(), max: zoomFeat.max(), step: zoomFeat.step() }
            : null;
          setCapabilities({ torch: torchFeat.isSupported(), zoom: zoomCap });
          console.log("[scanner] capabilities:", {
            torch: torchFeat.isSupported(),
            zoom: zoomCap,
          });
          // Re-apply zoom if user had it set before restart
          if (zoomCap && scanSettings.zoom > 1) {
            zoomFeat.apply(Math.min(scanSettings.zoom, zoomCap.max)).catch(() => {});
          }
        } catch (capErr) {
          console.warn("[scanner] capability detection failed:", capErr);
          setCapabilities({ torch: false, zoom: null });
        }
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
    // ← scanSettings.torch/zoom NOT here (applied live without restart)
    // ← scanSettings.fps/qrboxSize trigger restart via applyRestartSetting
  }, [authed, scanning, verifyCode, selectedCameraId, scanSettings.fps, scanSettings.qrboxSize]);

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

  // ── Shared nav bar (PIN screen + main scanner screen) ────────────────────

  const scannerNav = (
    <nav className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between gap-2 shrink-0">
      {/* Brand */}
      <a
        href="/"
        className="flex items-center gap-2 text-white font-bold text-sm hover:text-green-400 transition-colors shrink-0"
      >
        <span className="text-xl leading-none">🎸</span>
        <span className="hidden sm:inline">Nursing Rocks</span>
      </a>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        <a
          href="/"
          className="text-gray-400 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Home
        </a>
        <a
          href="/admin"
          className="text-gray-400 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Admin
        </a>
        {authed && (
          <button
            type="button"
            onClick={signOutGate}
            className="text-gray-500 hover:text-red-400 text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1"
            title="Lock scanner"
          >
            🔒 Lock
          </button>
        )}
      </div>
    </nav>
  );

  // ── PIN screen ────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <>
        <Helmet>
          <title>Door scanner | Nursing Rocks</title>
        </Helmet>
        <div className="min-h-screen bg-gray-950 flex flex-col">
          {scannerNav}
          <div className="flex-1 flex items-center justify-center p-6">
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
          </div>{/* /flex-1 center */}
        </div>{/* /min-h-screen */}
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

        {/* Site nav */}
        {scannerNav}

        {/* Scanner mode sub-header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center gap-3">
          <span className="text-green-400 text-base leading-none">●</span>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Gate scanner active</p>
            <p className="text-gray-500 text-xs">QR · Barcode · Manual entry</p>
          </div>
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

        {/* Offline warning banner */}
        {!isOnline && (
          <div className="bg-red-700 text-white text-sm font-semibold text-center py-2 px-4">
            ⚠️ No internet — scans will fail
          </div>
        )}

        {/* Token expiry warning banner */}
        {tokenExpiresIn !== null && tokenExpiresIn < 30 * 60 * 1000 && (
          <div
            className={`text-sm font-semibold text-center py-2 px-4 ${
              tokenExpiresIn < 5 * 60 * 1000
                ? "bg-red-700 text-white animate-pulse"
                : "bg-amber-700 text-white"
            }`}
          >
            {tokenExpiresIn < 5 * 60 * 1000
              ? `🔴 Session expires in ${Math.ceil(tokenExpiresIn / 60000)}min — re-enter PIN soon`
              : `⏱ Session expires in ${Math.ceil(tokenExpiresIn / 60000)}min`}
          </div>
        )}

        {/* Live check-in counter */}
        {stats && (
          <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white font-bold text-2xl tabular-nums">
                {stats.checkedIn}
                <span className="text-gray-500 text-base font-normal"> / {stats.total} in</span>
              </span>
              <span className="text-gray-400 text-sm font-medium">{stats.pct}%</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.pct, 100)}%` }}
              />
            </div>
            {/* Recent check-ins */}
            {stats.recent.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {stats.recent.slice(0, 3).map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-green-400 font-medium truncate max-w-[160px]">{r.name}</span>
                    <span className="text-gray-600 shrink-0 ml-2">
                      {r.checkedInAt
                        ? new Date(r.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

                  {/* ── Scanner settings panel ── */}
                  <div className="border border-gray-800 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setSettingsOpen((o) => !o)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-900 text-gray-400 hover:text-white text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Scanner settings
                      </span>
                      {settingsOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {settingsOpen && (
                      <div className="bg-gray-950 px-4 py-4 space-y-5">

                        {/* Torch — only shown if device supports it */}
                        {capabilities?.torch && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm text-gray-300">
                              <Lightbulb className="h-4 w-4 text-yellow-400" />
                              Flashlight
                            </span>
                            <button
                              type="button"
                              onClick={toggleTorch}
                              className={`relative w-11 h-6 rounded-full transition-colors ${
                                scanSettings.torch ? "bg-yellow-500" : "bg-gray-700"
                              }`}
                              aria-label="Toggle flashlight"
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                  scanSettings.torch ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        )}

                        {/* Zoom — only shown if device supports it */}
                        {capabilities?.zoom && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2 text-sm text-gray-300">
                                <ZoomIn className="h-4 w-4 text-blue-400" />
                                Zoom
                              </span>
                              <span className="text-xs text-gray-500 tabular-nums">
                                {scanSettings.zoom.toFixed(1)}×
                              </span>
                            </div>
                            <input
                              type="range"
                              min={capabilities.zoom.min}
                              max={capabilities.zoom.max}
                              step={capabilities.zoom.step || 0.1}
                              value={scanSettings.zoom}
                              onChange={(e) => applyZoom(parseFloat(e.target.value))}
                              className="w-full accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>{capabilities.zoom.min}×</span>
                              <span>{capabilities.zoom.max}×</span>
                            </div>
                          </div>
                        )}

                        {/* Scan box size */}
                        <div className="space-y-1.5">
                          <p className="text-sm text-gray-300">Scan box size</p>
                          <div className="grid grid-cols-3 gap-1">
                            {([200, 280, 360] as ScanSettings["qrboxSize"][]).map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => applyRestartSetting({ qrboxSize: size })}
                                className={`py-1.5 text-xs rounded-lg border transition-colors ${
                                  scanSettings.qrboxSize === size
                                    ? "bg-blue-600 border-blue-500 text-white"
                                    : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                                }`}
                              >
                                {BOX_LABELS[size]}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* FPS */}
                        <div className="space-y-1.5">
                          <p className="text-sm text-gray-300">Scan speed (FPS)</p>
                          <div className="grid grid-cols-3 gap-1">
                            {([10, 15, 30] as ScanSettings["fps"][]).map((fps) => (
                              <button
                                key={fps}
                                type="button"
                                onClick={() => applyRestartSetting({ fps })}
                                className={`py-1.5 text-xs rounded-lg border transition-colors ${
                                  scanSettings.fps === fps
                                    ? "bg-blue-600 border-blue-500 text-white"
                                    : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                                }`}
                              >
                                {FPS_LABELS[fps]}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-600">
                            Changing speed or box size briefly restarts the camera
                          </p>
                        </div>

                        {/* Sound feedback toggle */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">
                            {scanSettings.sound ? "🔊" : "🔇"} Scan sounds
                          </span>
                          <button
                            type="button"
                            onClick={() => setScanSettings((s) => ({ ...s, sound: !s.sound }))}
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              scanSettings.sound ? "bg-blue-600" : "bg-gray-700"
                            }`}
                            aria-label="Toggle scan sounds"
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                scanSettings.sound ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Auto-reset timing */}
                        <div className="space-y-1.5">
                          <p className="text-sm text-gray-300">Auto-reset delay</p>
                          <div className="grid grid-cols-3 gap-1">
                            {([2000, 4000, 6000] as ScanSettings["resetMs"][]).map((ms) => (
                              <button
                                key={ms}
                                type="button"
                                onClick={() => setScanSettings((s) => ({ ...s, resetMs: ms }))}
                                className={`py-1.5 text-xs rounded-lg border transition-colors ${
                                  scanSettings.resetMs === ms
                                    ? "bg-blue-600 border-blue-500 text-white"
                                    : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                                }`}
                              >
                                {RESET_LABELS[ms]}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-600">Time before next scan is allowed</p>
                        </div>

                        {/* No-support message if device has neither torch nor zoom */}
                        {capabilities && !capabilities.torch && !capabilities.zoom && (
                          <p className="text-xs text-gray-600 text-center py-1">
                            This device doesn't support flashlight or zoom control
                          </p>
                        )}

                      </div>
                    )}
                  </div>

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

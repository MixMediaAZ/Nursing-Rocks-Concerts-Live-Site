import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Recipient {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface Preview {
  total: number;
  recipients: Recipient[];
}

interface BatchResult {
  sent: number;
  failed: number;
  skipped: number;
  total: number;
  failures: Array<{ userId: number; email: string; error: string }>;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function ThankYouBatchCard() {
  const { toast } = useToast();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);

  async function loadPreview() {
    setLoadingPreview(true);
    setResult(null);
    setConfirming(false);
    try {
      const res = await fetch("/api/admin/thank-you-batch/preview", {
        headers: authHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Failed (${res.status})`);
      }
      const data: Preview = await res.json();
      setPreview(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load preview";
      toast({ title: "Preview failed", description: message, variant: "destructive" });
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function send() {
    if (!preview) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/thank-you-batch/send", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ expectedCount: preview.total }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Failed (${res.status})`);
      }
      const data: BatchResult = await res.json();
      setResult(data);
      setPreview(null);
      setConfirming(false);
      toast({
        title: "Batch complete",
        description: `Sent ${data.sent}, failed ${data.failed}, skipped ${data.skipped}.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Send failed";
      toast({ title: "Send failed", description: message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" /> Send Thank-You Email Batch
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Sends the thank-you email to every registered user who hasn't received one yet.
          Users who already received any ticket/thank-you email are automatically skipped.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button onClick={loadPreview} disabled={loadingPreview || sending} variant="outline">
            {loadingPreview ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Loading preview...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" /> {preview ? "Refresh preview" : "Load preview"}
              </>
            )}
          </Button>
        </div>

        {preview && (
          <div className="space-y-3">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertTitle>
                {preview.total} recipient{preview.total !== 1 ? "s" : ""} eligible
              </AlertTitle>
              <AlertDescription>
                {preview.total === 0
                  ? "No users are pending. Everyone has already received a thank-you email."
                  : "Review the list below. Nothing is sent until you click Confirm and Send."}
              </AlertDescription>
            </Alert>

            {preview.total > 0 && (
              <>
                <div className="border rounded-md max-h-72 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {preview.recipients.map((r) => (
                        <tr key={r.id}>
                          <td className="px-3 py-2">
                            {r.first_name} {r.last_name}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{r.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {!confirming ? (
                  <Button
                    onClick={() => setConfirming(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" /> Prepare to send
                  </Button>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Confirm send to {preview.total} recipients?</AlertTitle>
                    <AlertDescription className="mt-2">
                      <p className="mb-3">
                        This will send the thank-you email to all listed users.
                        Each user is marked as sent before delivery — they will not be re-sent on subsequent runs.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={send}
                          disabled={sending}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {sending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Sending...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" /> Confirm and send
                            </>
                          )}
                        </Button>
                        <Button onClick={() => setConfirming(false)} variant="outline" disabled={sending}>
                          Cancel
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>
        )}

        {result && (
          <Alert className="mt-4">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Batch finished</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-1 text-sm">
                <div>Sent: <strong>{result.sent}</strong></div>
                <div>Failed: <strong>{result.failed}</strong></div>
                <div>Skipped (already sent): <strong>{result.skipped}</strong></div>
                <div>Total processed: <strong>{result.total}</strong></div>
              </div>
              {result.failures.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Show {result.failures.length} failure{result.failures.length !== 1 ? "s" : ""}
                  </summary>
                  <ul className="mt-2 text-xs space-y-1 list-disc list-inside">
                    {result.failures.map((f) => (
                      <li key={f.userId}>
                        {f.email}: {f.error}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

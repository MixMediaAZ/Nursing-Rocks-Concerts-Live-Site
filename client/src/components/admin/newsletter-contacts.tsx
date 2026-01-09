import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type SubscriberRow = {
  id: number;
  email: string;
  created_at: string | Date | null;
};

function getAdminAuthHeaders() {
  const token = localStorage.getItem("adminToken");
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function NewsletterContacts() {
  const [rows, setRows] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(false);

  const count = rows.length;
  const sorted = useMemo(() => rows, [rows]);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscribers", {
        headers: { ...getAdminAuthHeaders() },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `Request failed (${res.status})`);
      }

      const data = (await res.json()) as SubscriberRow[];
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load newsletter subscribers:", e);
      toast({
        title: "Failed to load newsletter contacts",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadCsv = async () => {
    try {
      const res = await fetch("/api/admin/subscribers.csv", {
        headers: { ...getAdminAuthHeaders() },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `Request failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "newsletter-subscribers.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to download subscribers CSV:", e);
      toast({
        title: "Download failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Newsletter Contacts</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
          <Button size="sm" onClick={downloadCsv}>
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4">
          Total contacts: <span className="font-medium text-foreground">{count}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td className="py-3 text-muted-foreground" colSpan={2}>
                    {loading ? "Loading..." : "No contacts yet."}
                  </td>
                </tr>
              ) : (
                sorted.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 pr-4">{r.email}</td>
                    <td className="py-2 pr-4">
                      {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}



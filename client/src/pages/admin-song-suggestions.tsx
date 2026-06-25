import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SongSuggestion {
  id: number;
  name: string;
  city: string | null;
  role: string | null;
  song: string;
  story: string | null;
  email: string | null;
  can_share: boolean;
  status: string;
  created_at: string;
}

export default function AdminSongSuggestionsPage() {
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState<SongSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const adminFetch = useCallback(async (url: string) => {
    const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) throw new Error("Admin privileges required");
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch("/api/admin/song-suggestions");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({
        title: "Couldn't load suggestions",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [adminFetch, toast]);

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
    setIsAdmin(!!token);
    if (token) {
      load();
    }
  }, [load]);

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-12">
        <Helmet>
          <title>Admin Access Required - Nursing Rocks</title>
        </Helmet>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
              <p className="mb-6">Please log in as an admin to view song suggestions.</p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => (window.location.href = "/admin")}>
                  Go to Admin Login
                </Button>
                <Button variant="outline" onClick={() => window.history.back()}>
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      <Helmet>
        <title>Song Suggestions - Nursing Rocks</title>
      </Helmet>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" className="mr-2" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Music className="h-6 w-6" /> Song Suggestions
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="max-w-5xl mx-auto">
        {rows.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              {loading ? "Loading…" : "No song suggestions yet."}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{rows.length} suggestion(s)</p>
            {rows.map((row) => (
              <Card key={row.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-lg break-words">{row.song}</p>
                      <p className="text-sm text-muted-foreground">
                        {row.name}
                        {row.city ? ` · ${row.city}` : ""}
                        {row.role ? ` · ${row.role}` : ""}
                      </p>
                      {row.story && (
                        <p className="mt-2 text-sm break-words">"{row.story}"</p>
                      )}
                      {row.email && (
                        <p className="mt-2 text-xs text-muted-foreground break-all">
                          {row.email}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {row.can_share ? (
                        <Badge variant="secondary">OK to share</Badge>
                      ) : (
                        <Badge variant="outline">Private</Badge>
                      )}
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(row.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

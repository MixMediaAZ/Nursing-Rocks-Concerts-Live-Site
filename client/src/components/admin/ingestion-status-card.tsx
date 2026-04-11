import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

export function IngestionStatusCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);

  // Fetch ingestion summary
  const { data: summary, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/jobs/ingestion-summary"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/jobs/ingestion-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch ingestion status");
      return res.json();
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/jobs/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source: "phoenixchildrens" }),
      });
      if (!res.ok) throw new Error("Failed to trigger sync");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ingestion sync triggered. Check back in a few moments.",
      });
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["/api/admin/jobs/ingestion-summary"],
        });
      }, 3000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { latestRun, scheduler } = summary || {};

  const formatDate = (date: string) => {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ingestion Status</span>
            {scheduler?.running ? (
              <Badge className="bg-green-500">Running</Badge>
            ) : (
              <Badge variant="secondary">Stopped</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Latest Run Summary */}
            {latestRun ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Last Sync:
                    </span>
                  </div>
                  <span className="font-medium">
                    {formatDate(latestRun.completed_at || latestRun.started_at)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <div className="flex items-center gap-2">
                    {latestRun.status === "success" ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-500">
                          Success
                        </span>
                      </>
                    ) : latestRun.status === "failed" ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-500">
                          Failed
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-500">
                          {latestRun.status}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Fetched
                    </span>
                    <p className="text-lg font-semibold">
                      {latestRun.jobs_fetched}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Inserted
                    </span>
                    <p className="text-lg font-semibold text-green-600">
                      {latestRun.jobs_inserted}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Updated
                    </span>
                    <p className="text-lg font-semibold text-blue-600">
                      {latestRun.jobs_updated}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Archived
                    </span>
                    <p className="text-lg font-semibold text-orange-600">
                      {latestRun.jobs_archived}
                    </p>
                  </div>
                </div>

                {latestRun.errors_count > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm font-medium text-red-700 mb-1">
                      {latestRun.errors_count} Error(s)
                    </p>
                    {latestRun.error_log && latestRun.error_log.length > 0 && (
                      <ul className="text-xs text-red-600 space-y-1">
                        {latestRun.error_log.slice(0, 3).map((err: string, i: number) => (
                          <li key={i}>• {err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No ingestion runs yet
              </p>
            )}

            {/* Scheduler Info */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Schedule:</span>
                <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                  {scheduler?.cron || "Not configured"}
                </code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Grace Period:</span>
                <span className="font-medium">{scheduler?.graceDays} days</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending || scheduler?.currentlyProcessing}
                className="flex-1"
              >
                {syncMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Now
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowHistory(true)}
                className="flex-1"
              >
                View History
              </Button>
            </div>

            {scheduler?.currentlyProcessing && (
              <p className="text-xs text-blue-600 text-center py-2">
                🔄 Ingestion is currently running...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingestion History</DialogTitle>
            <DialogDescription>
              Recent ingestion runs for Phoenix Children's jobs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {latestRun ? (
              <div className="text-sm space-y-2">
                <div className="p-2 bg-muted rounded">
                  <p className="font-medium">
                    {formatDate(latestRun.completed_at || latestRun.started_at)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fetched: {latestRun.jobs_fetched} | Inserted:{" "}
                    {latestRun.jobs_inserted} | Updated:{" "}
                    {latestRun.jobs_updated}
                  </p>
                  <p className="text-xs mt-1">
                    Status:{" "}
                    <Badge
                      variant={
                        latestRun.status === "success"
                          ? "default"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {latestRun.status}
                    </Badge>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No ingestion history available
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

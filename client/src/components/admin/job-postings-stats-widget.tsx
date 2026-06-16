import { useState, useEffect } from "react";
import { formatTrafficChartDayLabel } from "@/lib/format-traffic-chart-day";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Briefcase } from "lucide-react";

interface Bucket {
  postings: number;
  applications: number;
}

interface JobPostingsStats {
  today: { date: string } & Bucket;
  week: Bucket;
  month: Bucket;
  allTime: Bucket;
  status: {
    active: number;
    pending: number;
    featured: number;
    expired: number;
    totalViews: number;
  };
  days: ({ date: string } & Bucket)[];
}

function toBucket(raw: unknown): Bucket {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    postings: Number(o.postings ?? 0),
    applications: Number(o.applications ?? 0),
  };
}

function normalizeStats(raw: unknown): JobPostingsStats | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!o.today || !o.week || !o.month || !o.allTime || !Array.isArray(o.days)) {
    return null;
  }
  const t = o.today as Record<string, unknown>;
  const s = (o.status && typeof o.status === "object" ? o.status : {}) as Record<string, unknown>;
  return {
    today: { date: typeof t.date === "string" ? t.date : "", ...toBucket(t) },
    week: toBucket(o.week),
    month: toBucket(o.month),
    allTime: toBucket(o.allTime),
    status: {
      active: Number(s.active ?? 0),
      pending: Number(s.pending ?? 0),
      featured: Number(s.featured ?? 0),
      expired: Number(s.expired ?? 0),
      totalViews: Number(s.totalViews ?? 0),
    },
    days: (o.days as unknown[]).map((d) => {
      const row = (d && typeof d === "object" ? d : {}) as Record<string, unknown>;
      return { date: typeof row.date === "string" ? row.date : "", ...toBucket(row) };
    }),
  };
}

export function JobPostingsStatsWidget({ adminFetch }: { adminFetch: (url: string) => Promise<any> }) {
  const [data, setData] = useState<JobPostingsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState<string>("");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsFetching(true);
      setFetchError(null);
      const raw = await adminFetch("/api/admin/job-postings-stats");
      const stats = normalizeStats(raw);
      if (!stats) {
        setFetchError("Unexpected response from server.");
        setData(null);
      } else {
        setData(stats);
        const now = new Date();
        setLastUpdatedLabel(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
      }
    } catch (error) {
      console.error("Failed to fetch job postings stats:", error);
      setFetchError(error instanceof Error ? error.message : "Failed to load stats.");
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchStats();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Job Postings Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-40" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Job Postings Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fetchError ? (
            <p className="text-sm text-destructive">{fetchError}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No statistics available yet.</p>
          )}
          <Button variant="outline" size="sm" onClick={() => fetchStats()} disabled={isFetching || isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const maxVal = Math.max(...data.days.map((d) => Math.max(d.postings, d.applications)), 1);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Job Postings Analytics
            <span className="flex items-center gap-1 ml-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs font-normal text-green-600">Live</span>
            </span>
          </CardTitle>
          <div className="flex items-center gap-3">
            {lastUpdatedLabel && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdatedLabel}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isFetching || isRefreshing}
              className="h-8 px-2"
            >
              <RefreshCw className={`h-4 w-4 ${(isFetching || isRefreshing) ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Current Board Status */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          <div className="bg-muted/40 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{data.status.active}</p>
            <p className="text-xs text-muted-foreground mt-1">Active</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data.status.pending}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending Approval</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.status.featured}</p>
            <p className="text-xs text-muted-foreground mt-1">Featured</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{data.status.expired}</p>
            <p className="text-xs text-muted-foreground mt-1">Expired</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{data.status.totalViews}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Views</p>
          </div>
        </div>

        {/* Key Metrics - Four Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Today Section */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Today</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 dark:bg-blue-950/40 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{data.today.postings}</p>
                <p className="text-xs text-muted-foreground mt-1">Postings</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/40 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{data.today.applications}</p>
                <p className="text-xs text-muted-foreground mt-1">Applications</p>
              </div>
            </div>
          </div>

          {/* Week Section */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">This Week</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50/70 dark:bg-blue-950/25 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-500">{data.week.postings}</p>
                <p className="text-xs text-muted-foreground mt-1">Postings</p>
              </div>
              <div className="bg-green-50/70 dark:bg-green-950/25 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{data.week.applications}</p>
                <p className="text-xs text-muted-foreground mt-1">Applications</p>
              </div>
            </div>
          </div>

          {/* Last 30 Days Section */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Last 30 Days</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50/70 dark:bg-blue-950/25 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-500">{data.month.postings}</p>
                <p className="text-xs text-muted-foreground mt-1">Postings</p>
              </div>
              <div className="bg-green-50/70 dark:bg-green-950/25 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{data.month.applications}</p>
                <p className="text-xs text-muted-foreground mt-1">Applications</p>
              </div>
            </div>
          </div>

          {/* All-Time Section */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">All Time</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-center border border-blue-100 dark:border-blue-900">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{data.allTime.postings}</p>
                <p className="text-xs text-muted-foreground mt-1">Postings</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center border border-green-100 dark:border-green-900">
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{data.allTime.applications}</p>
                <p className="text-xs text-muted-foreground mt-1">Applications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4 pb-4 border-t">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block w-3 h-3 rounded bg-blue-400" /> New Postings
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block w-3 h-3 rounded bg-green-500" /> Applications
          </span>
        </div>

        {/* 7-Day Trend Chart */}
        <div className="space-y-2">
          {data.days.map((d) => (
            <div key={d.date} className="flex items-center gap-2 sm:gap-3 text-xs">
              <span className="w-16 sm:w-20 text-muted-foreground shrink-0 font-medium">
                {formatTrafficChartDayLabel(d.date)}
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted/30 rounded h-3 overflow-hidden">
                    <div
                      className="h-full rounded bg-blue-400 transition-all duration-500"
                      style={{ width: `${Math.max((d.postings / maxVal) * 100, d.postings > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-16 sm:w-20 text-right">{d.postings} posted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted/30 rounded h-3 overflow-hidden">
                    <div
                      className="h-full rounded bg-green-500 transition-all duration-500"
                      style={{ width: `${Math.max((d.applications / maxVal) * 100, d.applications > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-16 sm:w-20 text-right">{d.applications} apps</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4 pt-3">
          7-day trend (oldest to newest). Daily totals use US Mountain Time (Phoenix)—the &quot;Today&quot; row is the current Phoenix calendar day. Refreshes every 30 seconds.
        </p>
      </CardContent>
    </Card>
  );
}

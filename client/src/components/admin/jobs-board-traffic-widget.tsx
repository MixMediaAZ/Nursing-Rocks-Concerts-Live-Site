import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users } from "lucide-react";

interface JobsBoardStats {
  today: { date: string; uniqueVisits: number; returningVisits: number };
  week: { uniqueVisits: number; returningVisits: number };
  allTime: { uniqueVisits: number; returningVisits: number };
  days: { date: string; uniqueVisits: number; returningVisits: number }[];
}

export function JobsBoardTrafficWidget({ adminFetch }: { adminFetch: (url: string) => Promise<any> }) {
  const [data, setData] = useState<JobsBoardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState<string>("");

  const fetchStats = async () => {
    try {
      setIsFetching(true);
      const stats = await adminFetch("/api/admin/jobs-board-stats");
      setData(stats);
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
      setLastUpdatedLabel(timeStr);
    } catch (error) {
      console.error("Failed to fetch jobs board stats:", error);
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
            <Users className="h-5 w-5" /> Jobs Board Traffic
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
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Jobs Board Traffic
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
        {/* Key Metrics - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Today Section */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Today</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 dark:bg-blue-950/40 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{data.today.uniqueVisits}</p>
                <p className="text-xs text-muted-foreground mt-1">Unique</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/40 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{data.today.returningVisits}</p>
                <p className="text-xs text-muted-foreground mt-1">Returning</p>
              </div>
            </div>
          </div>

          {/* Week Section */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">This Week</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50/70 dark:bg-blue-950/25 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-500">{data.week.uniqueVisits}</p>
                <p className="text-xs text-muted-foreground mt-1">Unique</p>
              </div>
              <div className="bg-green-50/70 dark:bg-green-950/25 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{data.week.returningVisits}</p>
                <p className="text-xs text-muted-foreground mt-1">Returning</p>
              </div>
            </div>
          </div>

          {/* All-Time Section */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">All Time</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-center border border-blue-100 dark:border-blue-900">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{data.allTime.uniqueVisits}</p>
                <p className="text-xs text-muted-foreground mt-1">Unique</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center border border-green-100 dark:border-green-900">
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{data.allTime.returningVisits}</p>
                <p className="text-xs text-muted-foreground mt-1">Returning</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4 pb-4 border-t">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block w-3 h-3 rounded bg-blue-500" /> Unique Visitors
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block w-3 h-3 rounded bg-green-500" /> Returning Visitors
          </span>
        </div>

        {/* 7-Day Trend Chart */}
        <div className="space-y-2">
          {data.days.map((d) => (
            <div key={d.date} className="flex items-center gap-2 sm:gap-3 text-xs">
              <span className="w-16 sm:w-20 text-muted-foreground shrink-0 font-medium">
                {new Date(d.date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted/30 rounded h-3 overflow-hidden">
                    <div
                      className="h-full rounded bg-blue-500 transition-all duration-500"
                      style={{ width: `${Math.max((d.uniqueVisits / Math.max(...data.days.map(x => Math.max(x.uniqueVisits, x.returningVisits)), 1)) * 100, d.uniqueVisits > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-14 sm:w-16 text-right">{d.uniqueVisits} unique</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted/30 rounded h-3 overflow-hidden">
                    <div
                      className="h-full rounded bg-green-500 transition-all duration-500"
                      style={{ width: `${Math.max((d.returningVisits / Math.max(...data.days.map(x => Math.max(x.uniqueVisits, x.returningVisits)), 1)) * 100, d.returningVisits > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-14 sm:w-16 text-right">{d.returningVisits} ret.</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4 pt-3">
          7-day trend view. Refreshes every 30 seconds. Tracking is privacy-safe (hashed IP + user agent).
        </p>
      </CardContent>
    </Card>
  );
}

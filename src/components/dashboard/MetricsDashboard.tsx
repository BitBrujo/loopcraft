"use client";

import { useEffect, useState } from 'react';
import { Activity, Clock, CheckCircle2, XCircle, Database } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
}

function MetricCard({ title, value, icon, trend, color = 'text-primary' }: MetricCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
        </div>
        <div className={`${color} opacity-20`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function MetricsDashboard() {
  const { metrics, updateMetrics, debugEntries, refreshTrigger } = useDashboardStore();
  const [latencyData, setLatencyData] = useState<Array<{ time: string; latency: number }>>([]);
  const [callsData, setCallsData] = useState<Array<{ time: string; success: number; error: number }>>([]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      const data = await response.json();

      if (data.success) {
        updateMetrics({
          activeConnections: data.metrics.activeConnections,
          toolCalls: data.metrics.totalTools,
        });
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  useEffect(() => {
    // Process debug entries for charts
    const last10Entries = debugEntries.slice(-10);

    // Latency data
    const latency = last10Entries.map(entry => ({
      time: format(entry.timestamp, 'HH:mm:ss'),
      latency: entry.duration || 0,
    }));
    setLatencyData(latency);

    // Success/Error data
    const calls = last10Entries.reduce((acc, entry) => {
      const timeKey = format(entry.timestamp, 'HH:mm');
      const existing = acc.find(item => item.time === timeKey);

      if (existing) {
        if (entry.status === 'success') existing.success++;
        if (entry.status === 'error') existing.error++;
      } else {
        acc.push({
          time: timeKey,
          success: entry.status === 'success' ? 1 : 0,
          error: entry.status === 'error' ? 1 : 0,
        });
      }

      return acc;
    }, [] as Array<{ time: string; success: number; error: number }>);
    setCallsData(calls);

    // Calculate success rate
    const successCount = debugEntries.filter(e => e.status === 'success').length;
    const totalCount = debugEntries.length;
    const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;

    // Calculate average latency
    const avgLatency = debugEntries.length > 0
      ? Math.round(debugEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / debugEntries.length)
      : 0;

    // Error count
    const errorCount = debugEntries.filter(e => e.status === 'error').length;

    updateMetrics({
      successRate,
      averageLatency: avgLatency,
      errorCount,
      toolCalls: debugEntries.length,
    });
  }, [debugEntries]);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Performance Metrics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time monitoring of MCP operations
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Active Connections"
            value={metrics.activeConnections}
            icon={<Database className="size-12" />}
            color="text-blue-500"
            trend="MCP servers connected"
          />
          <MetricCard
            title="Tool Calls"
            value={metrics.toolCalls}
            icon={<Activity className="size-12" />}
            color="text-green-500"
            trend="Total operations"
          />
          <MetricCard
            title="Success Rate"
            value={`${metrics.successRate}%`}
            icon={<CheckCircle2 className="size-12" />}
            color="text-emerald-500"
            trend="Operation success"
          />
          <MetricCard
            title="Avg Latency"
            value={`${metrics.averageLatency}ms`}
            icon={<Clock className="size-12" />}
            color="text-orange-500"
            trend="Response time"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latency Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Response Latency</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="time"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'ms', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Success/Error Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Operation Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={callsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="time"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem'
                  }}
                />
                <Bar dataKey="success" fill="hsl(var(--chart-1))" stackId="a" />
                <Bar dataKey="error" fill="hsl(var(--destructive))" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Error Summary */}
        {metrics.errorCount > 0 && (
          <Card className="p-6 border-destructive/50 bg-destructive/5">
            <div className="flex items-start gap-3">
              <XCircle className="size-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold">Error Summary</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {metrics.errorCount} error{metrics.errorCount !== 1 ? 's' : ''} detected in recent operations.
                  Check the Debugger panel for details.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground text-center">
          Last updated: {format(metrics.lastUpdated, 'PPpp')}
        </div>
      </div>
    </ScrollArea>
  );
}
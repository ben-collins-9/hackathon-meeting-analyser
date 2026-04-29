import { useState, useMemo } from 'react';
import type { Conversation, MeetingProposal } from '../../lib/database.types';
import {
  TrendingUp, TrendingDown, Clock, Users, CheckCircle, XCircle,
  Calendar, MessageSquare, Download, ChevronDown,
  Zap, BarChart2, Activity,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

type Period = '7d' | '30d' | '90d' | 'all';
type StatusFilter = 'all' | 'pending' | 'accepted' | 'scheduled' | 'declined';

interface BucketData {
  label: string;
  date: Date;
  meetings: number;     // proposals that became accepted/scheduled
  avoided: number;      // declined proposals
  pending: number;
  asyncOnly: number;    // conversations with no resulting proposal
  totalMins: number;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function subDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - n);
  return r;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatHM(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ---------------------------------------------------------------------------
// Chart primitives (SVG, no external deps)
// ---------------------------------------------------------------------------

interface LineChartProps {
  data: { label: string; value: number; date: Date }[];
  color: string;
  height?: number;
  fillColor?: string;
}

function LineChart({ data, color, height = 80, fillColor }: LineChartProps) {
  if (data.length < 2) return <div className="flex items-center justify-center h-20 text-xs text-gray-400">Not enough data</div>;
  const w = 400;
  const h = height;
  const pad = { t: 8, r: 8, b: 20, l: 32 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  const pts = data.map((d, i) => ({
    x: pad.l + (i / (data.length - 1)) * iw,
    y: pad.t + ih - (d.value / maxVal) * ih,
    ...d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(pad.t + ih).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(pad.t + ih).toFixed(1)} Z`;

  // y-axis ticks
  const ticks = [0, maxVal / 2, maxVal].map((v) => ({
    y: pad.t + ih - (v / maxVal) * ih,
    label: Math.round(v),
  }));

  // x-axis labels — show ~4 evenly spaced
  const xLabels = [0, Math.floor((data.length - 1) / 3), Math.floor((2 * (data.length - 1)) / 3), data.length - 1]
    .filter((v, i, a) => a.indexOf(v) === i)
    .map((i) => ({ x: pts[i].x, label: formatDateShort(data[i].date) }));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      {/* Grid lines */}
      {ticks.map((t, i) => (
        <line key={i} x1={pad.l} y1={t.y} x2={pad.l + iw} y2={t.y} stroke="#f3f4f6" strokeWidth="1" />
      ))}
      {/* Y-axis labels */}
      {ticks.map((t, i) => (
        <text key={i} x={pad.l - 4} y={t.y + 3} textAnchor="end" fontSize="9" fill="#9ca3af">{t.label}</text>
      ))}
      {/* Area fill */}
      {fillColor && <path d={areaPath} fill={fillColor} opacity="0.15" />}
      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}
      {/* X-axis labels */}
      {xLabels.map((xl, i) => (
        <text key={i} x={xl.x} y={h - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">{xl.label}</text>
      ))}
    </svg>
  );
}

interface BarChartProps {
  data: { label: string; date: Date; meetings: number; avoided: number; asyncOnly: number }[];
  height?: number;
}

function BarChart({ data, height = 120 }: BarChartProps) {
  if (data.length === 0) return <div className="flex items-center justify-center h-24 text-xs text-gray-400">No data</div>;
  const w = 400;
  const h = height;
  const pad = { t: 8, r: 8, b: 22, l: 32 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const maxVal = Math.max(...data.map((d) => d.meetings + d.avoided + d.asyncOnly), 1);

  const barW = Math.max(4, (iw / data.length) * 0.7);
  const gap = iw / data.length;

  const ticks = [0, Math.round(maxVal / 2), maxVal].map((v) => ({
    y: pad.t + ih - (v / maxVal) * ih,
    label: v,
  }));

  const xLabels = data.length <= 10
    ? data.map((d, i) => ({ x: pad.l + i * gap + gap / 2, label: formatDateShort(d.date) }))
    : [0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) => ({
        x: pad.l + i * gap + gap / 2,
        label: formatDateShort(data[i].date),
      }));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      {ticks.map((t, i) => (
        <line key={i} x1={pad.l} y1={t.y} x2={pad.l + iw} y2={t.y} stroke="#f3f4f6" strokeWidth="1" />
      ))}
      {ticks.map((t, i) => (
        <text key={i} x={pad.l - 4} y={t.y + 3} textAnchor="end" fontSize="9" fill="#9ca3af">{t.label}</text>
      ))}
      {data.map((d, i) => {
        const cx = pad.l + i * gap + gap / 2;
        const x = cx - barW / 2;
        const meetH = (d.meetings / maxVal) * ih;
        const avoidH = (d.avoided / maxVal) * ih;
        const asyncH = (d.asyncOnly / maxVal) * ih;
        const stackBase = pad.t + ih;
        return (
          <g key={i}>
            {/* async only — bottom */}
            <rect x={x} y={stackBase - asyncH} width={barW} height={asyncH} fill="#6ee7b7" rx="1" />
            {/* avoided — middle */}
            <rect x={x} y={stackBase - asyncH - avoidH} width={barW} height={avoidH} fill="#fca5a5" rx="1" />
            {/* meetings — top */}
            <rect x={x} y={stackBase - asyncH - avoidH - meetH} width={barW} height={meetH} fill="#60a5fa" rx="1" />
          </g>
        );
      })}
      {xLabels.map((xl, i) => (
        <text key={i} x={xl.x} y={h - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">{xl.label}</text>
      ))}
    </svg>
  );
}

interface DonutProps {
  slices: { value: number; color: string; label: string }[];
  size?: number;
}

function Donut({ slices, size = 80 }: DonutProps) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return (
    <svg viewBox="0 0 80 80" style={{ width: size, height: size }}>
      <circle cx="40" cy="40" r="30" fill="none" stroke="#f3f4f6" strokeWidth="12" />
      <text x="40" y="44" textAnchor="middle" fontSize="10" fill="#9ca3af">—</text>
    </svg>
  );

  let cumAngle = -Math.PI / 2;
  const r = 30;
  const cx = 40;
  const cy = 40;
  const strokeW = 12;

  const paths = slices.map((s) => {
    const angle = (s.value / total) * 2 * Math.PI;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { ...s, d: `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}` };
  });

  return (
    <svg viewBox="0 0 80 80" style={{ width: size, height: size }}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill="none" stroke={p.color} strokeWidth={strokeW} strokeLinecap="butt" />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fontWeight="600" fill="#111827">
        {total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#6b7280">total</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  accent?: string;
}

function KpiCard({ label, value, sub, icon, trend, accent = 'bg-gray-50' }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${accent} flex items-center justify-center`}>{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className={`inline-flex items-center gap-1 text-xs font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend.value >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export helper
// ---------------------------------------------------------------------------

function exportCSV(data: BucketData[], filename: string) {
  const header = 'Date,Meetings,Avoided,Pending,AsyncOnly,TotalMins';
  const rows = data.map((d) =>
    `${formatDate(d.date)},${d.meetings},${d.avoided},${d.pending},${d.asyncOnly},${d.totalMins}`
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

interface Props {
  conversations: Conversation[];
  proposals: MeetingProposal[];
}

export default function AnalyticsDashboard({ conversations, proposals }: Props) {
  const [period, setPeriod] = useState<Period>('30d');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  const PERIOD_LABELS: Record<Period, string> = { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', all: 'All time' };

  // Filter proposals by period & status
  const filteredProposals = useMemo(() => {
    const now = new Date();
    const cutoff = period === 'all' ? null
      : subDays(now, period === '7d' ? 7 : period === '30d' ? 30 : 90);
    return proposals.filter((p) => {
      if (cutoff && new Date(p.created_at) < cutoff) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      return true;
    });
  }, [proposals, period, statusFilter]);

  // All proposals in period (regardless of status filter) for aggregate KPIs
  const periodProposals = useMemo(() => {
    const now = new Date();
    const cutoff = period === 'all' ? null
      : subDays(now, period === '7d' ? 7 : period === '30d' ? 30 : 90);
    return proposals.filter((p) => !cutoff || new Date(p.created_at) >= cutoff);
  }, [proposals, period]);

  // Conversations in period
  const periodConversations = useMemo(() => {
    const now = new Date();
    const cutoff = period === 'all' ? null
      : subDays(now, period === '7d' ? 7 : period === '30d' ? 30 : 90);
    return conversations.filter((c) => !cutoff || new Date(c.created_at) >= cutoff);
  }, [conversations, period]);

  // Build daily buckets
  const buckets = useMemo((): BucketData[] => {
    const now = startOfDay(new Date());
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 120;
    const arr: BucketData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = date.toDateString();

      const dayProposals = periodProposals.filter((p) => new Date(p.created_at).toDateString() === dateStr);
      const dayConvs = conversations.filter((c) => new Date(c.created_at).toDateString() === dateStr);

      const meetings = dayProposals.filter((p) => p.status === 'accepted' || p.status === 'scheduled').length;
      const avoided = dayProposals.filter((p) => p.status === 'declined').length;
      const pending = dayProposals.filter((p) => p.status === 'pending').length;
      // Conversations that have no proposal at all
      const proposalConvIds = new Set(dayProposals.map((p) => p.conversation_id));
      const asyncOnly = dayConvs.filter((c) => !proposalConvIds.has(c.id)).length;
      const totalMins = dayProposals
        .filter((p) => p.status === 'accepted' || p.status === 'scheduled')
        .reduce((s, p) => s + p.suggested_duration_mins, 0);

      arr.push({ label: formatDate(date), date, meetings, avoided, pending, asyncOnly, totalMins });
    }
    return arr;
  }, [periodProposals, conversations, period]);

  // Weekly rollup for coarser view
  const weeklyBuckets = useMemo((): BucketData[] => {
    const result: BucketData[] = [];
    for (let i = 0; i < buckets.length; i += 7) {
      const week = buckets.slice(i, i + 7);
      result.push({
        label: `W/E ${formatDate(week[week.length - 1].date)}`,
        date: week[week.length - 1].date,
        meetings: week.reduce((s, d) => s + d.meetings, 0),
        avoided: week.reduce((s, d) => s + d.avoided, 0),
        pending: week.reduce((s, d) => s + d.pending, 0),
        asyncOnly: week.reduce((s, d) => s + d.asyncOnly, 0),
        totalMins: week.reduce((s, d) => s + d.totalMins, 0),
      });
    }
    return result;
  }, [buckets]);

  const displayBuckets = period === '90d' || period === 'all' ? weeklyBuckets : buckets;

  // KPIs
  const totalMeetings = periodProposals.filter((p) => p.status === 'accepted' || p.status === 'scheduled').length;
  const totalAvoided = periodProposals.filter((p) => p.status === 'declined').length;
  const totalPending = periodProposals.filter((p) => p.status === 'pending').length;
  const totalMins = periodProposals
    .filter((p) => p.status === 'accepted' || p.status === 'scheduled')
    .reduce((s, p) => s + p.suggested_duration_mins, 0);
  const totalParticipants = periodProposals
    .filter((p) => p.status === 'accepted' || p.status === 'scheduled')
    .reduce((s, p) => s + (p.participants as string[]).length, 0);
  const totalProposals = periodProposals.length;
  const asyncRate = totalProposals > 0 ? Math.round(((totalAvoided) / totalProposals) * 100) : 0;

  // Urgency breakdown
  const urgencyBreakdown = {
    high: filteredProposals.filter((p) => p.urgency === 'high').length,
    medium: filteredProposals.filter((p) => p.urgency === 'medium').length,
    low: filteredProposals.filter((p) => p.urgency === 'low').length,
  };

  // Platform breakdown
  const platformCounts = periodConversations.reduce<Record<string, number>>((acc, c) => {
    acc[c.platform] = (acc[c.platform] ?? 0) + 1;
    return acc;
  }, {});
  const platforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]);

  // Trend vs previous period
  const trendMultiplier = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const prevCutoff = subDays(new Date(), trendMultiplier * 2);
  const prevEnd = subDays(new Date(), trendMultiplier);
  const prevMeetings = proposals.filter((p) => {
    const d = new Date(p.created_at);
    return d >= prevCutoff && d < prevEnd && (p.status === 'accepted' || p.status === 'scheduled');
  }).length;
  const meetingsTrend = prevMeetings > 0 ? Math.round(((totalMeetings - prevMeetings) / prevMeetings) * 100) : 0;

  // Line chart data series
  const meetingsLine = displayBuckets.map((b) => ({ label: b.label, value: b.meetings, date: b.date }));
  const avoidedLine = displayBuckets.map((b) => ({ label: b.label, value: b.avoided, date: b.date }));
  const timeLine = displayBuckets.map((b) => ({ label: b.label, value: b.totalMins, date: b.date }));

  // Top proposals by score
  const topProposals = [...filteredProposals]
    .sort((a, b) => (b.analysis_score ?? 0) - (a.analysis_score ?? 0))
    .slice(0, 5);

  const STATUS_COLORS: Record<string, string> = {
    pending: '#fbbf24',
    accepted: '#34d399',
    scheduled: '#60a5fa',
    declined: '#f87171',
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    scheduled: 'Scheduled',
    declined: 'Declined',
  };

  const donutSlices = (['pending', 'accepted', 'scheduled', 'declined'] as const).map((s) => ({
    value: periodProposals.filter((p) => p.status === s).length,
    color: STATUS_COLORS[s],
    label: STATUS_LABELS[s],
  }));

  const PLATFORM_COLORS: Record<string, string> = {
    slack: '#10b981', email: '#0ea5e9', github: '#6b7280', jira: '#3b82f6',
    discord: '#8b5cf6', teams: '#14b8a6',
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Period selector */}
        <div className="relative">
          <button
            onClick={() => setShowPeriodMenu((p) => !p)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Calendar size={12} />
            {PERIOD_LABELS[period]}
            <ChevronDown size={11} />
          </button>
          {showPeriodMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
              {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => { setPeriod(k); setShowPeriodMenu(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${k === period ? 'bg-gray-50 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['all', 'pending', 'accepted', 'scheduled', 'declined'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all capitalize ${
                statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => exportCSV(displayBuckets, `meetdetect-${period}.csv`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Meetings Held"
          value={totalMeetings}
          icon={<Calendar size={15} className="text-blue-600" />}
          accent="bg-blue-50"
          trend={period !== 'all' ? { value: meetingsTrend, label: 'vs prev' } : undefined}
        />
        <KpiCard
          label="Meetings Avoided"
          value={totalAvoided}
          sub={totalProposals > 0 ? `${asyncRate}% deflection rate` : undefined}
          icon={<XCircle size={15} className="text-green-600" />}
          accent="bg-green-50"
        />
        <KpiCard
          label="Time in Meetings"
          value={formatHM(totalMins)}
          sub={totalMeetings > 0 ? `avg ${formatHM(Math.round(totalMins / totalMeetings))} each` : undefined}
          icon={<Clock size={15} className="text-amber-600" />}
          accent="bg-amber-50"
        />
        <KpiCard
          label="Conversations"
          value={periodConversations.length}
          icon={<MessageSquare size={15} className="text-teal-600" />}
          accent="bg-teal-50"
        />
        <KpiCard
          label="Participants"
          value={totalParticipants}
          sub={totalMeetings > 0 ? `avg ${(totalParticipants / totalMeetings).toFixed(1)} per meeting` : undefined}
          icon={<Users size={15} className="text-gray-600" />}
          accent="bg-gray-100"
        />
        <KpiCard
          label="Pending Review"
          value={totalPending}
          icon={<Activity size={15} className="text-orange-500" />}
          accent="bg-orange-50"
        />
      </div>

      {/* Charts row 1 — trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Meetings vs avoided over time */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Meeting Trends</p>
              <p className="text-xs text-gray-400 mt-0.5">Meetings held vs avoided over time</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />Held</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-400 inline-block rounded" />Avoided</span>
            </div>
          </div>
          <LineChart data={meetingsLine} color="#3b82f6" fillColor="#3b82f6" height={100} />
          <div className="mt-2">
            <LineChart data={avoidedLine} color="#f87171" fillColor="#f87171" height={80} />
          </div>
        </div>

        {/* Stacked bar — meetings / avoided / async */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Meeting vs Async</p>
              <p className="text-xs text-gray-400 mt-0.5">Proposals breakdown by outcome</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" />Meetings</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-300 inline-block" />Avoided</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-300 inline-block" />Async</span>
            </div>
          </div>
          <BarChart data={displayBuckets} height={160} />
        </div>
      </div>

      {/* Charts row 2 — time + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Time in meetings */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Time in Meetings</p>
              <p className="text-xs text-gray-400 mt-0.5">Total minutes of meetings held per {period === '90d' || period === 'all' ? 'week' : 'day'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Total:</span>
              <span className="text-sm font-semibold text-gray-900">{formatHM(totalMins)}</span>
            </div>
          </div>
          <LineChart data={timeLine} color="#f59e0b" fillColor="#f59e0b" height={120} />
        </div>

        {/* Proposal status donut */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-900 mb-4">Status Breakdown</p>
          <div className="flex flex-col items-center gap-4">
            <Donut slices={donutSlices} size={100} />
            <div className="w-full space-y-2">
              {donutSlices.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: s.color }} />
                    <span className="text-gray-600">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{s.value}</span>
                    <span className="text-gray-400 w-8 text-right">
                      {totalProposals > 0 ? `${Math.round((s.value / totalProposals) * 100)}%` : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 — urgency + platform + top proposals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Urgency breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-900 mb-4">Urgency Distribution</p>
          <div className="space-y-3">
            {([['high', 'High urgency', '#ef4444', urgencyBreakdown.high],
               ['medium', 'Medium urgency', '#f59e0b', urgencyBreakdown.medium],
               ['low', 'Low urgency', '#3b82f6', urgencyBreakdown.low]] as const).map(([key, label, color, count]) => {
              const total = urgencyBreakdown.high + urgencyBreakdown.medium + urgencyBreakdown.low;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Async vs sync ratio */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-600 mb-3">Sync vs Async Ratio</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-400 transition-all" style={{ width: `${100 - asyncRate}%` }} />
                <div className="h-full bg-emerald-400 transition-all" style={{ width: `${asyncRate}%` }} />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1.5">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-400 inline-block" />{100 - asyncRate}% sync</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" />{asyncRate}% avoided</span>
            </div>
          </div>
        </div>

        {/* Platform breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-900 mb-4">Conversations by Platform</p>
          {platforms.length === 0 ? (
            <p className="text-xs text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {platforms.map(([platform, count]) => {
                const pct = periodConversations.length > 0 ? (count / periodConversations.length) * 100 : 0;
                const color = PLATFORM_COLORS[platform] ?? '#6b7280';
                return (
                  <div key={platform}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600 capitalize">{platform}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-900">{count}</span>
                        <span className="text-gray-400">{Math.round(pct)}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top proposals by score */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={14} className="text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">Highest Urgency Proposals</p>
          </div>
          {topProposals.length === 0 ? (
            <p className="text-xs text-gray-400">No proposals yet in this period</p>
          ) : (
            <div className="space-y-3">
              {topProposals.map((p) => (
                <div key={p.id} className="flex items-start gap-2.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: STATUS_COLORS[p.status] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{p.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs capitalize ${
                        p.urgency === 'high' ? 'text-red-500' : p.urgency === 'medium' ? 'text-amber-500' : 'text-sky-500'
                      }`}>{p.urgency}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{p.suggested_duration_mins}m</span>
                      {p.analysis_score != null && (
                        <>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-400">score {p.analysis_score}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0"
                    style={{ background: STATUS_COLORS[p.status] + '22', color: STATUS_COLORS[p.status] }}
                  >
                    {STATUS_LABELS[p.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empty state if no data */}
      {periodProposals.length === 0 && periodConversations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Zap size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-600 text-sm font-medium">No data for this period</p>
          <p className="text-gray-400 text-xs mt-1">Add conversations and let MeetDetect analyze them to see analytics here.</p>
        </div>
      )}

      {/* Time saved callout */}
      {totalAvoided > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              Estimated {formatHM(totalAvoided * 30)} saved by avoiding {totalAvoided} meeting{totalAvoided !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Based on an average 30-minute meeting that was resolved asynchronously.
            </p>
          </div>
          <div className="ml-auto text-right shrink-0 hidden sm:block">
            <p className="text-2xl font-bold text-emerald-700">{asyncRate}%</p>
            <p className="text-xs text-emerald-600">deflection rate</p>
          </div>
        </div>
      )}
    </div>
  );
}

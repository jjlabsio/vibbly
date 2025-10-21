import { getTranslations } from "next-intl/server";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@vibbly/ui/components/card";
import { Input } from "@vibbly/ui/components/input";
import { Button } from "@vibbly/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@vibbly/ui/components/table";

type KpiMetric = {
  id: string;
  label: string;
  value: number;
  delta: number;
  baseline: string;
};

type TrendPoint = {
  date: string;
  label: string;
  detections: number;
  deletions: number;
};

type ExecutionRun = {
  time: string;
  status: "success" | "warning" | "error";
  detections: number;
  deletions: number;
  duration: string;
};

type ChannelSummary = {
  id: string;
  name: string;
  status: "healthy" | "warning" | "disabled";
  todayDetections: number;
  todayDeletions: number;
  lifetimeDetections: number;
  lifetimeDeletions: number;
  lastIncident?: string;
};

type AlertItem = {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
};

type ActivityItem = {
  id: string;
  comment: string;
  channel: string;
  rule: string;
  removedAt: string;
};

type SnapshotMetric = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};

const KPI_DATA: KpiMetric[] = [
  {
    id: "today-auto-deletes",
    label: "오늘 자동 삭제",
    value: 128,
    delta: 12,
    baseline: "전일 114건",
  },
  {
    id: "today-detections",
    label: "오늘 탐지",
    value: 186,
    delta: -5,
    baseline: "전일 196건",
  },
  {
    id: "lifetime-auto-deletes",
    label: "누적 자동 삭제",
    value: 3124,
    delta: 4,
    baseline: "이번 주 +4.3%",
  },
  {
    id: "lifetime-detections",
    label: "누적 탐지",
    value: 3876,
    delta: 6,
    baseline: "이번 주 +6.1%",
  },
];

const TREND_DATA: TrendPoint[] = [
  { date: "2024-06-01", label: "6/1", detections: 142, deletions: 118 },
  { date: "2024-06-02", label: "6/2", detections: 156, deletions: 132 },
  { date: "2024-06-03", label: "6/3", detections: 162, deletions: 142 },
  { date: "2024-06-04", label: "6/4", detections: 148, deletions: 120 },
  { date: "2024-06-05", label: "6/5", detections: 174, deletions: 150 },
  { date: "2024-06-06", label: "6/6", detections: 168, deletions: 149 },
  { date: "2024-06-07", label: "6/7", detections: 182, deletions: 161 },
  { date: "2024-06-08", label: "6/8", detections: 176, deletions: 164 },
  { date: "2024-06-09", label: "6/9", detections: 190, deletions: 170 },
  { date: "2024-06-10", label: "6/10", detections: 204, deletions: 182 },
  { date: "2024-06-11", label: "6/11", detections: 198, deletions: 176 },
  { date: "2024-06-12", label: "6/12", detections: 186, deletions: 172 },
  { date: "2024-06-13", label: "6/13", detections: 192, deletions: 180 },
  { date: "2024-06-14", label: "6/14", detections: 206, deletions: 188 },
];

const EXECUTION_STATUS = {
  lastRun: {
    time: "2024-06-14 09:45",
    duration: "2분 14초",
    processed: "312건 처리 (탐지 206 · 삭제 188)",
    status: "success" as const,
  },
  nextRun: "2024-06-14 10:00 예정",
  recentRuns: [
    { time: "09:45", status: "success", detections: 206, deletions: 188, duration: "02:14" },
    { time: "08:45", status: "warning", detections: 198, deletions: 170, duration: "02:28" },
    { time: "07:45", status: "success", detections: 186, deletions: 172, duration: "02:12" },
  ] satisfies ExecutionRun[],
};

const CHANNEL_SUMMARY: ChannelSummary[] = [
  {
    id: "channel-1",
    name: "Vibbly Official",
    status: "healthy",
    todayDetections: 78,
    todayDeletions: 72,
    lifetimeDetections: 1764,
    lifetimeDeletions: 1642,
  },
  {
    id: "channel-2",
    name: "Growth Playbook",
    status: "warning",
    todayDetections: 46,
    todayDeletions: 38,
    lifetimeDetections: 982,
    lifetimeDeletions: 864,
    lastIncident: "삭제 실패 2건 (09:12)",
  },
  {
    id: "channel-3",
    name: "Dev Vibes",
    status: "healthy",
    todayDetections: 32,
    todayDeletions: 28,
    lifetimeDetections: 624,
    lifetimeDeletions: 588,
  },
  {
    id: "channel-4",
    name: "Creator Sandbox",
    status: "disabled",
    todayDetections: 0,
    todayDeletions: 0,
    lifetimeDetections: 506,
    lifetimeDeletions: 438,
    lastIncident: "연결 비활성 (어제 18:04)",
  },
];

const ALERTS: AlertItem[] = [
  {
    id: "token-expiry",
    title: "YouTube 토큰 만료까지 5일 남음",
    description: "채널 4개에서 토큰 갱신이 필요합니다.",
    severity: "warning",
    timestamp: "10분 전",
  },
  {
    id: "deletion-failed",
    title: "자동 삭제 실패 2건",
    description: "Growth Playbook에서 API 제한으로 일부 댓글 삭제가 지연되었습니다.",
    severity: "critical",
    timestamp: "23분 전",
  },
  {
    id: "sync-delay",
    title: "탐지 스케줄 지연",
    description: "07:45 회차가 4분 지연되었습니다. 현재는 정상화되었습니다.",
    severity: "info",
    timestamp: "1시간 전",
  },
];

const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: "activity-1",
    comment: "무료 구독자 늘리는 법 알려드려요 👉 suspicious.link",
    channel: "Vibbly Official",
    rule: "의심 링크",
    removedAt: "09:47 삭제",
  },
  {
    id: "activity-2",
    comment: "너네 제품 완전 사기임. 환불 안하면 고소",
    channel: "Growth Playbook",
    rule: "공격적 어투",
    removedAt: "09:46 삭제",
  },
  {
    id: "activity-3",
    comment: "Check new AI tool ➜ spam-site.io",
    channel: "Dev Vibes",
    rule: "외부 링크",
    removedAt: "09:43 삭제",
  },
];

const SNAPSHOT: SnapshotMetric[] = [
  {
    id: "connected-channels",
    label: "연결된 채널",
    value: "6개",
    hint: "1개 비활성",
  },
  {
    id: "active-rules",
    label: "활성 탐지 규칙",
    value: "8개",
    hint: "신규 2개 (이번 주)",
  },
  {
    id: "notification-channels",
    label: "알림 채널",
    value: "Slack · 이메일",
    hint: "모두 정상",
  },
  {
    id: "data-sync",
    label: "데이터 동기화",
    value: "최근 12분 전",
    hint: "스케줄 15분 간격",
  },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function getDeltaColor(delta: number) {
  if (delta > 0) {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }
  if (delta < 0) {
    return "bg-destructive/10 text-destructive";
  }
  return "bg-muted text-muted-foreground";
}

function getRunStatusColor(status: ExecutionRun["status"]) {
  switch (status) {
    case "success":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "warning":
      return "bg-amber-500/10 text-amber-600";
    case "error":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getChannelStatusBadge(status: ChannelSummary["status"]) {
  switch (status) {
    case "healthy":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "warning":
      return "bg-amber-500/10 text-amber-600";
    case "disabled":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getAlertSeverityBadge(severity: AlertItem["severity"]) {
  switch (severity) {
    case "critical":
      return "bg-destructive/10 text-destructive";
    case "warning":
      return "bg-amber-500/10 text-amber-600";
    case "info":
      return "bg-primary/10 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default async function Page() {
  const t = await getTranslations("Dashboard");

  const trendMaxValue = Math.max(
    ...TREND_DATA.map((item) => Math.max(item.detections, item.deletions))
  );
  const detectionAverage = Math.round(
    TREND_DATA.reduce((acc, item) => acc + item.detections, 0) /
      TREND_DATA.length
  );
  const deletionAverage = Math.round(
    TREND_DATA.reduce((acc, item) => acc + item.deletions, 0) /
      TREND_DATA.length
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          자동 탐지·삭제 현황을 확인하고 위험 시그널을 빠르게 처리하세요.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_DATA.map((kpi) => (
          <Card key={kpi.id} className="gap-0">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-semibold text-foreground">
                  {formatNumber(kpi.value)}
                </span>
                <span className="text-sm text-muted-foreground">건</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getDeltaColor(
                    kpi.delta
                  )}`}
                >
                  {kpi.delta > 0 ? "▲" : kpi.delta < 0 ? "▼" : "•"}
                  {kpi.delta > 0 ? `+${kpi.delta}%` : `${kpi.delta}%`}
                </span>
              </div>
              <CardDescription>{kpi.baseline}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="gap-0">
          <CardHeader>
            <CardTitle>최근 14일 탐지 · 삭제 추세</CardTitle>
            <CardDescription>일간 자동 탐지와 삭제 누적을 비교합니다.</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm">
                기간 선택 (더미)
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-muted-foreground">탐지 일평균</p>
                <p className="text-base font-semibold text-foreground">
                  {formatNumber(detectionAverage)}건
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">삭제 일평균</p>
                <p className="text-base font-semibold text-foreground">
                  {formatNumber(deletionAverage)}건
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">최고 탐지</p>
                <p className="text-base font-semibold text-foreground">
                  {formatNumber(
                    Math.max(...TREND_DATA.map((item) => item.detections))
                  )}
                  건
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">최고 삭제</p>
                <p className="text-base font-semibold text-foreground">
                  {formatNumber(
                    Math.max(...TREND_DATA.map((item) => item.deletions))
                  )}
                  건
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-primary" />
                  <span>탐지</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  <span>자동 삭제</span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-3 sm:grid-cols-14">
                {TREND_DATA.map((day) => (
                  <div key={day.date} className="flex flex-col items-center gap-2">
                    <div className="flex h-28 w-full items-end gap-1">
                      <div
                        className="flex-1 rounded-sm bg-primary/80"
                        style={{
                          height: `${Math.max(
                            (day.detections / trendMaxValue) * 100,
                            4
                          )}%`,
                        }}
                      />
                      <div
                        className="flex-1 rounded-sm bg-emerald-500/80 dark:bg-emerald-400/70"
                        style={{
                          height: `${Math.max(
                            (day.deletions / trendMaxValue) * 100,
                            4
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {day.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0">
          <CardHeader>
            <CardTitle>탐지 스케줄 상태</CardTitle>
            <CardDescription>
              마지막 실행과 다음 예약, 최근 3회 실행 로그를 요약합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="rounded-lg border border-dashed p-4">
              <div className="flex flex-col gap-2">
                <div className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  마지막 실행 ({EXECUTION_STATUS.lastRun.duration})
                </div>
                <p className="text-sm font-medium text-foreground">
                  {EXECUTION_STATUS.lastRun.time}
                </p>
                <p className="text-sm text-muted-foreground">
                  {EXECUTION_STATUS.lastRun.processed}
                </p>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">다음 실행</p>
              <p className="font-semibold text-foreground">
                {EXECUTION_STATUS.nextRun}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">최근 실행 로그</p>
              <ul className="space-y-2 text-sm">
                {EXECUTION_STATUS.recentRuns.map((run) => (
                  <li
                    key={`${run.time}-${run.status}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">
                        {run.time}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getRunStatusColor(
                          run.status
                        )}`}
                      >
                        {run.status === "success"
                          ? "정상"
                          : run.status === "warning"
                          ? "주의"
                          : "오류"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>탐지 {run.detections}</span>
                      <span>삭제 {run.deletions}</span>
                      <span>{run.duration}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card className="gap-0">
          <CardHeader>
            <CardTitle>채널 분포</CardTitle>
            <CardDescription>
              연결된 채널별 탐지·삭제 현황과 상태를 확인하세요.
            </CardDescription>
            <CardAction>
              <Input placeholder="채널 검색 (더미)" className="w-48" />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>채널</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">오늘 탐지</TableHead>
                  <TableHead className="text-right">오늘 삭제</TableHead>
                  <TableHead className="text-right">누적 탐지</TableHead>
                  <TableHead className="text-right">누적 삭제</TableHead>
                  <TableHead>최근 이슈</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CHANNEL_SUMMARY.map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell className="max-w-[200px] truncate font-medium text-foreground">
                      {channel.name}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getChannelStatusBadge(
                          channel.status
                        )}`}
                      >
                        {channel.status === "healthy"
                          ? "정상"
                          : channel.status === "warning"
                          ? "주의"
                          : "비활성"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      {formatNumber(channel.todayDetections)}
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      {formatNumber(channel.todayDeletions)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatNumber(channel.lifetimeDetections)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatNumber(channel.lifetimeDeletions)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {channel.lastIncident ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>오늘 기준 더미 데이터입니다.</span>
              <Button variant="ghost" size="sm" className="self-start px-0 text-xs">
                전체 채널 관리 (더미)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0">
          <CardHeader>
            <CardTitle>알림 및 위험</CardTitle>
            <CardDescription>
              즉시 대응이 필요한 항목을 우선순위로 정렬합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {ALERTS.map((alert) => (
                <li
                  key={alert.id}
                  className="rounded-lg border border-border/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getAlertSeverityBadge(
                            alert.severity
                          )}`}
                        >
                          {alert.severity === "critical"
                            ? "긴급"
                            : alert.severity === "warning"
                            ? "주의"
                            : "정보"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {alert.timestamp}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {alert.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {alert.description}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      자세히
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card className="gap-0">
          <CardHeader>
            <CardTitle>최근 스팸 활동</CardTitle>
            <CardDescription>
              자동 삭제된 댓글 스니펫과 규칙을 확인하세요. 복구는 지원되지 않습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {RECENT_ACTIVITY.map((activity) => (
                <li
                  key={activity.id}
                  className="rounded-xl border border-border/70 p-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-2 text-sm text-foreground">
                        “{activity.comment}”
                      </p>
                      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        복구 불가
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {activity.channel}
                      </span>
                      <span>규칙: {activity.rule}</span>
                      <span>{activity.removedAt}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="gap-0">
          <CardHeader>
            <CardTitle>시스템 스냅샷</CardTitle>
            <CardDescription>
              연결 상태와 감지 설정 요약입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {SNAPSHOT.map((metric) => (
              <div
                key={metric.id}
                className="rounded-lg border border-dashed p-4"
              >
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="text-lg font-semibold text-foreground">
                  {metric.value}
                </p>
                {metric.hint ? (
                  <p className="text-xs text-muted-foreground">{metric.hint}</p>
                ) : null}
              </div>
            ))}
            <Button variant="ghost" size="sm" className="justify-start px-0 text-sm">
              설정으로 이동 (더미)
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

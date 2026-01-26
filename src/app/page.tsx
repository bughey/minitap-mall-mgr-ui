import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const kpis = [
  { label: "今日订单", value: "—" },
  { label: "今日退款", value: "—" },
  { label: "积分消耗", value: "—" },
  { label: "库存预警", value: "—" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">经营概览</h1>
          <p className="text-sm text-muted-foreground">
            KPI、趋势与待处理事项（数据接入后自动刷新）
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="py-4">
            <CardHeader className="px-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="text-2xl font-semibold tabular-nums">
                {kpi.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>近 30 天趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 rounded-lg border border-dashed bg-muted/20" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top 商品（消耗）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 rounded-lg border border-dashed bg-muted/20" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

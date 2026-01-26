# Page Override: dashboard

> 本文件覆盖 `../MASTER.md` 的部分规则，仅用于 Dashboard 页面。

## 信息架构（推荐）

1. **KPI 区（第一屏）**
   - 今日订单数 / 今日积分消耗
   - 待发货 / 退款申请中
   - 商品上架数 / 低库存 SKU 数
2. **趋势区**
   - **折线图（Line Chart）**：近 7/30 天订单量或积分消耗趋势（ui-ux-pro-max：Trend Over Time → Line Chart）
3. **对比/排行区**
   - **条形图（Bar Chart）**：Top 分类/商品销量或兑换次数排行（ui-ux-pro-max：Compare Categories → Bar Chart）
4. **最近动态**
   - 最近订单（待发货优先）
   - 最近退款（申请中优先）

## 视觉密度

- KPI 卡片：`grid-cols-4`（≥1280），`grid-cols-2`（≥768），`grid-cols-1`（移动）
- 图表卡片：保持固定高度（例如 280/320px），加载时使用 Skeleton 占位（避免 layout shift）

## 交互规则

- 所有图表支持 hover tooltip（数据点/数值/日期）
- 图表较重时使用动态加载（Next.js `dynamic()`）并在首屏保留静态骨架


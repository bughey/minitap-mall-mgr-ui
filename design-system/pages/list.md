# Page Override: list（通用列表页模板）

> 本文件覆盖 `../MASTER.md` 的部分规则，用作“列表页”的通用模板（商品/订单/优惠券/退款等）。

## 结构模板

1. **页面标题区**
   - 左：标题 + 统计（总数/状态分布）
   - 右：主操作按钮（新增/导出/刷新）
2. **筛选工具栏**
   - 搜索框（订单号/商品名/用户等）
   - 下拉筛选（状态、分类、时间范围）
   - 快捷重置（清空筛选）
3. **批量操作条（可选）**
   - 多选后展示：批量上/下架、批量删除、批量导出等（ui-ux-pro-max：Bulk Actions）
4. **数据表格**
   - 右侧固定操作列（查看/编辑/更多）
   - 行 hover 高亮（仅背景色变化）
   - 移动端：外层 `overflow-x-auto`（ui-ux-pro-max：Table Handling）
5. **分页**
   - 页码 + page size（默认 20，最大 100）

## 反馈与确认

- 写操作必须有 Toast（成功/失败）（ui-ux-pro-max：Confirmation Messages / Success Feedback）
- 删除/发货/退款同意等不可逆操作必须二次确认（ui-ux-pro-max：Confirmation Dialogs）


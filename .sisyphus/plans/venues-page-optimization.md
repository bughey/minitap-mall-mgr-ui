# Venues Page Optimization (1000+)

## Context

### Original Request
Optimize the venues management page. Current UI is a card grid; with many venues it becomes hard to scan and heavy to render.

### Current Implementation (Evidence)
- Entry route renders `src/components/pages/VenuesPage.tsx` via `src/app/venues/page.tsx`.
- `src/components/pages/VenuesPage.tsx`:
  - Fetches all venues with `placeApi.getList()` (GET `/api/v1/place/list`) and renders a 2-column card grid.
  - Renders `place.groups` inline inside every venue card (DOM grows quickly).
  - Bottom section contains "场地统计" summary card.
- Existing list UI patterns in repo:
  - KPI cards: `src/components/pages/OverviewPage.tsx:186`.
  - Table + skeleton + pagination: `src/components/pages/DevicesPage.tsx:251`.
  - Table primitives: `src/components/ui/table.tsx`.

### Interview Summary (Decisions)
- Scale: venues can exceed 1000.
- UX direction: Hybrid.
  - Desktop: table/list view.
  - Mobile: keep compact cards.
- New API contracts (define now, backend later):
  - `GET /api/v1/place/page` for paginated list.
    - Uses `data[]` as list field.
    - Supports `search` (search by venue name).
    - No status filter for now.
    - Includes `group_count` per row.
  - `GET /api/v1/place/stats` for summary metrics (separate from pagination).
- Columns (desktop): name/address, total devices, active devices, today revenue, group count, agent (button-only), actions.
- Agent in list: do NOT display agent name to avoid N+1; show button that opens `PlaceAgentDialog`.
- Groups in list: show count + on-demand view; do not render groups inline for every venue.
- Testing: manual only + `npm run lint` + `npm run build`.

### Metis Review (Guardrails to Apply)
- Lock pagination response metadata now (must include totals/page fields).
- Prevent request races for search (abort or ignore stale responses).
- Avoid any per-row data fetch during table render (no groups/agents per row).
- Define partial failure behavior (stats fails but list succeeds, and vice versa).

---

## Work Objectives

### Core Objective
Make `/venues` usable and fast for 1000+ venues by switching to a paginated desktop table + mobile cards, moving summary metrics to top, and loading related data (groups/agent) only on demand.

### Concrete Deliverables
- New API client methods and types for:
  - `GET /api/v1/place/page`
  - `GET /api/v1/place/stats`
- Refactored `src/components/pages/VenuesPage.tsx`:
  - Top KPI cards using stats endpoint.
  - Desktop table with pagination + search.
  - Mobile compact cards with pagination.
  - Groups and agent loaded on demand.
- Updated docs in `README.md` for new endpoints (contract only).

### Definition of Done
- `/venues` loads with bounded DOM: renders only a single page of venues (no full list).
- Initial load performs exactly 2 requests: `/place/page` + `/place/stats`.
- Search updates list without request storms (debounced and race-safe).
- No per-row fetching for groups/agent; those load only when user clicks.
- Manual verification steps pass; `npm run lint` and `npm run build` succeed.

### Must NOT Have (Guardrails)
- No client-side full-data operations for 1000+ venues (no fetching `/place/list` for the main view).
- No inline rendering of `groups[]` for all rows.
- No N+1 requests for agent names.
- No new state library (React Query/Zustand) introduced for this change.

---

## Verification Strategy

### Test Decision
- Infrastructure exists: NO (`package.json` has no test/e2e scripts).
- Approach: Manual QA + `npm run lint` + `npm run build`.

### Manual QA Checklist (must be executed)
1. `npm run dev` and open `http://device.m.minitap.org:3001/venues`.
2. Verify top KPI cards render and can refresh.
3. Desktop:
   - Search by name (type quickly) and confirm list updates correctly.
   - Pagination prev/next works; changing search resets to page 1.
   - Open Place detail dialog; close; list still works.
   - Open Place agent dialog from agent column; bind/unbind; close; verify list refresh behavior.
   - Open groups view for a row (on-demand); verify it loads only when clicked.
4. Mobile (narrow viewport): verify card list shows same key metrics and actions.
5. Delete a place:
   - Confirm dialog copy and confirm/cancel.
   - After delete, list refreshes; if page becomes empty, it moves to previous page (or refetches safely).
6. Run `npm run lint`.
7. Run `npm run build`.

---

## API Contracts (to document + implement)

### 1) GET `/api/v1/place/page`

**Query params**:
- `page` (number, 1-based, default 1)
- `page_size` (number, default 20, max 100)
- `search` (string, optional, trimmed; searches by place name)

**Response `data` shape** (enveloped by the standard `{ success, err_code, err_message, data }`):

```json
{
  "data": [
    {
      "id": 1,
      "name": "万达广场",
      "address": "杭州市西湖区...",
      "status": { "is_active": true, "has_maintenance": false, "primary_status": "online" },
      "total_devices": 42,
      "active_devices": 38,
      "maintenance_devices": 0,
      "today_revenue": 3245,
      "group_count": 2
    }
  ],
  "total": 1245,
  "page_size": 20,
  "has_more": true,
  "current_page": 1,
  "total_pages": 63
}
```

Notes:
- This endpoint MUST NOT return `groups[]` to keep payload small.
- Sorting is out of scope for now; backend must provide a stable default order (default assumption: id desc).

### 2) GET `/api/v1/place/stats`

**Response `data` shape**:
```json
{
  "total_places": 1245,
  "total_devices": 99999,
  "active_devices": 88888,
  "today_total_revenue": 11525
}
```

Notes:
- Default assumption: stats are global (not affected by search).

---

## TODOs

> Implementation tasks reference existing code patterns for speed and consistency.
> Each task includes acceptance criteria and explicit "Must NOT" rules.

- [x] 1. Add new venue pagination/types

  What to do:
  - Add new types in `src/types/venue.ts`:
    - `PlacePageItem` (row-only, includes `group_count`, excludes `groups[]`).
    - `PlacePageResponse` matching repo pagination patterns (see `src/types/device.ts:46`, `src/types/place-gift.ts:20`).
  - Add `placeApi.page()` and `placeApi.getStats()` in `src/lib/api.ts` following existing query string construction patterns (see `src/lib/api.ts:235`).

  Must NOT do:
  - Do not reuse `Place` (it includes `groups[]`), and do not add optional `groups` to the paged response.

  Parallelizable: YES (with 2)

  References:
  - `src/lib/api.ts:145` - current `placeApi.getList()` definition.
  - `src/types/venue.ts:21` - current `Place` and `PlaceListResponse` (includes `groups`).
  - `src/types/device.ts:46` - pagination metadata naming.
  - `src/types/place-gift.ts:20` - pagination metadata naming.

  Acceptance Criteria:
  - Types compile (TypeScript) and naming is consistent with existing pagination types.
  - `placeApi.page({ page, page_size, search })` creates correct query string.

- [x] 2. Document new endpoints in README

  What to do:
  - Update `README.md` "场地管理页面" section:
    - Add `/api/v1/place/page` contract.
    - Add `/api/v1/place/stats` contract.
    - Clarify `/api/v1/place/list` remains legacy/full list and should not be used for large lists.

  Must NOT do:
  - Do not delete existing `/place/list` docs.

  Parallelizable: YES (with 1)

  References:
  - `README.md:333` - existing `/api/v1/place/list` section.
  - `src/lib/api.ts:145` - existing place endpoints.

  Acceptance Criteria:
  - README contains both endpoint docs with request/response examples and parameter lists.

- [x] 3. Refactor VenuesPage data loading to page+stats

  What to do:
  - In `src/components/pages/VenuesPage.tsx`, replace the single `placeApi.getList()` flow with:
    - `placeApi.page()` for list.
    - `placeApi.getStats()` for KPI cards.
  - Add state for:
    - `search` (input value)
    - `currentPage`, `pageSize`, `total`, `totalPages`
    - separate `loadingList` vs `loadingStats` (partial render possible).
  - Implement request race-safety:
    - AbortController for list fetch on new search/page change, OR request id tracking.

  Must NOT do:
  - Do not fetch `/place/list` for list rendering.

  Parallelizable: NO (depends on 1)

  References:
  - `src/components/pages/VenuesPage.tsx:64` - current `fetchPlaceData` with `placeApi.getList()`.
  - `src/components/pages/DevicesPage.tsx:133` - paged list fetching pattern.
  - `src/components/pages/OverviewPage.tsx:59` - parallel stats fetch pattern.
  - `src/lib/api.ts:75` - `apiRequest` signature supports passing fetch options (for AbortController `signal`).

  Acceptance Criteria:
  - Initial page load triggers exactly 2 requests.
  - If stats fails, list still renders with an inline error; if list fails, show list error + retry.

- [x] 4. Move "场地统计" to top KPI cards

  What to do:
  - Remove bottom "场地统计" card in `src/components/pages/VenuesPage.tsx` and render KPI cards near top.
  - Use the existing KPI card styling pattern from Overview.

  Must NOT do:
  - Do not require scrolling to see global stats.

  Parallelizable: NO (depends on 3)

  References:
  - `src/components/pages/VenuesPage.tsx:447` - bottom stats section.
  - `src/components/pages/OverviewPage.tsx:186` - KPI card grid pattern.

  Acceptance Criteria:
  - KPI cards show totals from `/place/stats`.
  - Loading skeletons used for KPI cards while stats request in-flight.

- [x] 5. Desktop table view (primary)

  What to do:
  - Render a table for desktop using `src/components/ui/table.tsx`.
  - Columns:
    - 场地名称/地址 (with status badge from existing `getUIStatus`)
    - 设备总数
    - 活跃设备
    - 今日收益
    - 分组数量 (button to view groups)
    - 负责代理 (button to open `PlaceAgentDialog`)
    - 操作 (查看详情/编辑/删除)
  - Skeleton rows while loading; empty state when no results.

  Must NOT do:
  - Do not mount both table and mobile cards at the same time.

  Parallelizable: NO (depends on 3)

  References:
  - `src/components/pages/DevicesPage.tsx:375` - table + skeleton + empty state pattern.
  - `src/components/ui/table.tsx` - table primitives.
  - `src/types/venue.ts:97` - status mapping helpers (`getUIStatus`, `getStatusText`, `getStatusColor`).

  Acceptance Criteria:
  - Table renders only the current page of rows.
  - Status badge still displays correctly even though no status filter exists.

- [x] 6. Mobile cards view (secondary)

  What to do:
  - Render compact cards on mobile (single column), showing:
    - name, address (truncated), status badge
    - total_devices, active_devices, today_revenue
    - actions (detail/edit/delete/agent)
  - Keep pagination controls suitable for touch.

  Must NOT do:
  - Do not render inline groups list by default.

  Parallelizable: NO (depends on 3)

  References:
  - `src/components/pages/VenuesPage.tsx:245` - current card layout (to simplify).
  - `src/components/pages/DevicesPage.tsx:492` - pagination control pattern.

  Acceptance Criteria:
  - Mobile view is usable without horizontal scroll.

- [x] 7. Search UX (no status filter)

  What to do:
  - Add search input that updates `search` state.
  - Implement debounce (300-500ms) so typing does not fire a request per keystroke.
  - Keep Enter key support to trigger an immediate fetch (optional but matches existing pages).
  - On search change, reset to page 1.

  Must NOT do:
  - Do not trigger list fetch on every single keystroke without debounce.

  Parallelizable: NO (depends on 3)

  References:
  - `src/components/pages/DevicesPage.tsx:347` - search UI pattern.
  - Note: current list pages fetch per keystroke; venues should improve this.

  Acceptance Criteria:
  - Typing quickly does not cause request storms; stale responses never overwrite newer results.

- [x] 8. Pagination controls + edge cases

  What to do:
  - Add pagination controls (prev/next + page indicator + total count).
  - Handle delete edge case: if current page becomes empty after delete, go back one page and refetch.

  Must NOT do:
  - Do not allow page navigation beyond bounds.

  Parallelizable: NO (depends on 3)

  References:
  - `src/components/pages/DevicesPage.tsx:492` - pagination UI.

  Acceptance Criteria:
  - Page navigation works, and delete-empty-page behavior is correct.

- [x] 9. On-demand groups view

  What to do:
  - Provide a lightweight UI to view groups for a place when user clicks the group count.
  - Fetch groups via `groupApi.getList(placeId)` only on demand.

  Must NOT do:
  - Do not fetch groups for all visible rows automatically.

  Parallelizable: NO (depends on 5)

  References:
  - `src/lib/api.ts:202` - `groupApi.getList` signature.
  - `src/components/pages/VenuesPage.tsx:126` - current group edit/delete logic that fetches group list.

  Acceptance Criteria:
  - Network requests for groups only happen after user interaction.

- [x] 10. Agent column button integration

  What to do:
  - In list row/cell, provide a button that opens `PlaceAgentDialog` with `{ id, name }`.
  - Do not display agent nickname in table.
  - Decide refresh behavior after agent change: refetch stats + current page list.

  Must NOT do:
  - Do not call `placeApi.getAgent` for every row.

  Parallelizable: NO (depends on 5)

  References:
  - `src/components/venue/PlaceAgentDialog.tsx:67` - dialog fetches agent details on open.
  - `src/components/pages/VenuesPage.tsx:400` - existing open-agent flow.

  Acceptance Criteria:
  - Opening the agent dialog triggers agent fetch only for that place.

- [x] 11. Final QA gate

  What to do:
  - Execute manual QA checklist (this plan's Verification Strategy).
  - Run `npm run lint` and `npm run build`.

  Parallelizable: NO

  Acceptance Criteria:
  - `npm run lint` succeeds.
  - `npm run build` succeeds.
  - Manual QA steps completed with expected behavior.

---

## Success Criteria

### Verification Commands
```bash
npm run dev
npm run lint
npm run build
```

### Final Checklist
- [x] `/venues` uses paginated API, not full list.
- [x] Summary shown at top via `/place/stats`.
- [x] Desktop table + mobile cards are both supported without double-mount heavy DOM.
- [x] Groups and agent are on-demand only.
- [x] Search is debounced and race-safe.

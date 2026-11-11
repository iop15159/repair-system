-- 報修登記系統：供全新 Supabase 資料表使用，只提供 SQL，不自動執行。
-- 使用交易確保建表、權限與政策一併完成；若資料表已存在則停止，避免覆蓋資料。
begin;

-- 建表：識別碼與建立時間由資料庫產生；所有欄位均為必填。
create table public.repair_requests (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    reporter_name text not null,
    location text not null,
    category text not null,
    description text not null,
    urgency text not null default '中',
    status text not null default '待處理',

    -- CHECK：依字元數限制文字長度，並拒絕只有空白的內容。
    constraint repair_requests_reporter_name_check check (
        char_length(reporter_name) between 1 and 100
        and reporter_name ~ '[^[:space:]]'
    ),
    constraint repair_requests_location_check check (
        char_length(location) between 1 and 200
        and location ~ '[^[:space:]]'
    ),
    constraint repair_requests_description_check check (
        char_length(description) between 1 and 5000
        and description ~ '[^[:space:]]'
    ),

    -- CHECK：固定選項同時限制可用值及最大長度；NOT NULL 防止空值繞過檢查。
    constraint repair_requests_category_check check (
        category in ('設備', '網路', '環境', '其他')
        and char_length(category) between 1 and 2
    ),
    constraint repair_requests_urgency_check check (
        urgency in ('低', '中', '高') and char_length(urgency) = 1
    ),
    constraint repair_requests_status_check check (
        status in ('待處理', '處理中', '已完成') and char_length(status) = 3
    )
);

-- GRANT 第一層：明確清除一般 API 角色的表級權限，再只開放 anon 必要權限。
-- 新表尚無額外欄位授權；不變更全專案的預設權限或其他資料表。
revoke all privileges on table public.repair_requests from public, anon, authenticated;
grant usage on schema public to anon;
grant select on table public.repair_requests to anon;
grant insert (reporter_name, location, category, description, urgency)
    on table public.repair_requests to anon;
-- 不授予 UPDATE、DELETE、TRUNCATE；不准指定 id、created_at、status，須使用預設值。
-- 前端新增時僅傳送上述五個欄位；urgency 可省略，預設為「中」。

-- RLS 第二層：啟用資料列安全；只有具備 GRANT 的 anon 可透過下列政策存取。
alter table public.repair_requests enable row level security;

-- 讀取政策：允許匿名使用者讀取全部清單，請僅使用虛構姓名與地點。
create policy repair_requests_anon_select
    on public.repair_requests for select to anon
    using (true);

-- 新增政策：即使日後調整欄位授權，新增資料仍必須是「待處理」。
create policy repair_requests_anon_insert
    on public.repair_requests for insert to anon
    with check (status = '待處理');
-- 不建立修改及刪除政策；一般 API 角色也沒有相應 GRANT。

-- 完成交易；本檔不含示範資料，不會連線或呼叫 Supabase API。
commit;

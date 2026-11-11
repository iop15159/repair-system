// Publishable key 為前端公開金鑰；資料存取權限由資料庫 GRANT 與 RLS 控制。
// 請勿在此放入 secret 或 service_role 金鑰。
window.REPAIR_CONFIG = Object.freeze({
  supabaseUrl: 'https://nfgkdycipmrycqklukrc.supabase.co',
  supabasePublishableKey: 'sb_publishable_aXF8VRwucDahzuyTXbOQoA_nD1Y0pxV'
});

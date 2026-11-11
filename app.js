(() => {
  'use strict';
  const form = document.querySelector('#repair-form');
  const fields = document.querySelector('#form-fields');
  const submitButton = document.querySelector('#submit-button');
  const refreshButton = document.querySelector('#refresh-button');
  const formMessage = document.querySelector('#form-message');
  const listMessage = document.querySelector('#list-message');
  const list = document.querySelector('#request-list');
  const filterMessage = document.querySelector('#filter-message');
  const filterButtons = document.querySelectorAll('[data-urgency]');
  let cachedRequests = [];
  let selectedUrgency = '全部';
  let hasLoaded = false;
  let client;
  let sending = false;
  let loading = false;

  function message(element, text, kind = '') {
    element.textContent = text;
    element.className = `message ${kind}`;
  }

  function errorDetail(error) {
    return error?.message || '網路連線異常，請稍後再試。';
  }

  // 一律以 textContent 顯示使用者資料，避免將報修內容當成 HTML 執行。
  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }

  function renderRequests(rows) {
    const fragment = document.createDocumentFragment();
    const formatter = new Intl.DateTimeFormat('zh-TW', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Taipei'
    });
    for (const row of rows) {
      const card = element('article', 'request-card', '');
      const heading = element('div', 'card-heading', '');
      heading.append(element('h3', '', `${row.category} · ${row.location}`));
      const badges = element('div', 'badges', '');
      badges.append(element('span', `badge${row.urgency === '高' ? ' urgency-high' : ''}`, `緊急程度：${row.urgency}`));
      badges.append(element('span', `badge${row.status === '已完成' ? ' status-done' : ''}`, row.status));
      heading.append(badges);
      const date = new Date(row.created_at);
      const timestamp = Number.isNaN(date.getTime()) ? '時間未知' : formatter.format(date);
      card.append(heading,
        element('p', 'card-meta', `${row.reporter_name} · ${timestamp}（台北時間）`),
        element('p', 'description', row.description));
      fragment.append(card);
    }
    list.replaceChildren(fragment);
  }

  // 篩選只使用最近一次成功讀取的清單，不發出新的資料庫請求。
  function renderFilteredRequests() {
    const visible = selectedUrgency === '全部' ? cachedRequests
      : cachedRequests.filter(row => row.urgency === selectedUrgency);
    renderRequests(visible);
    filterButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.urgency === selectedUrgency));
    });
    message(filterMessage, !hasLoaded ? '' : selectedUrgency === '全部'
      ? `顯示已載入的全部 ${visible.length} 筆。`
      : visible.length ? `顯示緊急程度「${selectedUrgency}」的 ${visible.length} 筆。`
        : `已載入的最近 ${cachedRequests.length} 筆中，沒有緊急程度「${selectedUrgency}」的報修。`);
  }

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      selectedUrgency = button.dataset.urgency;
      renderFilteredRequests();
    });
  });

  async function loadRequests() {
    if (loading) return;
    loading = true;
    refreshButton.disabled = true;
    list.setAttribute('aria-busy', 'true');
    message(listMessage, '正在載入清單…');
    try {
      const { data, error } = await client.from('repair_requests')
        .select('id,created_at,reporter_name,location,category,description,urgency,status')
        .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(20);
      if (error) throw error;
      cachedRequests = data || [];
      hasLoaded = true;
      renderFilteredRequests();
      message(listMessage, data?.length ? `已載入最近 ${data.length} 筆通報，新的在上面。篩選範圍僅限這些紀錄。` : '目前沒有報修紀錄，第一筆通報就從上方開始。');
    } catch (error) {
      message(listMessage, `清單載入失敗：${errorDetail(error)}${hasLoaded ? ' 保留上次載入的紀錄，仍可切換篩選。' : ''} 請按「重新整理」重試。`, 'error');
    } finally {
      loading = false;
      refreshButton.disabled = false;
      list.setAttribute('aria-busy', 'false');
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending || !client) return;
    const values = new FormData(form);
    // 白名單建立 payload，不傳 status、id 或 created_at。
    const payload = Object.fromEntries(['reporter_name', 'location', 'category', 'description', 'urgency']
      .map(key => [key, String(values.get(key) || '').trim()]));
    if (Object.values(payload).some(value => !value)) {
      message(formMessage, '請填寫所有欄位，內容不可只有空白。', 'error');
      return;
    }
    if (!form.reportValidity()) return;
    sending = true;
    fields.disabled = true;
    submitButton.textContent = '正在送出…';
    message(formMessage, '正在送出報修，請稍候。');
    try {
      const { error } = await client.from('repair_requests').insert(payload);
      if (error) throw error;
      form.reset();
      message(formMessage, '報修已成功送出，狀態為「待處理」。', 'success');
      // 清單失敗由 loadRequests 自行處理，不會將新增成功誤報為失敗。
      await loadRequests();
    } catch (error) {
      message(formMessage, `送出未確認：${errorDetail(error)} 表單內容已保留；若曾中斷連線，請先重新整理清單確認是否已送達，再決定是否重送。`, 'error');
    } finally {
      sending = false;
      fields.disabled = false;
      submitButton.textContent = '送出報修 ↗';
    }
  });

  refreshButton.addEventListener('click', loadRequests);
  try {
    const config = window.REPAIR_CONFIG;
    if (!window.supabase?.createClient || !config?.supabaseUrl || !config?.supabasePublishableKey) {
      throw new Error('必要檔案未載入，請確認網路連線後重新整理頁面。');
    }
    client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    fields.disabled = false;
    loadRequests();
  } catch (error) {
    message(formMessage, `無法啟動報修功能：${errorDetail(error)}`, 'error');
    message(listMessage, '清單尚未載入，請重新整理頁面重試。', 'error');
    list.setAttribute('aria-busy', 'false');
  }
})();

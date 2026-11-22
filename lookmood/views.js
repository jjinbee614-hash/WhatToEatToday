(() => {
  const endpoint = '/api/lookmood-views';
  const match = location.pathname.match(/\/lookmood\/looks\/([\w-]+)/);
  if (match) {
    let session = sessionStorage.getItem('lookmood-view-session');
    if (!session) {
      session = Array.from(crypto.getRandomValues(new Uint8Array(16)), x => x.toString(16).padStart(2, '0')).join('');
      sessionStorage.setItem('lookmood-view-session', session);
    }
    fetch(endpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:match[1],session})}).catch(() => {});
    return;
  }
  const grid = document.querySelector('.look-grid');
  if (!grid) return;
  const cards = [...grid.querySelectorAll(':scope > .look-card')].map((node, i) => ({node, index:i, id:node.querySelector('.card-image')?.getAttribute('href')?.match(/\/looks\/([\w-]+)/)?.[1]}));
  const controls = document.createElement('div');
  controls.className = 'look-sort';
  controls.innerHTML = '<label for="look-sort-select">정렬</label><select id="look-sort-select"><option value="latest">최신순</option><option value="popular">인기순</option><option value="recommended">추천순</option></select><span class="view-info">조회수 집계 중</span>';
  grid.before(controls);
  const select = controls.querySelector('select');
  const info = controls.querySelector('.view-info');
  let views = null;
  function sort() {
    if (!views && select.value !== 'latest') { info.textContent = '조회수를 불러올 수 없어 최신순으로 표시합니다.'; }
    const ordered = [...cards];
    if (views && select.value === 'popular') ordered.sort((a,b) => (views[b.id] || 0) - (views[a.id] || 0) || a.index - b.index);
    if (views && select.value === 'recommended') ordered.sort((a,b) => (Math.log1p(views[b.id] || 0) / Math.sqrt(1 + b.index / 5)) - (Math.log1p(views[a.id] || 0) / Math.sqrt(1 + a.index / 5)) || a.index - b.index);
    ordered.forEach(c => grid.append(c.node));
  }
  select.addEventListener('change', sort);
  fetch(endpoint, {cache:'no-store'}).then(r => {if (!r.ok) throw Error(); return r.json();}).then(data => {
    views = data.views;
    cards.forEach(c => {
      if (!c.id) return;
      const p=document.createElement('p'); p.className='look-view-count'; p.textContent='조회수 '+new Intl.NumberFormat('ko-KR').format(views[c.id] || 0);
      c.node.querySelector('.card-info')?.append(p);
    });
    info.textContent=''; sort();
  }).catch(() => {info.textContent='조회수를 불러올 수 없습니다.';});
})();

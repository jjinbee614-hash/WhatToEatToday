const $ = selector => document.querySelector(selector);
let returnFocus, scrollY, youtubeVideoId;
function openDialog(dialog, trigger) {
  returnFocus = trigger; scrollY = window.scrollY;
  Object.assign(document.body.style, {position:'fixed', top:`-${scrollY}px`, width:'100%'});
  dialog.showModal(); dialog.scrollTop = 0; dialog.querySelector('.close').focus();
}
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.querySelector('.close').onclick = () => dialog.close();
  dialog.addEventListener('click', event => {
    const r = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    dialog.querySelector('iframe')?.remove();
    Object.assign(document.body.style, {position:'', top:'', width:''});
    window.scrollTo(0, scrollY); returnFocus?.focus({preventScroll:true});
  });
}
if ($('#open-products')) $('#open-products').onclick = event => openDialog($('#products'), event.currentTarget);
for (const button of document.querySelectorAll('[data-open="products"]')) button.onclick = event => openDialog($('#products'), event.currentTarget);
const videoButtons = document.querySelectorAll('#open-video, [data-open="video"]');
for (const button of videoButtons) { button.disabled = true; button.onclick = openVideo; }
function openVideo() {
  if (!youtubeVideoId || !$('#inline-player')) return;
  if (!$('#inline-player iframe')) {
    const frame = document.createElement('iframe');
    frame.title = 'LOOKMOOD 유튜브 쇼츠';
    frame.src = 'https://www.youtube-nocookie.com/embed/' + youtubeVideoId + '?autoplay=0&playsinline=1&rel=0';
    frame.allow = 'encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    $('#inline-player').replaceChildren(frame);
  }
  $('#inline-player').hidden = false;
  $('#look-media').classList.add('playing');
  $('#show-photo').setAttribute('aria-pressed', 'false');
  $('#show-short').setAttribute('aria-pressed', 'true');
  $('#show-short').focus({preventScroll:true});
  $('#look-media').scrollIntoView({block:'center'});
}
if ($('#show-photo')) $('#show-photo').onclick = () => {
  $('#inline-player').replaceChildren();
  $('#inline-player').hidden = true;
  $('#look-media').classList.remove('playing');
  $('#show-photo').setAttribute('aria-pressed', 'true');
  $('#show-short').setAttribute('aria-pressed', 'false');
};
function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function safeUrl(value) { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; } }
function affiliateUrl(product) {
  const url = safeUrl(product.affiliateUrl);
  return product.affiliateVerified && url && new URL(url).hostname === 'link.coupang.com' ? url : null;
}
function link(text, url, affiliate = false, product = null, lookId = null) {
  const node = el('a', text, affiliate ? 'buy affiliate-buy' : 'buy');
  node.href = url; node.target = '_blank';
  node.rel = affiliate ? 'sponsored noopener noreferrer' : 'noopener noreferrer';
  if (affiliate && product) {
    const track = event => {
      if (event.type === 'auxclick' && event.button !== 1) return;
      try {
        if (typeof window.gtag === 'function') window.gtag('event', 'coupang_click', {
          episode_id: 'EP' + lookId, product_id: product.id,
          product_name: product.name.slice(0, 100), link_url: url,
          link_domain: 'link.coupang.com', transport_type: 'beacon'
        });
      } catch { /* Tracking must never block product navigation. */ }
    };
    node.addEventListener('click', track);
    node.addEventListener('auxclick', track);
  }
  return node;
}
const disclosure = '이 페이지는 쿠팡파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.';
fetch(document.body.dataset.content || '/lookmood/content.json').then(response => {
  if (!response.ok) throw Error(response.status);
  return response.json();
}).then(data => {
  $('#look-title').textContent = data.look.title;
  if ($('#description')) $('#description').textContent = data.look.description;
  if (/^[A-Za-z0-9_-]{11}$/.test(data.look.youtubeVideoId || '')) {
    youtubeVideoId = data.look.youtubeVideoId;
    for (const button of videoButtons) button.disabled = false;
    if ($('#youtube-original')) { $('#youtube-original').href = 'https://www.youtube.com/shorts/' + youtubeVideoId; $('#youtube-original').hidden = false; }
  }
  for (const [name, url] of Object.entries(data.socials)) {
    const href = safeUrl(url), node = el(href ? 'a' : 'span', name);
    if (href) { node.href = href; node.target = '_blank'; node.rel = 'noopener noreferrer'; }
    else node.append(el('small', '미등록'));
    $('#socials').append(node);
  }
  const products = data.products.filter(product => product.published);
  if (products.some(affiliateUrl)) {
    for (const selector of ['#disclosure', '#page-disclosure']) {
      if ($(selector)) { $(selector).hidden = false; $(selector).textContent = disclosure; }
    }
  }
  if (!$('#product-list')) return;
  for (const product of products) {
    const thumb = el('button'); thumb.setAttribute('aria-label', product.name + ' 상세보기');
    const thumbImage = el('img'); thumbImage.src = product.image; thumbImage.alt = ''; thumbImage.loading = 'lazy';
    thumb.append(thumbImage); thumb.onclick = event => { openDialog($('#products'), event.currentTarget); document.getElementById('product-' + product.id).scrollIntoView({block:'start'}); };
    $('#item-thumbnails').append(thumb);
    const row = el('article', null, 'product'), image = el('img'), body = el('div');
    row.id = 'product-' + product.id;
    image.src = product.image; image.alt = product.name; image.loading = 'lazy';
    body.append(el('span', product.brand, 'brand'), el('h3', product.name),
      el('span', product.relation === 'alternative' ? '대체 상품' : product.relation === 'exact' ? '동일 상품' : '스타일링 참고 상품', 'badge'),
      el('p', product.color + ' · ' + product.note));
    const affiliate = affiliateUrl(product);
    if (affiliate) {
      body.append(el('p', product.affiliateNote), el('p', disclosure, 'disclosure'));
      body.append(link(product.affiliateStock === 'sold_out' ? '쿠팡 품절 상품 확인 ↗' : '쿠팡에서 상품 보기 ↗', affiliate, true, product, data.look.id));
    } else {
      body.append(el('p', '쿠팡 동일 상품 미확인 · 원본 상품 링크를 확인해 주세요.'));
    }
    const original = safeUrl(product.url);
    if (original) body.append(link(affiliate ? '무신사 원본 상품 ↗' : '무신사에서 상품 보기 ↗', original));
    row.append(image, body); $('#product-list').append(row);
  }
}).catch(() => { $('#error').hidden = false; });

const $ = selector => document.querySelector(selector);
let returnFocus, scrollY, youtubeVideoId;
const mobileLayout = window.matchMedia('(max-width:700px)');
let inlineProducts;
function showProducts(trigger, productId) {
  if (mobileLayout.matches && inlineProducts) {
    const target = productId ? document.getElementById('product-' + productId) : inlineProducts;
    target.setAttribute('tabindex', '-1');
    target.focus({preventScroll:true});
    target.scrollIntoView({block:'start'});
  } else {
    openDialog($('#products'), trigger);
    if (productId) document.getElementById('product-' + productId).scrollIntoView({block:'start'});
  }
}
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
if ($('#open-products')) $('#open-products').onclick = event => showProducts(event.currentTarget);
for (const button of document.querySelectorAll('[data-open="products"]')) button.onclick = event => showProducts(event.currentTarget);
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
function musinsaCuratorUrl(product) {
  const url = safeUrl(product.musinsaCuratorUrl);
  return product.musinsaCuratorVerified && url && new URL(url).hostname === 'www.musinsa.com' &&
    /^\/curator\/goods\/[A-Za-z0-9]+$/.test(new URL(url).pathname) ? url : null;
}
const musinsaDisclosure = '이 페이지는 무신사 큐레이터 활동의 일환으로, 구매가 발생할 시 일정 수수료를 제공받습니다.';
function musinsaVariant(product) {
  const variant = product.musinsaVariant;
  return musinsaCuratorUrl(product) && variant?.verified === true &&
    /^https:\/\/www\.musinsa\.com\/products\/\d+$/.test(variant.url || '') && variant.color ? variant : null;
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
          link_domain: 'link.coupang.com', transport_type: 'beacon',
          ...(product.displayedPrice ? {displayed_price:product.displayedPrice,currency:'KRW'} : {})
        });
      } catch { /* Tracking must never block product navigation. */ }
    };
    node.addEventListener('click', track);
    node.addEventListener('auxclick', track);
  }
  return node;
}
const disclosure = '이 페이지는 쿠팡파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.';
const pricesReady = fetch('/lookmood/prices.json').then(response => response.ok ? response.json() : null).catch(() => null);
function renderPrice(body, product, lookId, destination) {
  const price = el('p', '판매처에서 가격 확인', 'product-price');
  body.append(price);
  pricesReady.then(data => {
    const record = data?.products?.[lookId + ':' + product.id];
    const age = Date.now() - Date.parse(record?.checkedAt);
    if (!record || record.url !== destination || record.currency !== 'KRW' || age < -60000 || age > 36*60*60*1000 || !Number.isFinite(age)) return;
    if (record.status === 'sold_out') { price.textContent = '확인한 옵션 품절 · 판매처 확인'; return; }
    if (record.status !== 'confirmed' || !Number.isSafeInteger(record.amount) || record.amount <= 0) return;
    if (!musinsaVariant(product)) product.displayedPrice = record.amount;
    price.textContent = new Intl.NumberFormat('ko-KR').format(record.amount) + '원';
    const timestamp = new Intl.DateTimeFormat('ko-KR', {timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(record.checkedAt));
    price.append(el('small', (record.source === 'coupang' ? '쿠팡' : '무신사') + (musinsaVariant(product) ? ' · ' + musinsaVariant(product).color + ' 기준' : '') + ' · ' + timestamp + ' 확인'));
  });
}
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
  if (products.some(p => affiliateUrl(p) || p.coupangSearchUrl)) {
    for (const selector of ['#disclosure', '#page-disclosure']) {
      if ($(selector)) { $(selector).hidden = false; $(selector).textContent = disclosure; }
    }
  }
  if (!$('#product-list')) return;
  for (const product of products) {
    const thumb = el('button'); thumb.setAttribute('aria-label', product.name + ' 상세보기');
    const thumbImage = el('img'); thumbImage.src = product.image; thumbImage.alt = ''; thumbImage.loading = 'lazy';
    thumb.append(thumbImage); thumb.onclick = event => showProducts(event.currentTarget, product.id);
    $('#item-thumbnails').append(thumb);
    const row = el('article', null, 'product'), image = el('img'), body = el('div');
    row.id = 'product-' + product.id;
    image.src = product.image; image.alt = product.name; image.loading = 'lazy';
    const info = el('div', null, 'product-info');
    body.className = 'product-body';
    info.append(el('span', product.brand, 'brand'), el('h3', product.name),
      el('span', product.relation === 'alternative' ? '대체 상품' : product.relation === 'exact' ? '동일 상품' : '스타일링 참고 상품', 'badge'),
      el('p', product.color, 'product-color'));
    const note = (product.note || '').replace(/판매처에서 사이즈와 옵션을 확인(?:해 주세요|하세요)\.?/g, '').trim();
    if (note) info.append(el('p', note, 'product-styling-note'));
    body.append(info);
    const affiliate = affiliateUrl(product);
    const original = safeUrl(product.url);
    const variant = musinsaVariant(product);
    renderPrice(info, product, data.look.id, variant?.url || affiliate || original);
    const shops=el('div',null,'product-shops');
    shops.append(el('span','상품 상세보기','shops-label'));
    const buttons=el('div',null,'shop-buttons');
    if(original){
      const curator = musinsaCuratorUrl(product);
      const a=link('무신사',curator || original,Boolean(curator));
      a.className='shop-button';
      a.dataset.musinsaLinkType=curator?'curator':'original';
      const track = event => {
        if(event.type==='auxclick' && event.button!==1)return;
        try { window.gtag?.('event','musinsa_click',{
          episode_id:'EP'+data.look.id,product_id:product.id,
          product_name:product.name.slice(0,100),link_url:a.href,
          link_type:variant?'curator_color_variant':curator?'curator':'original',
          ...(variant ? {linked_color:variant.color} : {}),
          placement:'product',transport_type:'beacon'
        }); } catch { /* Analytics must not prevent navigation. */ }
      };
      a.addEventListener('click',track);a.addEventListener('auxclick',track);
      buttons.append(a);
    }
    const ably=ablyLink('에이블리','product',product);ably.className='shop-button';ably.title='LOOKMOOD 마이셀렉샵 · 비슷한 스타일';buttons.append(ably);
    const search=safeUrl(product.coupangSearchUrl);
    const coupang=affiliate || (search && new URL(search).hostname==='link.coupang.com' ? search : null);
    if(coupang){const a=link('쿠팡',coupang,true,product,data.look.id);a.className='shop-button';a.title=affiliate?'쿠팡 상품 보기':'쿠팡 키워드 검색: '+product.coupangSearchKeyword;buttons.append(a);}
    shops.append(buttons,el('p','에이블리: LOOKMOOD 마이셀렉샵'+(!affiliate&&coupang?' · 쿠팡: 관련 상품 검색':''),'shop-hint'));
    if (variant) shops.append(el('p','무신사: 다른 색상 상품으로 연결됩니다 · '+variant.color,'shop-hint'));
    body.append(shops);
    row.append(image, body); $('#product-list').append(row);
  }
  const dialog = $('#products'), panel = dialog.querySelector('.dialog-body');
  panel.prepend(el('p', ablyDisclosure, 'notice'));
  if(products.some(musinsaCuratorUrl)) panel.prepend(el('p',musinsaDisclosure,'notice'));
  panel.prepend(el('p', '확인 시점의 참고 가격입니다. 옵션·쿠폰·배송비에 따라 달라질 수 있으며 최종 가격은 판매처에서 확인해 주세요.', 'notice price-notice'));
  inlineProducts = el('section', null, 'inline-products');
  inlineProducts.id = 'shop-the-look';
  inlineProducts.setAttribute('aria-labelledby', 'inline-products-title');
  const heading = el('h2', '이 룩의 아이템 · ' + products.length);
  heading.id = 'inline-products-title';
  inlineProducts.append(heading);
  $('#latest').after(inlineProducts);
  const syncLayout = () => {
    if (dialog.open) dialog.close();
    inlineProducts.hidden = !mobileLayout.matches;
    (mobileLayout.matches ? inlineProducts : dialog).append(panel);
  };
  mobileLayout.addEventListener('change', syncLayout);
  syncLayout();
}).catch(() => { $('#error').hidden = false; });

// A-BLY affiliate placements. Keep the attributed destination byte-for-byte unchanged.
const ablyUrl = 'https://applink.a-bly.com/3fn7wir';
const ablyDisclosure = '이 링크를 통해 구매하면 LOOKMOOD에 수수료가 지급될 수 있습니다.';
function ablyLink(label, placement, product = null) {
  const a = el('a', label, 'ably-button');
  a.href = ablyUrl; a.target = '_blank'; a.rel = 'sponsored noopener noreferrer';
  a.dataset.ablyPlacement = placement;
  const track = event => {
    if (event.type === 'auxclick' && event.button !== 1) return;
    try { window.gtag?.('event', 'ably_click', {
      placement, ...(product ? {product_id:product.id,product_name:product.name.slice(0,100)} : {}), episode_id: location.pathname.match(/looks\/(\d+)/)?.[1] || 'home',
      link_url: ablyUrl, link_domain: 'applink.a-bly.com', transport_type: 'beacon'
    }); } catch { /* Navigation must work even if analytics is blocked. */ }
  };
  a.addEventListener('click', track); a.addEventListener('auxclick', track);
  return a;
}

const headerAbly=ablyLink('에이블리','header');headerAbly.className='header-ably';headerAbly.title='LOOKMOOD 마이셀렉샵 · 제휴 링크';$('#socials')?.prepend(headerAbly);
const headerBlog=el('a','Blog');headerBlog.href='https://blog.naver.com/look_mood_';headerBlog.target='_blank';headerBlog.rel='noopener noreferrer';headerBlog.title='LOOKMOOD 네이버 블로그';headerAbly.after(headerBlog);
const affiliateNotice=el('p','에이블리: 비슷한 스타일을 모은 LOOKMOOD 마이셀렉샵. '+ablyDisclosure,'shop-disclosure');$('footer')?.before(affiliateNotice);
$('footer')?.before(el('p',musinsaDisclosure,'shop-disclosure'));

// Lucian UX/UI Prompt #208 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#208
// Storefront motion adapted for text links; navigation and analytics handlers stay intact.
(() => {
  const expires = Date.parse('2026-11-01T00:00:00+09:00');
  const registerUrl = 'https://applink.a-bly.com/oeu6tro';
  const track = (action, placement) => {try {window.gtag?.('event','ably_coupon_'+action,{coupon_code:'LOOKMOOD01',placement,transport_type:'beacon'});}catch{}};
  function coupon(placement) {
    const box=document.createElement('aside');box.className='lm-coupon';box.setAttribute('aria-label','LOOKMOOD 에이블리 쿠폰');
    box.innerHTML='<div class="lm-coupon-heading"><span>LOOKMOOD × 에이블리</span><h2>전상품 5% 쿠폰 <small>일부 상품 제외</small></h2><p>1원 이상 구매 시 · 최대 5,000원 할인<br>2026.10.31까지 · 제휴 쿠폰</p></div><div class="lm-coupon-actions"><button type="button" class="lm-code" aria-label="쿠폰 코드 LOOKMOOD01 복사"><strong>LOOKMOOD01</strong><span>코드 복사</span></button><a class="lm-register" target="_blank" rel="sponsored noopener noreferrer">쿠폰 바로 등록 ↗</a></div><p class="lm-coupon-status" role="status" aria-live="polite"></p><details><summary>사용 기간·등록 방법·제휴 안내</summary><p>쿠폰명: LOOKMOOD님이 드리는 전상품 5% 쿠폰<br>사용 기간: 2026년 10월 31일까지 (한국시간)<br>적용 상품: 전상품 (일부 상품 제외)<br>등록 방법: 마이페이지 &gt; 쿠폰 &gt; 쿠폰 등록하기</p><p>기재된 쿠폰 코드를 통해 상품을 구매하실 경우, 상품 구매로 발생한 수익의 일부가 작성자에게 분배됩니다.</p></details>';
    const a=box.querySelector('a');a.href=registerUrl;a.addEventListener('click',()=>track('register',placement));
    box.querySelector('button').addEventListener('click',async()=>{try{await navigator.clipboard.writeText('LOOKMOOD01');box.querySelector('[role=status]').textContent='쿠폰 코드가 복사되었습니다.';track('copy',placement);}catch{box.querySelector('[role=status]').textContent='복사하지 못했습니다. LOOKMOOD01을 직접 입력해 주세요.';}});
    return box;
  }
  if(Date.now()<expires){
    const intro=document.querySelector('.intro');if(intro)intro.after(coupon('home'));
    const panel=document.querySelector('#products .dialog-body');if(panel)panel.prepend(coupon('products'));
    const expire=()=>{if(Date.now()>=expires){document.querySelectorAll('.lm-coupon').forEach(x=>x.remove());clearInterval(timer);}};
    const timer=setInterval(expire,60000);document.addEventListener('visibilitychange',expire);
  }
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function setup(group){if(group.dataset.motionReady)return;group.dataset.motionReady='true';group.classList.add('lm-shop-motion');
    const links=[...group.querySelectorAll('.shop-button')];
    const reset=()=>links.forEach(a=>{a.style.removeProperty('--lm-lift');a.style.removeProperty('--lm-scale');});
    group.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reduced.matches)return;links.forEach(a=>{const r=a.getBoundingClientRect();const distance=(e.clientX-r.left-r.width/2)/110;const strength=Math.exp(-distance*distance*1.6);a.style.setProperty('--lm-lift',(-5*strength)+'px');a.style.setProperty('--lm-scale',String(1+.035*strength));});});
    group.addEventListener('pointerleave',reset);reduced.addEventListener('change',reset);
  }
  const scan=()=>document.querySelectorAll('.shop-buttons').forEach(setup);scan();
  new MutationObserver(scan).observe(document.querySelector('main')||document.body,{childList:true,subtree:true});
  const dialog=document.querySelector('#products');if(dialog)new MutationObserver(scan).observe(dialog,{childList:true,subtree:true});
})();

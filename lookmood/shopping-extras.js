// Lucian UX/UI Prompt #208 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#208
// Storefront motion adapted for text links; navigation and analytics handlers stay intact.
(() => {
  const promotion = document.querySelector('#matinkim-promotion');
  if (promotion && Date.now() >= Date.parse('2026-11-21T00:00:00+09:00')) promotion.remove();
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

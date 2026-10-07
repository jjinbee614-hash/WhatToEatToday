const $=s=>document.querySelector(s);
let returnFocus,scrollY;
function openDialog(dialog,trigger){returnFocus=trigger;scrollY=window.scrollY;document.body.style.position='fixed';document.body.style.top=`-${scrollY}px`;document.body.style.width='100%';dialog.showModal();dialog.querySelector('.close').focus();}
for(const dialog of document.querySelectorAll('dialog')){dialog.querySelector('.close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});dialog.addEventListener('close',()=>{dialog.querySelector('video')?.pause();document.body.style.position='';document.body.style.top='';document.body.style.width='';window.scrollTo(0,scrollY);returnFocus?.focus({preventScroll:true});});}
$('#open-products').onclick=e=>openDialog($('#products'),e.currentTarget);
$('#open-video').onclick=e=>openDialog($('#video-dialog'),e.currentTarget);
function el(tag,text,cls){const node=document.createElement(tag);if(text)node.textContent=text;if(cls)node.className=cls;return node;}
function safeUrl(url){try{const u=new URL(url);return u.protocol==='https:'?u.href:null;}catch{return null;}}
fetch('/lookmood/content.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(data=>{
$('#look-title').textContent=data.look.title;$('#description').textContent=data.look.description;
for(const [name,url] of Object.entries(data.socials)){const href=safeUrl(url);const n=el(href?'a':'span',name);if(href){n.href=href;n.target='_blank';n.rel='noopener noreferrer';}else n.append(el('small','미등록'));$('#socials').append(n);}
const affiliates=data.products.some(p=>p.affiliateVerified&&safeUrl(p.affiliateUrl));if(affiliates){$('#disclosure').hidden=false;$('#disclosure').textContent='이 페이지에는 쿠팡파트너스 제휴 링크가 포함되어 있으며, 이를 통한 구매 시 일정액의 수수료를 제공받습니다.';}
for(const p of data.products.filter(p=>p.published)){const row=el('article',null,'product'),img=el('img');img.src=p.image;img.alt=p.name;img.loading='lazy';const body=el('div');body.append(el('span',p.brand,'brand'),el('h3',p.name),el('span',p.relation==='alternative'?'대체 상품':p.relation==='exact'?'동일 상품':'스타일링 참고 상품','badge'),el('p',p.color+' · '+p.note),el('p',p.stock==='sold_out'?'품절':p.stock==='available'?'재고는 옵션별로 판매처에서 확인해 주세요.':'재고 미확인 · 판매처에서 확인'));const url=safeUrl(p.url);if(url){const a=el('a',p.stock==='sold_out'?'무신사 상품 확인 ↗':'무신사에서 구매하기 ↗','buy');a.href=url;a.target='_blank';a.rel='noopener noreferrer';body.append(a);}if(p.affiliateVerified&&safeUrl(p.affiliateUrl)){body.append(el('p','아래 제휴 링크를 통한 구매 시 일정액의 수수료를 제공받습니다.','disclosure'));const a=el('a','쿠팡 제휴 상품 보기 ↗','buy');a.href=safeUrl(p.affiliateUrl);a.target='_blank';a.rel='sponsored noopener noreferrer';body.append(a);}row.append(img,body);$('#product-list').append(row);}
}).catch(()=>{$('#error').hidden=false;});


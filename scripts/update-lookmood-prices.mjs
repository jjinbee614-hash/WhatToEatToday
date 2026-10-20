import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = process.env.COUPANG_ENV_FILE;
const env = {...process.env};
if (envFile) for (const line of fs.readFileSync(envFile, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
  const i = line.indexOf('=');
  if (i > 0 && !line.trimStart().startsWith('#')) env[line.slice(0,i).trim()] = line.slice(i+1).trim().replace(/^['"]|['"]$/g,'');
}
const access = env.COUPANG_PARTNERS_ACCESS_KEY, secret = env.COUPANG_PARTNERS_SECRET_KEY;
const files = ['lookmood/content.json', ...fs.readdirSync(path.join(root,'lookmood/looks')).filter(x => /^\d+$/.test(x)).map(x => `lookmood/looks/${x}/content.json`).filter(x => fs.existsSync(path.join(root,x)))];
const output = {updatedAt:new Date().toISOString(), products:{}};
const destination = path.join(root,'lookmood/prices.json');
const positivePrice = value => Number.isSafeInteger(Number(value)) && Number(value)>0 ? Number(value) : null;
async function coupang(product) {
  if (!access || !secret) throw Error('credentials_missing');
  const target = new URL(product.affiliateOriginalUrl);
  const id = target.pathname.match(/\/products\/(\d+)/)?.[1];
  if (!id || !target.searchParams.get('itemId') || !target.searchParams.get('vendorItemId')) throw Error('option_unverified');
  const apiPath='/v2/providers/affiliate_open_api/apis/openapi/v1/products/search';
  const keyword=product.name.replace(/\([^)]*\)/g,'').replace(/\s+/g,' ').trim().slice(0,45);
  const query='keyword='+encodeURIComponent(keyword)+'&limit=10';
  const date=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z').slice(2);
  const signature=crypto.createHmac('sha256',secret).update(date+'GET'+apiPath+query).digest('hex');
  const res=await fetch('https://api-gateway.coupang.com'+apiPath+'?'+query,{headers:{Authorization:`CEA algorithm=HmacSHA256, access-key=${access}, signed-date=${date}, signature=${signature}`},signal:AbortSignal.timeout(25000)});
  if(!res.ok) throw Error('api_http_'+res.status);
  const data=await res.json();
  if(String(data.rCode)!=='0') throw Error('api_unavailable');
  const match=data.data?.productData?.find(p=>{
    if(String(p.productId)!==id) return false;
    try {const url=new URL(p.productUrl);return ['itemId','vendorItemId'].every(key=>url.searchParams.get(key)===target.searchParams.get(key));}catch{return false;}
  });
  if(!match || !positivePrice(match.productPrice)) throw Error('same_option_not_found');
  return positivePrice(match.productPrice);
}
async function musinsa(product) {
  const url=new URL(product.url);
  if(url.hostname!=='www.musinsa.com' || !/^\/products\/\d+$/.test(url.pathname)) throw Error('unsupported_source');
  const res=await fetch(url,{signal:AbortSignal.timeout(25000)});
  if(!res.ok) throw Error('source_http_'+res.status);
  const html=await res.text();
  const amount=html.match(/<meta\s+property="product:price:amount"\s+content="(\d+)"/i)?.[1];
  const currency=html.match(/<meta\s+property="product:price:currency"\s+content="([^"]+)"/i)?.[1];
  if(currency!=='KRW' || !positivePrice(amount)) throw Error('price_unavailable');
  return positivePrice(amount);
}
let confirmed=0,failed=0;
for(const file of files) {
  const data=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  for(const product of data.products.filter(p=>p.published)) {
    const key=data.look.id+':'+product.id;
    const variant=product.musinsaCuratorVerified && /^https:\/\/www\.musinsa\.com\/curator\/goods\/[A-Za-z0-9]+$/.test(product.musinsaCuratorUrl||'') && product.musinsaVariant?.verified === true && product.musinsaVariant.color && /^https:\/\/www\.musinsa\.com\/products\/\d+$/.test(product.musinsaVariant.url||'') ? product.musinsaVariant.url : null;
    const affiliate=!variant && product.affiliateVerified && product.affiliateUrl && new URL(product.affiliateUrl).hostname==='link.coupang.com';
    const record={source:affiliate?'coupang':'musinsa',url:variant|| (affiliate?product.affiliateUrl:product.url),currency:'KRW',checkedAt:new Date().toISOString(),amount:null,status:'unavailable'};
    try {
      if(affiliate && product.affiliateStock==='sold_out') {record.status='sold_out';}
      else {record.amount=await (affiliate?coupang(product):musinsa({...product,url:variant||product.url}));record.status='confirmed';confirmed++;}
    } catch(error) {failed++;record.reason=/^(credentials_missing|option_unverified|api_http_\d+|api_unavailable|same_option_not_found|unsupported_source|source_http_\d+|price_unavailable)$/.test(error.message)?error.message:'request_failed';}
    output.products[key]=record;
    console.log(key,record.source,record.status,record.amount??record.reason??'');
    await new Promise(resolve=>setTimeout(resolve,6500));
  }
}
if(!confirmed) {console.error('No prices verified; preserving previous output');process.exitCode=1;}
else {fs.writeFileSync(destination,JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({confirmed,failed,total:Object.keys(output.products).length}));}

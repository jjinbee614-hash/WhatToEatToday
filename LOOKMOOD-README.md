# LOOKMOOD 운영

- 공개 경로: /lookmood, /lookmood/looks/001
- 정적 HTML/CSS/JavaScript. 빌드·패키지 설치 불필요. 기존 Vercel Git 연결로 main 커밋을 배포합니다.
- 콘텐츠/상품/소셜/제휴 설정: lookmood/content.json. 이미지·영상: lookmood/assets/.
- 상품 추가: products 배열에 동일 구조의 객체 추가. published=false로 비노출. stock은 unknown / available / sold_out. relation은 reference / alternative / exact. 참고 이미지가 실제 착용과 일치한다고 보장하지 않습니다.
- SNS는 실제 URL 확보 후 socials의 null을 https URL로 교체합니다.
- 쿠팡파트너스 링크가 실제 발급·검증된 경우에만 affiliateUrl과 affiliateVerified=true를 함께 설정합니다. 일반 쿠팡 주소를 넣지 않습니다. 안내 문구와 버튼 앞 고지는 자동 표시됩니다.
- 초기 EP001의 제목·설명·상품은 JSON 수정 후 커밋하면 됩니다. 새 에피소드 추가는 해당 코디 문서/데이터를 만들고 카드 및 Vercel 경로를 함께 등록합니다. 현재는 EP001 한 편만 공개합니다.
- 가격, 임의 착용 사이즈·후기, 미확인 신발, 쿠팡 일반 상품 후보는 미노출입니다. 상품 링크는 2026-10-07 확인했으며 옵션별 재고는 판매처 확인으로 표시합니다.

## 보존과 라우팅

기존 index.html, eat/, wear/, watch/, food-finder-map.html과 api/kakao.py는 변경하지 않았습니다. 이전 공개 화면으로 향하는 요청만 vercel.json에서 /lookmood로 307 전환합니다. 기존 카카오 API rewrite는 유지했습니다. 기존 음식/의상/영상 추천 UI와 광고 노출은 공개 경로에서 종료됩니다. 회원/로그인/DB 연동 코드는 저장소에서 발견되지 않았습니다.

변경 전 커밋: f02619228fffef959b723e8fd3cb3383dd73f0aa. 전체 Git 백업은 작업 결과 폴더의 what2-before-lookmood.bundle입니다. 원본 이미지·영상은 복사하여 사용했으며 원본은 수정하지 않았습니다. 롤백은 LOOKMOOD 배포 커밋을 git revert하여 정상 Git 배포합니다.

## 쿠팡파트너스 연결 (2026-10-07)

공식 검색·딥링크 API로 상품명/모델을 대조하고 6개의 단축 제휴 URL을 발급했습니다. API 키와 호출 스크립트는 저장소 밖의 work/에만 있습니다. 브라우저는 저장된 URL만 사용합니다.
- 안경: 동일 상품 미확인. 무신사만 표시.
- 재킷: 쿠팡 해당 옵션 품절. 품절 확인 링크로 표시.
- 셔츠·벨트: 상품명/모델 일치. 판매처 색상 분류에 불일치가 있어 옵션 확인 문구 표시.
- 시계·팬츠·가방: 상품명/모델 대조. 재고는 판매처에서 확인.
- affiliateStock은 판매처별 상태이며 원본 상품의 stock과 별도입니다. affiliateCheckedAt은 수동 확인일입니다. 자동 재고 동기화는 없습니다.
- 수수료 안내는 메인 페이지, 제품 모달 상단 및 각 제휴 버튼 앞에 표시됩니다.

## 화이트 UI 개편 (2026-10-07)
Pretendard, 화이트/블랙 기본색, 사용자 제공 LM 원본 로고 적용. 모바일 고정 쇼츠/제품 버튼과 7개 상품 썸네일 바로가기 추가. 로고 원본은 assets/lookmood-logo.png에 복사하여 보존하며 표시 영역만 CSS로 조정합니다.

"""
카카오 Local Search API로 전국 파크골프장 데이터 수집.
큰 지역(서울/경기/강원/충남/경북/경남)은 시·군·구로 쪼개서 더 정밀하게.
사용: KAKAO_KEY=xxx python scripts/scrape-courses.py
출력: scripts/courses.json
"""

import json
import os
import sys
import time
import urllib.parse
import urllib.request

KAKAO_KEY = os.environ.get('KAKAO_KEY')
if not KAKAO_KEY:
    print('환경변수 KAKAO_KEY 설정 필요', file=sys.stderr)
    sys.exit(1)

# 작은 시도는 전체로 1번
SIMPLE_REGIONS = [
    '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '충북', '전북', '전남', '제주',
]

# 큰 지역은 시·군·구로 쪼개서 (45개 cap 우회)
SUB_REGIONS = {
    '서울': [
        '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
        '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
        '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구',
    ],
    '경기': [
        '수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '동두천시',
        '안산시', '고양시', '과천시', '구리시', '남양주시', '오산시', '시흥시', '군포시',
        '의왕시', '하남시', '용인시', '파주시', '이천시', '안성시', '김포시', '화성시',
        '광주시', '양주시', '포천시', '여주시', '연천군', '가평군', '양평군',
    ],
    '강원': [
        '춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시',
        '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군',
        '양구군', '인제군', '고성군', '양양군',
    ],
    '충남': [
        '천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시',
        '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군',
    ],
    '경북': [
        '포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시',
        '문경시', '경산시', '군위군', '의성군', '청송군', '영양군', '영덕군', '청도군',
        '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군',
    ],
    '경남': [
        '창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시',
        '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군',
        '함양군', '거창군', '합천군',
    ],
}

API = 'https://dapi.kakao.com/v2/local/search/keyword.json'


def search(query, page):
    qs = urllib.parse.urlencode({'query': query, 'page': page, 'size': 15})
    req = urllib.request.Request(
        f'{API}?{qs}',
        headers={'Authorization': f'KakaoAK {KAKAO_KEY}'},
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def normalize(doc):
    return {
        'kakaoId': doc['id'],
        'name': doc['place_name'],
        'address': doc['address_name'],
        'roadAddress': doc.get('road_address_name') or '',
        'phone': doc.get('phone') or '',
        'lat': float(doc['y']),
        'lng': float(doc['x']),
        'placeUrl': doc.get('place_url') or '',
        'category': doc.get('category_name') or '',
    }


def fetch_query(seen, query):
    added = 0
    for page in range(1, 4):
        try:
            data = search(query, page)
        except Exception as e:
            print(f'  ! {query} p{page} 실패: {e}', file=sys.stderr)
            break
        docs = data.get('documents', [])
        if not docs:
            break
        for d in docs:
            if d['id'] not in seen:
                seen[d['id']] = normalize(d)
                added += 1
        if data['meta']['is_end']:
            break
        time.sleep(0.05)
    return added


def main():
    seen = {}

    for region in SIMPLE_REGIONS:
        before = len(seen)
        fetch_query(seen, f'{region} 파크골프장')
        print(f'{region}: +{len(seen) - before} (누적 {len(seen)})')

    for province, subs in SUB_REGIONS.items():
        province_before = len(seen)
        for sub in subs:
            fetch_query(seen, f'{province} {sub} 파크골프장')
        print(f'{province} ({len(subs)}개 시군구): +{len(seen) - province_before} (누적 {len(seen)})')

    out_path = os.path.join(os.path.dirname(__file__), 'courses.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(list(seen.values()), f, ensure_ascii=False, indent=2)
    print(f'\n완료: {len(seen)}곳 → {out_path}')


if __name__ == '__main__':
    main()

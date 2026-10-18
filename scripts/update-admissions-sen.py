"""Curated SEN 2028 update. Run once against the July baseline with the source PDF path."""
import json, sys, shutil
from pathlib import Path
import fitz
root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
doc = fitz.open(source)
path = root / 'public/admissions-2028/records.json'
data = json.loads(path.read_text())
records = data['records']
if any(r.get('sourceKey') == 'sen-20261014' for r in records):
    raise SystemExit('Already updated; use the July baseline to regenerate.')
index=[]
for i,p in enumerate(doc):
    t=p.get_text()
    if '2. 전형방법' in t:
        name=t.split('처음으로',1)[1].split('지역',1)[0].strip()
        index.append({'name':name,'page':i+1})
assert len(index)==82
for i,item in enumerate(index):
    item['endPage']=index[i+1]['page']-1 if i+1<len(index) else 334
    item['searchName']=item['name'].replace('한국외국어대','한국외대')
(root/'public/admissions-2028/sen-universities.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
shutil.copyfile(source,root/'public/admissions-2028/sen-preview-20261014.pdf')
pages={'서울대':197,'연세대':241,'고려대':138,'서강대':189,'성균관대':212,'한양대':320,'중앙대':274,'경희대':134,'한국외대':309,'서울시립대':201,'건국대':116,'동국대':164,'홍익대':329,'이화여대':253,'숙명여대':226}
for r in records:
    r['sourceKey']='incheon-20260715'
    r['sourceLabel']='인천교육청 7월 자료'
    r['reviewedAt']='2026-07-15'
    base=r['university'].split('\n')[0]
    if base in pages:
        r['sourceKey']='sen-20261014'
        r['sourceLabel']='SEN 10.14 대조'
        r['sourcePage']=pages[base]
        r['sourceUrl']='/admissions-2028/sen-preview-20261014.pdf'
        r['reviewedAt']='2026-10-14'
        # July page remains for historical provenance; sourcePage is the SEN reference.
        r['notes']=r['notes'].strip()
        r['notes'] += ('\n' if r['notes'] else '')+'SEN 10월 14일 대학별 상세표와 대조. 모집인원은 계약학과·캠퍼스 포함 여부에 따라 달라 이 카드에서는 합산하지 않습니다.'
byid={r['id']:r for r in records}
def patch(id, **values): byid[id].update(values)
def note(id, text):
    r=byid[id];r['verificationNote']=text
patch('2028-10-150',method='1단계 서류 100%: 일반 4배수, 의예·한의예·치의예·약학 5배수\n2단계 1단계 성적 70% + 면접 30%')
patch('2028-3-044',method='교과 56% + 출결 7% + 봉사 7% + 교과종합평가 30%')
patch('2028-10-169',method='1단계 학생부 100%(7배수)\n2단계 학생부 70% + 면접 30%',hasInterview=True)
patch('2028-10-168',method='1단계 학생부 100%(3~7배수)\n2단계 학생부 70% + 면접 30%')
patch('2028-3-053',method='학생부 100%: 정량평가 70% + 정성평가 30%')
patch('2028-10-173',minimum='인문: 국·수·사·과 중 2개 합 4(국어 또는 수학 포함), 영어 3·한국사 4 이내\n자연 일반: 국·수·사·과 중 2개 합 5(수학 포함), 영어 3·한국사 4 이내\n의예·치의예·약학: 수학 포함 1등급 2개, 영어 3·한국사 4 이내\n통합계열: 인문 또는 자연 일반 중 하나 충족\n국제(아시아학·HASS·ISE): 국·수·사·과 중 2개 합 5(국어 또는 수학 포함), 영어 2·한국사 4 이내\n언더우드학부(인문·사회/생명과학공학): 미적용\n탐구 반영은 해당 모집단위 원문 확인',minimumScope='일부 모집단위 미적용')
patch('2028-2-038',minimum='인문: 국·수·사·과 중 2개 합 4(국어 또는 수학 포함)\n자연 일반: 국·수·사·과 중 2개 합 5(수학 포함)\n의예·치의예·약학: 수학 포함 1등급 2개\n통합계열: 인문 또는 자연 일반 기준 중 하나 충족\n공통: 영어 3등급·한국사 4등급 이내, 탐구 반영은 원문 확인')
patch('2028-8-108',minimum='국어·수학·사탐/과탐(1) 중 3개 합 6(국어·수학 필수), 영어 3·한국사 4 이내\n약학과: 3개 합 5(국어·수학 필수), 영어 3·한국사 4 이내')
# The duplicate July Yonsei "no minimum" row conflicts with the 2028 plan.
records.remove(byid['2028-8-133'])
patch('2028-11-223',minimum='일반: 국·수·영·사·과 중 3개 합 6, 한국사 4 이내\n약학부: 국·수·영·사·과 중 4개 합 5, 한국사 4 이내\n인문·사회과학·경영경제 등 과탐 등급 조정은 원문 확인',hasMinimum=True)
patch('2028-11-182',method='의학부는 면접 실시. 1단계 선발배수·2단계 반영비율은 입학처 확인',hasInterview=True)
note('2028-11-182','SEN 3쪽은 의예 5배수·70+30, 274쪽은 의학부 3배수·60+40으로 서로 다릅니다. 수능최저는 탐구 2과목 평균 포함 4합5·한국사4이며, 면접 세부 비율은 입학처 시행계획·최종 모집요강을 확인하세요.')
for id in ['2028-11-180','2028-11-181']:
    patch(id,method='1단계 서류 100%(3~6배수)\n2단계 1단계 성적 60% + 면접 40%')
    note(id,'SEN 3쪽은 3~6배수, 274쪽은 3배수로 표기가 다릅니다. 중앙대 공식 2028 안내는 3~6배수로 안내합니다. 모집단위별 배수는 최종 모집요강에서 확인하세요.')
patch('2028-3-058',method='교과·출결 85% + 서류 15%')
note('2028-3-058','SEN 3쪽은 교과80+출결5+서류15, 253쪽은 학생부(교과)85+서류15로 묶어 표기합니다. 교과·출결 세부 산식은 모집요강 확인이 필요합니다.')
patch('2028-11-198',admission='숙명인재(면접형)',method='1단계 서류 100%(4배수)\n2단계 1단계 성적 70% + 면접 30%')
patch('2028-3-072',minimum='일반 모집단위: 미적용\n약학부: 국·수·영·탐(1) 중 수학 포함 3개 합 5',hasMinimum=True,minimumScope='약학부만 적용')
patch('2028-11-228',admission='학생부종합(서류형)',minimum='SEN 상세표 309쪽: 서울 국·수·영·탐(1) 중 2개 합 5 / 글로벌 2개 합 6\nSEN 요약표 27쪽: 서울 2개 합 6 / 글로벌 2개 합 7\n두 표가 다르므로 입학처 확인 필요',hasMinimum=True)
note('2028-11-228','같은 PDF에서 최저 기준이 다릅니다(27쪽 ↔ 309쪽). 현재 입학처 원문과 최종 모집요강으로 확인하기 전에는 어느 기준도 확정으로 사용하지 마세요. SW인재는 별도 전형이며 수능최저 미적용입니다.')
patch('2028-11-188',admission='학생부종합(면접형)')
for r in records:
    if r.get('sourceKey')=='sen-20261014':
        if r['method'].startswith('서류 100% ('):
            r['method']='1단계 '+r['method'].replace('\n','\n2단계 ',1)
        if r['minimum'].startswith('미적용') and r['hasMinimum']:
            r['minimumScope']='일부 모집단위 적용'
# Split combined SW/regular tracks so the minimum filters remain meaningful.
import copy
sw=copy.deepcopy(byid['2028-11-228'])
sw.update(id='sen-2028-hufs-sw',admission='학생부종합(SW인재)',method='서류 100%',minimum='미적용',hasMinimum=False,notes='SEN 309쪽에서 서류형과 분리된 별도 전형. 모집인원 34명. 모집단위·지원자격은 원문 확인.')
sw.pop('verificationNote',None)
records.append(sw)
sw=copy.deepcopy(byid['2028-11-198'])
sw.update(id='sen-2028-sookmyung-sw',admission='소프트웨어인재',notes='SEN 226쪽에서 숙명인재(면접형)과 구분되는 별도 전형. 모집인원 35명. 모집단위·지원자격은 원문 확인.')
records.append(sw)
data.update(source='서울특별시교육청 쎈(SEN)진학 프리뷰 10월14일 + 인천교육청 7월 자료',updated='2026-10-14',notice='주요 15개 대학 검색자료를 SEN 대학별 상세표와 대조했습니다. 나머지 검색 카드는 인천교육청 7월 자료이며, SEN 원문 바로가기에서 새 자료를 확인할 수 있습니다. PDF 내부 불일치는 별도 표시합니다.',records=records,senReviewedUniversities=15,senReviewedRecords=sum(r['sourceKey']=='sen-20261014' for r in records))
path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('records',len(records),'SEN reviewed',data['senReviewedRecords'],'university index',len(index))

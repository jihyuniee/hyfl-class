# 2028 admissions: SEN October 14 update

Source: Seoul Metropolitan Office of Education, 쎈(SEN)진학 프리뷰, V.10월14일, 335 PDF pages. Original supplied by the site owner and preserved at `public/admissions-2028/sen-preview-20261014.pdf`.

## Coverage

- 238 searchable records total: 60 records at 15 major universities cross-checked against SEN; 178 records retain the Incheon July source label. Existing `page` is the July reference. New `sourcePage` always refers to SEN.
- All 82 university detail sections have an original-PDF page index (98–334). This is source navigation, not a claim that every record in all 335 pages was imported.
- Existing field labels are broad search categories and do not assert department-level recruitment or eligibility.
- No new acceptance probability or past cutoff is inferred from this source. The existing score-reference dataset is unchanged.

## Corrections

- Split HUFS regular document-only and SW tracks: the former has a minimum, the latter does not.
- Split Sookmyung interview and software admissions.
- Central UP ordinary track has a minimum; medical UP has an interview, with inconsistent details in the supplied PDF.
- SKKU science admissions include a second-stage 70/30 interview.
- Remove the duplicate Yonsei essay record that incorrectly showed no minimum; include English/history and mandatory Korean/math conditions.
- Label source date and source page on every record; disclose partial-department minimum application.

## Unresolved source conflicts

- HUFS document-only minimum: page 27 says Seoul 2-sum-6 / Global 2-sum-7; page 309 says 2-sum-5 / 2-sum-6. Both shown, not silently resolved.
- Central medical UP: page 3 says 5x then 70/30; page 274 says 3x then 60/40. Interview confirmed, numeric formula withheld.
- Central CORE/ALL: page 3 and official 2028 microsite say 3–6x, while page 274 says 3x. Display 3–6x with note and official-source link.
- Ewha recommendation: page 3 separates academic80+attendance5+documents15, while page 253 groups academic85+documents15. Display academic/attendance85+documents15 with note.
- Recruitment counts differ for split campuses, free majors, and contract departments; not imported as a single quota.
- Subject evaluation ratios in pages 21/27 may be based on 2027 guidelines/common research. The guide explicitly labels them reference data.
- Interview/essay calendars based on 2027 admissions are not imported as confirmed 2028 dates.

Official Central 2028 reference checked: https://admission.cau.ac.kr/2028_iphak/typeA/index.html

## Validation

`npm test`, TypeScript no-emit, production webpack build, and `git diff --check`. Browser QA is unavailable in the current managed environment.

# 2028 admissions: SEN October 14 update

Source: Seoul Metropolitan Office of Education, 쎈(SEN)진학 프리뷰, V.10월14일, 335 PDF pages. Original supplied by the site owner and preserved at `public/admissions-2028/sen-preview-20261014.pdf`.

## Coverage

- 238 searchable records total: 60 records at 15 major universities cross-checked against SEN (59 retain the SEN source; HUFS document-only now cites the official plan); 178 records retain the Incheon July source label. Existing `page` is the July reference. For SEN records, `sourcePage` refers to SEN; for the HUFS official record it is the physical PDF page (12), not printed page 10.
- All 82 university detail sections have a retained source-data page index (98–334); this is not a claim that every record in all 335 pages was imported.
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

- HUFS conflict resolved on 2026-10-25 against the official plan; see the verification below. The original SEN discrepancy remains documented for audit, but is no longer displayed as unresolved.
- Central medical UP: page 3 says 5x then 70/30; page 274 says 3x then 60/40. Interview confirmed, numeric formula withheld.
- Central CORE/ALL: page 3 and official 2028 microsite say 3–6x, while page 274 says 3x. Display 3–6x with note and official-source link.
- Ewha recommendation: page 3 separates academic80+attendance5+documents15, while page 253 groups academic85+documents15. Display academic/attendance85+documents15 with note.
- Recruitment counts differ for split campuses, free majors, and contract departments; not imported as a single quota.
- Subject evaluation ratios in pages 21/27 may be based on 2027 guidelines/common research and remain reference data.
- Interview/essay calendars based on 2027 admissions are not imported as confirmed 2028 dates.

Official Central 2028 reference checked: https://admission.cau.ac.kr/2028_iphak/typeA/index.html

## Presentation scope

The user clarified that table-reading explanations are for the teacher in conversation, not for publication on the student-facing site. The new reading guide, worked examples and table-navigation panel were removed. Admission-data corrections, provenance and necessary discrepancy notes remain.

## Validation

`npm test`, TypeScript no-emit, production webpack build, and `git diff --check`. Browser QA is unavailable in the current managed environment.

## HUFS official verification — 2026-10-25

- Publisher: 한국외국어대학교 입학처. Notice: 2028학년도 대학입학전형시행계획 안내, published 2026-04-30.
- [Official notice](https://adms.hufs.ac.kr/cms/FrBbsCon/BoardView.do?MENU_ID=380&CONTENTS_NO=4&SITE_NO=2&BOARD_SEQ=4&BBS_SEQ=21191)
- [Official attachment: 2028학년도 대학입학전형시행계획(안).pdf](https://adms.hufs.ac.kr/ajaxfile/FileCpnt/fileDown.do?gbn=d01&BOARD_SEQ=4&SITE_NO=2&BBS_SEQ=21191&FILE_SEQ=1)
- Retrieved 2026-10-25 (Korea date), 23 PDF pages, 652,311 bytes. SHA-256: `7210be34d4f9688bea219bba8313c06ba0b55353fbea3dfca98201d36c37c067`.
- Printed page 10 / physical PDF page 12, section 7, item 3: document-only track uses Korean, mathematics, English, and inquiry (one of integrated social studies or integrated science). Seoul: two-area grade sum ≤6. Global: ≤7. The table enumerates recruiting departments; this is not a claim that every department recruits through this track.
- Printed page 9 / PDF page 11 explicitly states no CSAT minimum for SW talent. Its record and all other admissions records are unchanged.
- SEN page 27 agrees with the official document-only table. SEN page 309's 5/6 pair disagrees for this track; 5/6 appears in the official school-recommendation and essay tables (printed pages 7 and 13). Do not transfer those requirements to document-only admissions.
- Only record `2028-11-228` is corrected. Keep its stable ID, category, fields, method, `hasMinimum: true`, and `hasInterview: false`. Replace its source/page/date and remove the resolved conflict warning. The UI distinguishes the official attachment from SEN and displays publication and verification dates.
- This verifies the published implementation plan, not a final recruitment guide. Recheck the final 2028 rolling-admissions guide and any subsequent corrections before applications.
- `scripts/update-admissions-sen.py` is a historical July-to-SEN migration, already guarded against re-running on current data. It is not an authoritative regeneration path for later official corrections.

### Verification results for this correction

- `npm test`: 10/10 passed, including the actual search-page filter chain for university, category, field, minimum and interview; official 6/7 values and provenance are checked.
- TypeScript no-emit and targeted ESLint passed; `git diff --check` passed.
- Production webpack build passed with placeholder `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` for unrelated Supabase pages. Without those build-time variables, the baseline requires Supabase configuration at `/meal`; no production credentials or data were used.
- All 238 records retained; comparison against the previous commit confirms only `2028-11-228` changed. SW, interview, school-recommendation, essay and all other records are identical.
- Bumped the JSON fetch version to `hufs-20261025` to avoid reusing the prior data URL.
- Browser QA could not run because the managed runtime has no Playwright Chromium executable. No claim of visual/end-to-end browser verification is made.

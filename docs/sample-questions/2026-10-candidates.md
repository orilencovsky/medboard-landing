# Sample-question candidates — October 2026 (owner sign-off)

> **How these were chosen:** read-only export from the product DB (`app_ready_questions_v2` joined to `question_published_v2`), keeping only questions served in the app today with `citation_verified = true`, a single correct answer and no image. Within that set, preference went to `quality_level` 4 and `review_status = source_verified`, a short stem, a quote under 300 characters, high-yield topics that don't overlap, and an explanation and distractor rationale that agree with the answer key and the source.  
> **What "quote checked" means:** a whitespace- and punctuation-insensitive search for the DB `quote` in the extracted source texts in the product repo (`/Users/ori/dev/meduxa/sources/`). Each match is listed with its file and line. It confirms that the quote exists in the source. It doesn't confirm the answer key; that's your medical sign-off.  
> **Nothing here ships until it's ticked.** The Hebrew question content is verbatim from the DB. Each field was checked against the DB with a per-field hash. For display only, line breaks inside an option are shown as a space.

## Summary

| Specialty (DB module) | Candidates | Quote checked | Notes |
|---|---|---|---|
| Nephrology (`nephrology`) | 5 | 5 of 5 | 1,014 questions passed the filters. |
| Family medicine (`family`) | **none** | — | 0 rows in `app_ready_questions_v2`. The 1,088 family questions in `questions_v2` are all draft, needs-review or flagged. |
| Pediatrics (`peds`) | **none** | — | 1 row passed the filters (id 11864) and it fails the selection criteria (see below). The other peds questions aren't served yet. |
| Cardiology (`cardio`) | **none** | — | 0 rows in `app_ready_questions_v2`. The 587 cardio questions are all draft or needs-review. |

Per the spec, a specialty marked **none** ships without a DB sample-questions section. The existing hand-written question on `/family-medicine` and `/pediatrics` can stay.

---

## Nephrology

### N1. DB id 409 — Glomerular disease: IgA nephropathy

- **Module:** `nephrology` · **DB topic:** גלומרולופתיות · **Exam:** שלב א 2021 · **quality_level:** 4 · **citation_verified:** true · **review_status:** source_verified

**Stem**

> מה מאפיין את שקיעת נוגדני IgA בכליה ב-IGA NEPHROPATHY?

**Options** (the keyed answer is marked ✅)

- **א.** מדובר בנוגדנים מונומרים (monomeric) מסוג IgA 2
- **ב.** מדובר בנוגדנים מונוקלונלים (monoclonal) בד"כ מסוג Lambda
- **ג.** מדובר בנוגדנים פולימרים (polymeric) מסוג IgA 1 ✅ **(keyed answer)**
- **ד.** מדובר בנוגדנים מונומרים (monomeric) שיכולים להיות מסוג IgA 1 או IgA 2

**Explanation** (shown after a correct pick)

> ב-IgA Nephropathy, ה-IgA המשקע במזנגיום הוא ספציפית פולימרי IgA1 (pIgA1). IgA1 הוא תת-המחלקה הנושאת את שרשרת ה-hinge האופיינית עם סוכרים O-linked, בעוד ש-IgA2 חסר hinge ואינו ממלא תפקיד בפתוגנזה. ה-IgA הפולימרי מקורו בעיקר ברקמת המוקוזה (MALT) ועובר לזרם הדם ומשם מגיע למזנגיום. ה-IgA1 במחלה זו מאופיין בגליקוזילציה לקויה (galactose-deficient IgA1, gd-IgA1) הגורמת לשקיעה מזנגיאלית ולנזק גלומרולרי.

**Quote and citation**

> "mesangial IgA in IgAN is predominantly pIgA1"

- Citation (DB `source`, verbatim): `Johnson_IV_09 - Immunoglobulin A Nephropathy and Immunoglobulin A Vasculitis (Henoch-Schönlein P`
- Suggested display citation (not in the DB; please confirm): Johnson, Comprehensive Clinical Nephrology, 7th ed. — Ch. "Immunoglobulin A Nephropathy and Immunoglobulin A Vasculitis (Henoch-Schönlein Purpura)"

**Distractor rationale** (shown after a wrong pick)

- **א:** IgA2 חסר את אזור ה-hinge האופייני ל-IgA1 ולכן אינו נושא את הסוכרים O-linked האופייניים. המקור מציין במפורש כי 'IgA2 has no hinge and carries no such sugars', ולכן IgA2 אינו מעורב בפתוגנזה של IgAN ואינו מונומרי בהקשר המזנגיאלי.
- **ב:** IgA הנוגד מזנגיאלי ב-IgAN אינו מונוקלונלי אלא פולי-קלונלי. IgA מונוקלונלי עשוי להופיע במצבים כגון IgA monoclonal gammopathy (מיאלומה), אך שם שקיעה מזנגיאלית של IgA היא נדירה. המקור מדגיש כי 'High circulating levels of monoclonal IgA in myeloma... only infrequently provoke mesangial IgA deposition', ולכן מסיח זה אינו נכון.
- **ד:** ה-IgA המשקע במזנגיום ב-IgAN אינו מונומרי אלא פולימרי, וספציפית הוא IgA1 בלבד — לא IgA2. המקור מציין כי 'mesangial IgA in IgAN is predominantly pIgA1', כאשר הפולימריות היא תכונה מהותית המאפשרת שקיעה מזנגיאלית. IgA מונומרי (mIgA1) מוסלק בכבד דרך receptors ייעודיים ואינו מתאפיין בשקיעה מזנגיאלית.

**Quote check:** `quote checked`. Verbatim in `sources/source_text/Johnson_IV_09 - Immunoglobulin A Nephropathy and Immunoglobulin A Vasculitis (Henoch-Schönlein P.pdf.txt`, line 73 ("…In addition, mesangial IgA in IgAN is predominantly pIgA1."). Also in the full-book extract `Johnson R. Comprehensive Clinical Nephrology 7ed 2023.pdf.txt`, line ~32834.

**Notes for the reviewer**

- The DB citation is a file name, cut off mid-word ("…Henoch-Schönlein P"). The page needs a readable citation; a suggested one is above.
- The explanation adds points the quote doesn't cover (mucosal/MALT origin, galactose-deficient IgA1). Please confirm them.

- [ ] Approved by owner

---

### N2. DB id 448 — Electrolytes: hyponatremia correction and ODS risk

- **Module:** `nephrology` · **DB topic:** הפרעות אלקטרוליטים וחומצה-בסיס · **Exam:** שלב א 2021 · **quality_level:** 3 · **citation_verified:** true · **review_status:** source_verified

**Stem**

> מה מעלה סיכון לפתח osmotic demyelination syndrome (ODS) במהלך תיקון היפונתרמיה (Hyponatremia)?

**Options** (the keyed answer is marked ✅)

- **א.** היפרקלמיה
- **ב.** המודיאליזה במטופל אורמי
- **ג.** היפונתרמיה שמתפתחת בזמן ריצת מרתון
- **ד.** אלכוהוליזם ✅ **(keyed answer)**

**Explanation** (shown after a correct pick)

> תסמונת הדמיאלינציה האוסמוטית (ODS) היא סיבוך חמור של תיקון מהיר מדי של היפונתרמיה כרונית חמורה. גורמי סיכון מוכרים ל-ODS כוללים: ריכוז נתרן סרום נמוך מ-105 mEq/L, היפוקלמיה, הפרעות שתייה (alcohol use disorder), תת-תזונה ומחלת כבד. אלכוהוליזם (alcohol use disorder) מוזכר במפורש כגורם סיכון גבוה ל-ODS, ולכן תשובה ד נכונה. נקודת הלמידה: בחולים עם גורמי סיכון אלה, קצב התיקון המרבי הבטוח הוא 8 mEq/L בכל פרק זמן של 24 שעות.

**Quote and citation**

> "Among patients with severe, chronic hyponatremia, individuals at highest risk for ODS include those with serum sodium concentrations of less than or equal to 105 mEq/L; those with hypokalemia, alcohol use disorder, malnutrition, or liver disease; and, possibly, those with hypophosphatemia."

- Citation (DB `source`, verbatim): `UTD__Electrolytes__Overview_of_the_treatment_of_hyponatremia_in_adults_-_UpToDate`
- Suggested display citation (not in the DB; please confirm): UpToDate — Overview of the treatment of hyponatremia in adults

**Distractor rationale** (shown after a wrong pick)

- **א:** היפוקלמיה (hypokalemia) — ולא היפרקלמיה — מוזכרת כגורם סיכון ל-ODS. היפרקלמיה אינה מופיעה כגורם סיכון ל-ODS בשום מקור מותר, ולמעשה היא שכיחה בהיפונתרמיה הנגרמת מאי-ספיקת אדרנל ואינה מגבירה סיכון לדמיאלינציה.
- **ב:** המודיאליזה במטופל אורמי אינה מוזכרת כגורם סיכון ל-ODS. אי-ספיקת כליות כרונית מתקדמת עם אוליגוריה עלולה לגרום להיפונתרמיה, אך לא מדובר בגורם סיכון מוכר לתסמונת זו; קצב תיקון הנתרן בהמודיאליזה עשוי להיות מהיר ולדרוש ניטור, אך עצם הדיאליזה אינה מגדירה סיכון ל-ODS.
- **ג:** היפונתרמיה בריצת מרתון היא דוגמה קלאסית להיפונתרמיה אקוטית (acute hyponatremia) — כזו שהתפתחה תוך פחות מ-48 שעות. המקור מציין במפורש שחולים עם היפונתרמיה אקוטית, כדוגמת רצי מרתון, הם בסיכון נמוך ל-ODS כיוון שלמוח לא הייתה שהות לבצע הסתגלות אוסמוטית; בהיעדר הסתגלות זו, הסיכון לנזק מתיקון מהיר הוא מינימלי.

**Quote check:** `quote checked`. Verbatim in `sources/source_text/UTD__Electrolytes__Overview_of_the_treatment_of_hyponatremia_in_adults_-_UpToDate.pdf.txt`, lines 194–196 (bullet "High risk for ODS – Among patients with severe, chronic hyponatremia, …").

**Notes for the reviewer**

- Its `quality_level` is 3, not 4. None of the five quality-4 electrolyte/acid-base questions passed (see "Considered and not picked"), so this is the best one on that topic.
- The explanation adds a correction limit ("8 mEq/L in any 24 hours") that isn't in the quote. Please confirm it.
- The DB citation is a file name. A suggested readable citation is above.

- [ ] Approved by owner

---

### N3. DB id 819 — Hypertension and pregnancy: preeclampsia (sFlt1)

- **Module:** `nephrology` · **DB topic:** יתר לחץ דם ונפרולוגי · **Exam:** שלב א 2017 · **quality_level:** 4 · **citation_verified:** true · **review_status:** source_verified

**Stem**

> מהו המנגנון העיקרי המוצע להשפעת sFLT ברעלת הריון?

**Options** (the keyed answer is marked ✅)

- **א.** מכווץ את המזנגיום בתיווך TGF
- **ב.** לוכד VEGF   ובכך אינו מאפשר חיבור   VEGF לקולטנים שלו על תאי האנדותל ✅ **(keyed answer)**
- **ג.** מדכא ברמת ה- RNA   יצור VEGF  בתאי הפודוציטים
- **ד.** נקשר לחלק ה NC  של שרשרת אלפא-5 של קולגן סוג VI  בממברנה הבזלית ומוביל להורדת ה charge selectivity

**Explanation** (shown after a correct pick)

> sFlt1 הוא ספליס-וריאנט מקוצר של קולטן ה-VEGF (Flt1), החסר את הדומיין התוך-תאי והטרנס-ממברנלי אך שומר על הדומיין החוץ-תאי הקושר VEGF ו-PlGF. בפרה-אקלמפסיה, השיליה מייצרת עודף sFlt1 שמשתחרר למחזור הדם האימהי. שם הוא לוכד את ה-VEGF החופשי ואת ה-PlGF ומונע מהם להתקשר לקולטניהם על תאי האנדותל. כתוצאה מכך, האנדותל מאבד את תמיכת ה-VEGF הנחוצה לשמירת תפקודו התקין, מה שמוביל לעווית כלי דם, פגיעה אנדותליאלית מפושטת, יתר לחץ דם ופרוטאינוריה — כל הסימנים הקליניים של רעלת הריון. זוהי נקודת הלמידה המרכזית: sFlt1 פועל כ-'decoy receptor' במחזור הדם ולא כמולקולה הפועלת ישירות על הגרעין או על הממברנה הבזלית.

**Quote and citation**

> "sFlt1, a truncated splice variant of the VEGFR Flt1, antagonizes VEGF and PlGF by binding them in the circulation and preventing interaction with their endogenous receptors in the vasculature."

- Citation (DB `source`, verbatim): `Brenner_and_Rector_The_Kidney_Chapter_48_Pregnancy_and_Kidney_Disease`
- Suggested display citation (not in the DB; please confirm): Brenner & Rector's The Kidney, 11th ed. — Ch. 48, Pregnancy and Kidney Disease

**Distractor rationale** (shown after a wrong pick)

- **א:** sFlt1 אינו פועל דרך כיווץ מזנגיאלי בתיווך TGF. המקור מציין ש-sEng (soluble endoglin) — ולא sFlt1 — הוא הגורם הקשור לנתיב TGF-β. sEng הוא צורה מקוצרת של קולטן ה-TGF-β ופועל בסינרגיה עם sFlt1, אך המנגנון של sFlt1 עצמו הוא לכידת VEGF ו-PlGF בזרם הדם.
- **ג:** sFlt1 אינו מדכא ייצור VEGF ברמת ה-RNA בפודוציטים. להיפך — המקור מתאר ש-sFlt1 פועל כחלבון מסיס במחזור הדם שלוכד VEGF שכבר הופרש, ולא כמדכא תעתיק. יתרה מכך, דווקא ירידה בסיגנול VEGF (בשל לכידתו) גורמת לירידה בביטוי נפרין בפודוציטים, אך זהו נזק משני ולא מנגנון הפעולה הראשוני של sFlt1.
- **ד:** קולגן סוג IV (ולא VI) הוא המרכיב המרכזי של הממברנה הבזלית הגלומרולרית, ו-sFlt1 אינו נקשר לממברנה הבזלית כלל. הפגיעה ב-charge selectivity המתוארת בפרה-אקלמפסיה נובעת מ-endotheliosis גלומרולרית ומאובדן fenestrae אנדותליאליות — לא מקשירה ישירה לקולגן הממברנה הבזלית. מסיח זה מתאר מנגנון שאינו מוזכר בהקשר של sFlt1 בשום מקור מותר.

**Quote check:** `quote checked`. Verbatim in `sources/source_text/Brenner_11e__48_Pregnancy_and_Kidney_Disease.pdf.txt`, lines 1343–1347. The source sentence continues with "(Fig. 48.10)" after "vasculature", which the quote drops; no change in meaning.

**Notes for the reviewer**

- Option ד says collagen type **VI**. The distractor rationale points out it should be IV. That's harmless for a wrong option; it's left verbatim.
- The DB citation is a file name. A suggested readable citation is above.

- [ ] Approved by owner

---

### N4. DB id 756 — Kidney transplantation: post-transplant erythrocytosis

- **Module:** `nephrology` · **DB topic:** השתלת כליה · **Exam:** שלב א 2017 · **quality_level:** 4 · **citation_verified:** true · **review_status:** source_verified

**Stem**

> אריתרוציטוזיס לאחר ההשתלה

**Options** (the keyed answer is marked ✅)

- **א.** קשורה להופעה של פוליציטמיה וורה
- **ב.** ניתנת לטיפול על ידי חוסמי ace ✅ **(keyed answer)**
- **ג.** מלווה בדרך כלל בעודפי פריטין בדם
- **ד.** שכיחה יותר במטופלים ב-MTOR INHIBITORS

**Explanation** (shown after a correct pick)

> אריתרוציטוזיס לאחר השתלת כליה (PTE) מטופלת בהצלחה באמצעות מעכבי ACE או חוסמי ARB, אשר לרוב מספיקים לשמירה על ערכי המוגלובין בטווח תקין. הטיפול מומלץ כאשר רמת ההמוגלובין עולה על 17–18 גרם/ד"ל או ה-Hct עולה על 51%–54%, בשל הסיכון לסיבוכים תרומבואמבוליים, יתר לחץ דם וכאבי ראש. נקודת הלמידה המרכזית: מעכבי ACE/ARB הם קו הטיפול הראשון ב-PTE, והפלבוטומיה שמורה רק למקרים עמידים.

**Quote and citation**

> "Treatment with ACE inhibitors or ARBs is often sufficient, although phlebotomy may occasionally be necessary."

- Citation (DB `source`, verbatim): `Danovitch, Handbook of Kidney Transplantation, 7th ed. — Chapter 11: Posttransplant: The First 3 Months`

**Distractor rationale** (shown after a wrong pick)

- **א:** PTE אינה קשורה לפוליציטמיה ורה (Polycythemia Vera), שהיא מחלה מיאלופרוליפרטיבית ראשונית הנגרמת ממוטציה ב-JAK2. PTE היא תופעה משנית הנובעת מתפקוד טוב של השתל הכלייתי ומייצור עודף אריתרופויאטין. שתי הישויות הן נפרדות לחלוטין מבחינה פתופיזיולוגית ואינן מהוות אחת את האחרת.
- **ג:** PTE אינה מלווה בעודפי פריטין בדם. להפך — מאחר שמדובר בייצור מוגבר של תאי דם אדומים, צריכת הברזל עולה ועלולה להתפתח דלדול מאגרי ברזל. עודף פריטין אופייני לתהליכים דלקתיים כרוניים, המוכרומטוזיס, או למצבי עומס ברזל — לא ל-PTE.
- **ד:** המקור מציין כגורמי סיכון ל-PTE: נוכחות כליות נטיביות, מין זכר, העדר דחיות, המוגלובין גבוה לפני ההשתלה, יתר לחץ דם, עישון, סוכרת, מחלת כליות פוליציסטית וגלומרולונפריטיס — ואין כל אזכור לקשר בין מעכבי mTOR לבין שכיחות מוגברת של PTE. בפועל, מעכבי mTOR ידועים כגורמים לאנמיה ולא לאריתרוציטוזיס.

**Quote check:** `quote checked`. Near-verbatim in `sources/source_text/Danovitch_7e__11_Posttransplant_The_First_3_Months.pdf.txt`, lines 935–936. Source reads: "In the absence of baseline hyperkalemia, treatment with ACEIs or ARBs is often sufficient, although phlebotomy may occasionally be necessary (eg, hemoglobin >18 g/dL or hematocrit >55%, …)". The quote spells out "ACE inhibitors" and drops the leading condition "In the absence of baseline hyperkalemia". Not material to the answer key, but see the note on the explanation.

**Notes for the reviewer**

- **Please check: the explanation's hematocrit threshold doesn't match the source.** The explanation says "Hct עולה על 51%–54%". Danovitch (same file, lines 932–933) says "a hematocrit level greater than 51% to 52%". Before shipping, either correct it to 51%–52% (as a DB edit in the product) or swap this question. This doesn't affect the answer key.
- The stem is a sentence fragment ("אריתרוציטוזיס לאחר ההשתלה") that the options complete, as in the original exam.

- [ ] Approved by owner

---

### N5. DB id 923 — Kidney stones: dietary prevention of calcium-oxalate stones

- **Module:** `nephrology` · **DB topic:** אבנים בדרכי השתן · **Exam:** שלב א 2018 · **quality_level:** 4 · **citation_verified:** true · **review_status:** source_verified

**Stem**

> בת 35 עוברת בירור לאבני כליה. באנמנזה מסתבר שלאחיה גם יש אבני כליה ושהחולה נוטלת מולטי-ויטמין המכיל ויטמינים מסוג A, C, D. באנליזת אבן שנפלטה נמצא קלציום אוקסלט. היא קוראת באינטרנט על הנחיות תזונתיות ומגיעה להתייעץ. איזה מההמלצות הבאות מתאימה לחולה זו?

**Options** (the keyed answer is marked ✅)

- **א.** אין להגביל סידן בתזונה ✅ **(keyed answer)**
- **ב.** אין להגביל חלבון מן החי
- **ג.** אין להגביל נתרן בתזונה
- **ד.** ניתן להמשיך עם מולטי ויטמין

**Explanation** (shown after a correct pick)

> בחולה עם אבני קלציום-אוקסלט, אין להגביל סידן בתזונה: הגבלת סידן תזונתי מגבירה דווקא את ספיגת האוקסלט במעי (פחות סידן לקשור אוקסלט) ומעלה את הסיכון לאבנים. ההמלצה היא לשמור על צריכת סידן תזונתי מספקת (להימנע מדיאטה דלת-סידן). נקודת הלימוד: אין להגביל סידן תזונתי באבני קלציום-אוקסלט.

**Quote and citation**

> "For all patients with calcium oxalate stones, we suggest against a low-calcium diet"

- Citation (DB `source`, verbatim): `UpToDate — Kidney stones in adults: Prevention of recurrent kidney stones`

**Distractor rationale** (shown after a wrong pick)

- **ב:** להפך — מומלץ דווקא להפחית חלבון מן החי (לא-חלבי), המעלה עומס חומצה, סידן בשתן וירידה בציטרט; ולכן 'אין להגביל חלבון' שגוי.
- **ג:** מומלץ להפחית נתרן (הגבלת מלח מורידה סידן בשתן); 'אין להגביל נתרן' שגוי.
- **ד:** יש להפסיק מולטי-ויטמין המכיל ויטמין C במינון גבוה (מטבוליזם ל-אוקסלט) — המשך הנטילה מגביר את הסיכון לאבנים.

**Quote check:** `quote checked`. Verbatim in `sources/source_text/Kidney stones in adults_ Prevention of recurrent kidney stones - UpToDate.pdf.txt`, lines 184–185 (under "Maintain adequate calcium intake").

**Notes for the reviewer**

- This stem is the longest of the five (252 characters). The other four are under 100.
- The rationale for ד talks about "high-dose" vitamin C, but the stem doesn't give a dose. Please confirm you're comfortable with that wording.

- [ ] Approved by owner

---

## Nephrology — alternates (not written up in full)

If you swap a question out, these two passed the same filters. Ask and they'll be written up in full before use.

| DB id | Topic | Stem | Key | quality | Quote check |
|---|---|---|---|---|---|
| 927 | Peritoneal dialysis — membrane failure | מה נכון לגבי תפקוד הממברנה הפריטונאלית? | ב | 4 | `quote checked`: verbatim in `Daugirdas_לפי_פרקים__19_Physiology_of_PD.pdf.txt`, line 541 |
| 430 | Transplant — post-transplant diabetes timing | מתי מופיעה ההארעות הגבוהה ביותר (מספר המקרים לחודש) של POST TRANSPLANT DIABETES MELLITUS? | א | 4 | `quote checked`: near-verbatim in `UTD__Transplant__Overview_of_care_of_the_adult_kidney_transplant_recipient_-_UpToDate.pdf.txt`, lines 545–546 (only the reference markers [45] differ). The explanation's mechanism claims go beyond the quote. |

## Considered and not picked

| DB id | Why not |
|---|---|
| 905 (titratable acid, q4) | The answer key is fine (phosphate), but the rationale for option ג says creatinine "is not a buffer". Burton Rose ch. 11 (`05 - 11- Regulation of Acid-Base Balance.pdf.txt`, line 351) names creatinine as a minor titratable buffer. |
| 749 (Mg / TRPM6, q4) | The quote exists (UpToDate, hypomagnesemia causes, line 92), but it's about intestinal TRPM6 inhibition by PPIs. It doesn't support the keyed claim, which is about the DCT. |
| 243 (urine pH and NH4+, q4) | The keyed answer (NH4+ excretion falls) isn't supported by its quote, which is only about titratable acid, and the claim is debatable. |
| 244 (K+ and acid-base, q4) | The stem and options have broken punctuation ("מאזן?חומצה בסיס", "NH4. … +"). |
| 45 (hypomagnesemia → hypocalcemia, q4) | The quote starts with a heading fragment from the PDF extraction, and the stem is a negative ("which is NOT") question. |
| 529 (IgAN pathogenesis, q4) | It overlaps with 409, and its quote is a paraphrase: only 8 of 20 words match the Johnson text. |
| 296 (preeclampsia PlGF, q4) | It overlaps with 819, and its quote starts with figure and reference debris ("48.11)162–164 …"). |
| 948 (ADPKD, q4) | The quote is spliced from two NEJM sentences, and the article isn't in the repo's sources. |
| 697 (PD fluid osmolarity, q4) | Option ד (485) doesn't match the source (484). It's also a low-value rote fact. |
| 11864 (peds, C. difficile, q0) | It's the only peds row served. Its quality_level is 0, its stem is 420 characters, and its quote is 342 characters and spliced ("[...]"). Nelson isn't in the repo, so the quote can't be checked. |

import * as React from 'react';
import { LoopSection } from 'meduxa-landing-ds';

export function Default() {
  return (
    <LoopSection
      dir="rtl"
      eyebrow="THE LOOP"
      title="לולאה אחת — לא שבעה טאבים"
      subtitle="בנק שאלות, אפליקציית כרטיסיות, צ׳אט AI וגיליון מעקב הם ארבעה מוצרים שלא מדברים זה עם זה. כאן זו מערכת אחת שמזינה את עצמה — וכל סיבוב מדייק את המודל שלך."
      readinessLabel="READINESS"
      readinessValue="64%"
      readinessCaption="מודל המוכנות שלך"
      heat={['risk', 'warn', 'ok', 'ok', 'risk', 'ok', 'warn', 'ok', 'ok', 'risk', 'ok', 'warn']}
      liveLabel="חי עכשיו"
      soonLabel="בקרוב"
      contrastLabel="WITHOUT IT"
      contrastTabs={['QBANK', 'ANKI', 'CHATGPT', 'PDF', 'SHEET']}
      contrastNote="חמישה מוצרים, אפס חיווט. אף אחד מהם לא יודע במה נכשלת אתמול."
      nodes={[
        {
          no: '01',
          name: 'שאלות',
          state: 'live',
          step: 'STEP 01 · LIVE',
          title: 'שאלה שנבדקה — לא שנוצרה',
          lead: 'AI כותב טיוטה, רופא מומחה מאשר, ורק אז היא מגיעה אליך. Grounded זה לא Vetted — שאלה שנשענת על מקור עדיין יכולה להיות מנוסחת רע או לבדוק טריוויה שהמבחן לא שואל.',
          points: [
            'התשובה לא נפתחת עד שאתה מנסח בשורה למה בחרת.',
            'לפני כל תשובה אתה מדרג כמה אתה בטוח — זה מה שמזין את הקליברציה.',
            'כל הסבר נושא ציטוט מילולי עם מספר סעיף.',
          ],
        },
        {
          no: '02',
          name: 'טיוטור',
          state: 'live',
          accent: 'violet',
          step: 'STEP 02 · LIVE',
          title: 'לא נותן תשובה — מחזיר שאלה',
          lead: 'כל AI אחר מתחרה על קיצור הדרך לתשובה. הטיוטור שלנו מאריך אותה בכוונה: הוא מוביל אותך להסקה במקום למסור אותה, כי המאמץ הוא מה שנשאר.',
          points: [
            'שיטה סוקרטית — שאלה מנחה אחת בכל פעם, לא הרצאה.',
            'הוא רואה מה בחרת ולמה, ומכוון לפער הספציפי שלך.',
            'המקור זמין לצד השיחה — אפשר לאמת כל טענה תוך כדי.',
          ],
        },
        {
          no: '03',
          name: 'דק הפערים',
          state: 'soon',
          step: 'STEP 03 · ROADMAP',
          title: 'דק שאתה לא בונה',
          lead: 'החלק הקשה ב-Anki הוא להרכיב את הכרטיסים, ורוב המתמחים לעולם לא עושים את זה כמו שצריך. כאן הכרטיס נולד מהטעות שלך — והצד השני שלו הוא המשפט שאתה כתבת, מתוקן.',
          points: [
            'נטבע ממה שפספסת, ממה שניחשת נכון, וממה שהיית בטוח בו וטעית.',
            'התזמון נגזר מהקליברציה שכבר נמדדה — לא מדירוג עצמי של "קל / קשה".',
            'כל כרטיס שומר את הציטוט ואת חתימת הרופא, ומקשר בחזרה לספריה.',
          ],
        },
        {
          no: '04',
          name: 'ספריה',
          state: 'soon',
          step: 'STEP 04 · ROADMAP',
          title: 'ספריה שיודעת מה נשאל ממנה',
          lead: 'לא "צ׳אט עם הספרים". הקורפוס הקנוני של המבחן כבר בפנים — אתה לא מחפש, לא מעלה, ולא מנחש אם זה המקור הנכון. הערך הוא באנוטציה, לא בחיפוש.',
          points: [
            'כל פסקה נושאת כמה פעמים נשאלה בשלב א׳ — ואיפה אתה נופל בה.',
            'כל ציטוט בכל שאלה הוא לינק חי לסעיף המדויק.',
            'סימון פסקה ← "תרגל אותי על זה" ← שאלות מאומתות מאותו סעיף.',
          ],
        },
      ]}
    />
  );
}

export function EnglishLtr() {
  return (
    <LoopSection
      eyebrow="THE LOOP"
      title="One loop — not seven tabs"
      subtitle="A question bank, a flashcard app, an AI chat and a tracking sheet are four products that never talk to each other. This is one system that feeds itself — and every turn sharpens the model of you."
      readinessLabel="READINESS"
      readinessValue="64%"
      readinessCaption="Your readiness model"
      heat={['risk', 'warn', 'ok', 'ok', 'risk', 'ok', 'warn', 'ok', 'ok', 'risk', 'ok', 'warn']}
      liveLabel="Live now"
      soonLabel="Coming"
      contrastLabel="WITHOUT IT"
      contrastTabs={['QBANK', 'ANKI', 'CHATGPT', 'PDF', 'SHEET']}
      contrastNote="Five products, zero wiring. None of them knows what you failed yesterday."
      nodes={[
        {
          no: '01',
          name: 'Questions',
          state: 'live',
          step: 'STEP 01 · LIVE',
          title: 'Vetted, not just generated',
          lead: 'AI drafts it, a specialist physician signs it off, and only then does it reach you. Grounded is not the same as vetted — a question resting on a real source can still be badly worded, or test trivia the exam never asks.',
          points: [
            'The answer stays locked until you write one line on why you chose it.',
            'You rate your confidence before every answer — that is what feeds calibration.',
            'Every explanation carries a verbatim citation with a section number.',
          ],
        },
        {
          no: '02',
          name: 'Tutor',
          state: 'live',
          accent: 'violet',
          step: 'STEP 02 · LIVE',
          title: 'It asks back instead of answering',
          lead: 'Every other AI competes on shortening the path to the answer. Ours lengthens it on purpose: it walks you to the inference rather than handing it over, because the effort is what stays.',
          points: [
            'Socratic — one guiding question at a time, never a lecture.',
            'It sees what you picked and why, and aims at your specific gap.',
            'The source sits beside the conversation, so any claim can be checked mid-thread.',
          ],
        },
        {
          no: '03',
          name: 'Gap deck',
          state: 'soon',
          step: 'STEP 03 · ROADMAP',
          title: 'A deck you never build',
          lead: 'The hard part of Anki is assembling the cards, and most residents never do it properly. Here the card is born from your mistake — and its back is the sentence you wrote, corrected.',
          points: [
            'Minted from what you missed, what you guessed right, and what you were sure of and got wrong.',
            'Scheduling comes from calibration already measured — not a self-rated "easy / hard".',
            'Each card keeps its citation and physician sign-off, and links back into the library.',
          ],
        },
        {
          no: '04',
          name: 'Library',
          state: 'soon',
          step: 'STEP 04 · ROADMAP',
          title: 'A library that knows what gets asked of it',
          lead: 'Not "chat with your books". The exam’s canonical corpus is already inside — nothing to find, upload, or guess at. The value is the annotation, not the search.',
          points: [
            'Every passage carries how often it has been asked — and where you fall in it.',
            'Every citation in every question is a live link to the exact section.',
            'Mark a passage → "drill me on this" → vetted questions from that section.',
          ],
        },
      ]}
    />
  );
}

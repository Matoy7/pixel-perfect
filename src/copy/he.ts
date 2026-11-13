// All visible / accessible Hebrew UI text lives here.
export const copy = {
  welcome: {
    start: 'התחלת משחק',
    portfolio: 'לתיק העבודות של יותם אלירז (נפתח בכרטיסייה חדשה)',
  },
  story: {
    skip: 'דילוג',
    label: 'הסיפור: פיגמי והפיקסל השחור',
  },
  tutorial: {
    instruction: 'לחץ על הפיקסל השחור בתמונה',
    label: 'שלב אימון: מצא את הפיקסל השחור',
  },
  /** Success card after finding a pixel (tutorial and every level). */
  found: {
    title: 'מעולה! מצאת אותו',
    next: 'יאללה, לשלב הבא',
  },
  level: {
    label: (n: number) => `שלב ${n}`,
    number: (n: number) => `שלב ${n}`,
    /** Location line on the level identification card, by level index. */
    places: [
      'AM:PM · המכולת השכונתית',
      'המשרד · צוות הפיתוח',
      'נתב״ג · נמל התעופה בן גוריון',
      'רחוב יפה · אתר הבנייה',
      'הלונה פארק · יום כיף',
      'הספארי · תצוגת הפינגווינים',
      'דואר ישראל · הסניף השכונתי',
    ],
  },
  complete: {
    title: 'כל הכבוד!',
    text: 'מצאת את כל הפיקסלים',
    playAgain: 'לשחק שוב',
  },
};

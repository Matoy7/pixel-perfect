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
    /** Bottom instruction per level index (only levels listed here show one). */
    hints: ['לחץ על הפיקסל השחור בתמונה', 'טיפ: נסו לעשות זום על אזורים חשודים'] as (string | undefined)[],
    /** Location line on the level identification card, by play position (index). */
    places: [
      'AM:PM · המכולת השכונתית',
      'המשרד · צוות הפיתוח',
      'הספארי · תצוגת הפינגווינים',
      'דואר ישראל · הסניף השכונתי',
      'רחוב יפה · אתר הבנייה',
      'הלונה פארק · יום כיף',
      'נתב״ג · נמל התעופה בן גוריון',
    ],
  },
  complete: {
    title: 'כל הכבוד!',
    text: 'מצאת את כל הפיקסלים',
    playAgain: 'לשחק שוב',
  },
};

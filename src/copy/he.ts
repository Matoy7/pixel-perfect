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
    successTitle: 'מצוין! מצאת את הפיקסל',
    successText: 'ככה משחקים בכל שלב.',
    continue: 'המשך לשלב 1',
  },
  level: {
    label: (n: number) => `שלב ${n}`,
    hint: (n: number) => `שלב ${n} · מצא את הפיקסל השחור`,
    successTitle: 'מצאת!',
    successText: (n: number) => `שלב ${n} הושלם.`,
    next: (n: number) => `המשך לשלב ${n}`,
    finish: 'המשך',
  },
};

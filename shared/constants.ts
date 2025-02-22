export const CURRICULA = ["ICSE", "CBSE", "Karnataka State Board"] as const;
export const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export const GRADES = ["8", "9", "10", "11", "12"] as const;
export const SUBJECTS = ["Mathematics", "Physics", "Chemistry"] as const;

export type Curriculum = typeof CURRICULA[number];
export type Difficulty = typeof DIFFICULTIES[number];
export type Grade = typeof GRADES[number];
export type Subject = typeof SUBJECTS[number];

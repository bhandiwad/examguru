export const CURRICULA = ["ICSE", "CBSE", "Karnataka State Board", "JEE (Main)", "JEE (Advanced)", "NEET", "KVPY", "BITSAT"] as const;
export const DIFFICULTIES = ["Beginner", "Foundation", "Easy", "Medium", "Advanced", "Hard", "Expert", "Olympiad"] as const;
export const GRADES = ["8", "9", "10", "11", "12", "Competitive"] as const;
export const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "History & Civics",
  "Geography",
  "English Literature",
  "English Language",
  "Economics",
  "Computer Science"
] as const;

export type Curriculum = typeof CURRICULA[number];
export type Difficulty = typeof DIFFICULTIES[number];
export type Grade = typeof GRADES[number];
export type Subject = typeof SUBJECTS[number];
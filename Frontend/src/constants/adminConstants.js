export const subjects = [
  "Administration",
  "Education",
  "Health",
  "Agriculture",
  "Engineering",
  "Finance",
  "IT",
  
];

export const provinces = [
  "Koshi Province",
  "Madhesh Province",
  "Bagmati Province",
  "Gandaki Province",
  "Lumbini Province",
  "Karnali Province",
  "Sudurpashchim Province",
];

export const levels = [
  "Section Officer",
  "Nayab Subba",
  "Kharidar",
  "Officer",
  "Assistant",
];

export const noticeTypes = [
  "Vacancy",
  "Exam",
  "Result",
  "Admission",
  "Information",
  "Other",
];

export const initialQuizForm = {
  category: "General Knowledge",
  difficulty: "Medium",
  subject: "General Knowledge",
  province: "Bagmati Province",
  examDate: "",
  text: "",
  A: "",
  B: "",
  C: "",
  D: "",
  correct: "A",
  explanation: "",
};

export const initialMCQForm = {
  subject: "General Knowledge",
  province: "Bagmati Province",
  examDate: "",
};

export const initialPastQuestionForm = {
  title: "",
  subject: "General Knowledge",
  province: "Bagmati Province",
  examDate: "",
  level: "Section Officer",
  year: "",
  description: "",
};

export const initialNoticeForm = {
  title: "",
  description: "",
  sector: "Administration",
  notice_type: "Vacancy",
  organization: "",
  published_date: "",
  deadline: "",
  status: "Open",
};

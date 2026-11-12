/** Category display names. Mirrors backend/app/domain/taxonomy.py (the source of truth). */
export const CATEGORY_LABEL: Record<string, string> = {
  course: "Course",
  workshop: "Workshop",
  bootcamp_program: "Bootcamp / Program",
  volunteering: "Volunteering",
  experience: "Experience",
  competition: "Competition",
  event: "Event",
  scholarship: "Scholarship",
};

/** Short plural names for navigation and filters, where the full taxonomy label is too long. */
export const CATEGORY_SHORT: Record<string, string> = {
  course: "Courses",
  workshop: "Workshops",
  bootcamp_program: "Bootcamps",
  volunteering: "Volunteering",
  experience: "Experience",
  competition: "Competitions",
  event: "Events",
  scholarship: "Scholarships",
};

export const CATEGORY_ORDER = Object.keys(CATEGORY_LABEL);

/** Subtype display names. Mirrors backend/app/domain/taxonomy.py. */
export const SUBTYPE_LABEL: Record<string, string> = {
  online_course: "Online course",
  mooc: "MOOC",
  certification_prep: "Certification prep",
  in_person_course: "In-person course",
  hands_on: "Hands-on",
  webinar: "Webinar",
  masterclass: "Masterclass",
  bootcamp: "Bootcamp",
  fellowship: "Fellowship",
  training_program: "Training program",
  mentorship: "Mentorship",
  accelerator: "Accelerator",
  summer_school: "Summer / winter school",
  event_volunteer: "Event volunteer",
  community: "Community",
  open_source: "Open source",
  teaching_mentoring: "Teaching / mentoring",
  internship: "Internship",
  job: "Job",
  club_group: "Club / group",
  ctf: "CTF",
  hackathon: "Hackathon",
  programming_contest: "Programming contest",
  ai_competition: "AI / ML",
  robotics: "Robotics",
  other: "Other",
  conference: "Conference",
  meetup: "Meetup",
  exhibition: "Exhibition",
  forum: "Forum / summit",
  career_fair: "Career fair",
  undergraduate: "Undergraduate",
  postgraduate: "Postgraduate",
  exchange: "Exchange",
  research_grant: "Research grant",
  travel_grant: "Travel grant",
  certification_voucher: "Certification voucher",
};

export type Project = {
  id: string;
  causeAreas: string[];
  collaborationFormats: string[];
  languages: string[];
  problemFocus: string[];
  outcomeGoals: string[];
  resourcesNeeded: string[];
  activities: string[];
  links: string[];
  createdBy: string;   // organization email
  createdAt: string;
};

const KEY = "vidzel_projects";

export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

export function saveProject(project: Omit<Project, "id" | "createdAt">) {
  const all = getProjects();
  const newProject: Project = {
    ...project,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify([newProject, ...all]));
  return newProject;
}

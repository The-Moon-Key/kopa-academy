import { create } from 'zustand';
import type { Profile, Project, Layer, SkillDomain, Competency } from '../types';

interface AppState {
  profile: Profile | null;
  projects: Project[];
  layers: Layer[];
  domains: SkillDomain[];
  competencies: Competency[];
  sidebarOpen: boolean;
  setProfile: (profile: Profile | null) => void;
  setProjects: (projects: Project[]) => void;
  setLayers: (layers: Layer[]) => void;
  setDomains: (domains: SkillDomain[]) => void;
  setCompetencies: (competencies: Competency[]) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  projects: [],
  layers: [],
  domains: [],
  competencies: [],
  sidebarOpen: true,
  setProfile: (profile) => set({ profile }),
  setProjects: (projects) => set({ projects }),
  setLayers: (layers) => set({ layers }),
  setDomains: (domains) => set({ domains }),
  setCompetencies: (competencies) => set({ competencies }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));

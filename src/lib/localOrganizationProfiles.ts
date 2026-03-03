export type OrganizationProfile = {
  organization_name: string;
  logo_url: string;
  website: string;

  // location split
  country: string;
  city: string;

  mission: string;
  focus_areas: string[];

  founded_year: string;
  team_size: string;

  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_role: string;

  managed_volunteers: boolean | null;
  hosted_students: boolean | null;
  has_coordinator: boolean | null;

  social_linkedin: string;
  social_instagram: string;
  social_facebook: string;

  main_programs: string;
  impact_metrics: string;
  regions_served: string;
  success_story: string;

  collaboration_preference: string;
  preferred_languages: string;
  time_zone: string;
  availability_notes: string;

  support_needed: string;
  resources_available: string;
  tools_used: string;
  partnerships: string;

  updated_at: string;
};
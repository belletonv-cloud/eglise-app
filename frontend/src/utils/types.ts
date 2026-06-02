export interface Song {
  id: number;
  title: string;
  author?: string;
  ccli_number?: string;
  copyright?: string;
  themes?: string;
  notes?: string;
  arrangement_count?: number;
  primary_key?: string;
  last_used?: string;
  last_edited?: string;
  arrangements?: Arrangement[];
  created_at?: string;
}

export interface Arrangement {
  id: number;
  song_id: number;
  name: string;
  key?: string;
  tempo?: number;
  chord_chart?: string;
  created_at?: string;
  media?: Attachment[];
}

export interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  membership_type?: string;
  role?: string;
  baptism_date?: string;
  notes?: string;
  teams?: Team[];
  last_scheduled_plan?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  service_type?: string;
  member_count?: number;
  members?: Member[];
  created_at?: string;
}

export interface Plan {
  id: number;
  service_type_id?: number;
  date: string;
  time?: string;
  theme?: string;
  notes?: string;
  status?: string;
  items?: PlanItem[];
  created_at?: string;
}

export interface PlanItem {
  id: number;
  plan_id: number;
  type: string;
  title: string;
  description?: string;
  position?: number;
  length_minutes?: number;
  arrangement_id?: number;
  transposed_key?: string | null;
  created_at?: string;
}

export interface ServiceType {
  id: number;
  name: string;
  recurrence?: string;
  created_at?: string;
}

export interface ScheduledPerson {
  id: number;
  plan_id: number;
  member_id: number;
  team_id?: number;
  position?: string;
  status?: string;
  first_name?: string;
  last_name?: string;
}

export interface Attendance {
  id: number;
  plan_id: number;
  member_id: number;
  check_in_time?: string;
  status?: string;
  notes?: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
}

export interface HouseGroup {
  id: number;
  name: string;
  description?: string;
  leader_id?: number;
  meeting_day?: string;
  meeting_time?: string;
  location?: string;
  members?: GroupMember[];
  created_at?: string;
}

export interface GroupMember {
  id: number;
  group_id: number;
  member_id: number;
  role?: string;
  first_name?: string;
  last_name?: string;
  join_date?: string;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  variables?: string;
  created_at?: string;
}

export interface EmailLog {
  id: number;
  template_id?: number;
  subject: string;
  body: string;
  recipient_email: string;
  recipient_member_id?: number;
  status: string;
  error_message?: string;
  sent_at?: string;
}

export interface VolunteerPreferences {
  id?: number;
  member_id: number;
  unavailable_dates: string;
  max_services_per_month: number;
  notes?: string;
}

export interface PlanTemplate {
  id: number;
  name: string;
  description?: string;
  service_type_id?: number;
  item_count?: number;
  items?: PlanTemplateItem[];
  created_at?: string;
}

export interface PlanTemplateItem {
  id: number;
  plan_template_id: number;
  type: string;
  title: string;
  description?: string;
  position?: number;
  length_minutes?: number;
  arrangement_id?: number;
  transposed_key?: string;
}

export interface Attachment {
  id: number;
  entity_type: string;
  entity_id: number;
  filename: string;
  file_url: string;
  file_type?: string;
  created_at?: string;
}

export interface Poll {
  id: number;
  question: string;
  max_votes?: number;
  created_by?: number;
  created_at?: string;
  options?: PollOption[];
  user_votes?: number[];
}

export interface PollOption {
  id: number;
  poll_id: number;
  label: string;
  vote_count?: number;
}

export interface Announcement {
  id: number;
  type: string;
  content: string;
  plan_id?: number;
  created_by?: number;
  created_at?: string;
}

export interface Webhook {
  id: number;
  url: string;
  events: string[];
  label?: string;
  secret?: string;
  active?: boolean;
  created_at?: string;
}

export interface WebhookLog {
  id: number;
  webhook_id: number;
  event: string;
  status: string;
  response?: string;
  created_at?: string;
}

export interface Message {
  id: number;
  subject?: string;
  content: string;
  sender_id?: number;
  sender_name?: string;
  created_at?: string;
  recipients?: MessageRecipient[];
}

export interface MessageRecipient {
  id: number;
  message_id: number;
  member_id: number;
  read_at?: string;
}

export interface ChecklistItem {
  id: number;
  plan_id?: number;
  checklist_template_id?: number;
  position: string;
  label: string;
  done?: boolean;
  member_id?: number;
  sort_order?: number;
}

export interface ChurchEvent {
  id: number;
  title: string;
  description?: string;
  location?: string;
  start_date: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  color?: string;
  repeat_period?: string;
  image_url?: string;
  rsvp_enabled?: boolean;
  source?: string;
  status?: string;
  link?: string;
  ticket_url?: string;
  emoji?: string;
  exceptions?: ChurchEventException[];
}

export interface ChurchEventException {
  id: number;
  event_id: number;
  exception_date: string;
  type: "cancelled" | "moved" | "periodicity_changed";
  new_date?: string;
  new_repeat_period?: string;
  reason?: string;
}

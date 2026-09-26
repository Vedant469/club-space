export type Role = 'member' | 'admin'

export interface Profile {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Club {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface ClubMember {
  id: string
  club_id: string
  user_id: string
  role: Role
  created_at: string
}

export type TaskStatus = 'pending' | 'completed'
export type Priority = 'low' | 'medium' | 'high'

export interface PersonalTask {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority | null
  due_date: string | null
  created_at: string
  updated_at: string
}

export type ClubTaskStatus = 'todo' | 'in_progress' | 'completed'

export interface ClubTask {
  id: string
  club_id: string
  created_by: string
  assigned_to: string | null
  event_id: string | null
  title: string
  description: string | null
  status: ClubTaskStatus
  priority: Priority | null
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface ClubEvent {
  id: string
  club_id: string
  name: string
  description: string | null
  event_date: string | null
  cover_photo: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface EventPhoto {
  id: string
  event_id: string
  uploaded_by: string
  storage_path: string
  caption: string | null
  created_at: string
}

export interface ClubDocument {
  id: string
  club_id: string
  uploaded_by: string
  file_name: string
  storage_path: string
  mime_type: string | null
  file_size: number | null
  event_id: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  club_id: string
  sender_id: string
  message: string | null
  reply_to: string | null
  attachment_path: string | null
  attachment_type: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}
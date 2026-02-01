
export interface User {
  id: string
  personaId?: string
  name: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  role: 'student' | 'teacher' | 'parent' | 'admin'
  grade?: string
  class?: string
}

export interface Announcement {
  id: string
  title: string
  date: string
  image?: string
  category: 'general' | 'event' | 'info' | 'menu' | 'activity'
  excerpt?: string
  content?: string
  isNew?: boolean
}

export interface Task {
  id: string
  subject: string
  subjectColor?: string
  title: string
  dueDate: string
  status: 'pending' | 'submitted' | 'graded' | 'overdue'
  type: 'homework' | 'exam' | 'project'
  grade?: number
  maxGrade?: number
}

export interface ScheduleItem {
  id: string
  subject: string
  subjectColor?: string
  startTime: string
  endTime: string
  room?: string
  teacher?: string
  isBreak?: boolean
  isCurrent?: boolean
}

export interface Subject {
  id: string
  name: string
  shortName: string
  color: string
  teacher: string
  room?: string
  grade?: number
  attendance?: number
  nextClass?: string
}

export interface Grade {
  id: string
  subjectId: string
  subject: string
  title: string
  date: string
  grade: number
  maxGrade: number
  type: 'exam' | 'homework' | 'project' | 'participation'
  trimester: number
  comments?: string
}

export interface TrimesterGrade {
  trimester: number
  average: number
  grades: Grade[]
}

export interface Message {
  id: string
  from: User
  subject: string
  preview: string
  date: string
  isRead: boolean
  isStarred?: boolean
  attachments?: number
}

export interface QuickAccessItem {
  id: string
  label: string
  icon: string
  href: string
  badge?: number
  description?: string
}

export interface Birthday {
  id: string
  name: string
  date: string
  avatar?: string
  class?: string
}

export interface Meeting {
  id: string
  title: string
  date: string
  time: string
  with: string
  type: 'interview' | 'meeting' | 'tutoring'
  location?: string
  isConfirmed?: boolean
}

export interface Incident {
  id: string
  date: string
  type: 'positive' | 'negative' | 'neutral'
  description: string
  teacher: string
  resolved?: boolean
}

export interface Circular {
  id: string
  title: string
  date: string
  isNew: boolean
  category: string
  downloadUrl?: string
}

export interface Survey {
  id: string
  title: string
  deadline: string
  isCompleted: boolean
  isRequired: boolean
}

export interface Mark {
  id: string
  name: string
  shortName: string
  grade?: number
  maxGrade: number
  isPassed: boolean
  gradeType: string
  color?: string
}

export interface Evaluation {
  classId: string
  className: string
  shortName: string
  teacher?: string
  marks: Mark[]
  average?: number
}

export const DEMO_TOKEN = 'demo-mode-token'

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('token') === DEMO_TOKEN
}

export function setDemoMode(): void {
  const keysToRemove = Object.keys(localStorage).filter(key => 
    key.startsWith('birthdays-cache') || 
    key.startsWith('tasks-cache') ||
    key.startsWith('unread-marks') ||
    key.startsWith('counters-cache')
  )
  keysToRemove.forEach(key => localStorage.removeItem(key))
  sessionStorage.clear()
  localStorage.setItem('token', DEMO_TOKEN)
  localStorage.setItem('appwrite_email', 'demo@estudiantech.demo')
  localStorage.setItem('appwrite_user_id', 'demo-user')
}

export const demoUserInfo = {
  name: 'Demo Student',
  avatar: '/demo-avatar.png'
}

export const demoContext = {
  cdnUrl: 'https://cdn.demo.educamos.com',
  schoolName: 'Demo School',
  logo: '/icon.svg',
  variant: 'demo',
  roleBase: 'Student',
  rolColegioId: 'demo-colegio-id',
  calendarId: 'demo-calendar-id',
  culture: 'es-ES',
  personaId: 'demo-persona-id',
  personaLanguageId: 'es'
}

export const demoCourse = {
  schoolPhase: '11th Grade',
  schoolYear: '2025-2026'
}

export const demoCounters = [
  { TipoElementoResumen: 1, ContadorElementos: 3 },
  { TipoElementoResumen: 2, ContadorElementos: 5 },
  { TipoElementoResumen: 3, ContadorElementos: 2 },
  { TipoElementoResumen: 6, ContadorElementos: 1 }
]

function formatDate(date: Date): string {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
}

export const demoTasks = [
  {
    id: 'demo-task-1',
    title: 'Math exercises - Unit 5',
    subject: 'Mathematics II',
    dueDate: formatDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
    status: 'pending'
  },
  {
    id: 'demo-task-2',
    title: 'Essay: Don Quixote',
    subject: 'Language and Literature',
    dueDate: formatDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)),
    status: 'submitted'
  },
  {
    id: 'demo-task-3',
    title: 'Physics project',
    subject: 'Physics',
    dueDate: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    status: 'graded'
  }
]

export const demoAnnouncements = [
  {
    id: 'demo-ann-1',
    title: 'Parent meeting',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    read: false,
    preview: 'All parents are invited to the quarterly meeting...'
  },
  {
    id: 'demo-ann-2',
    title: 'Museum trip',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    preview: 'Next Friday we will visit the Science Museum...'
  }
]

export const demoBirthdays = [
  { id: 'demo-bday-1', name: 'Maria Garcia', date: 'Today', class: '11th Grade A', avatar: null },
  { id: 'demo-bday-2', name: 'Carlos Lopez', date: 'Upcoming', class: '11th Grade B', avatar: null }
]

export const demoClasses = [
  { id: 'demo-math', nombre: 'Mathematics I', reducido: 'MAT', nivelEducativoEtapaId: 1, nivelEducativoColegioId: 'nec-1' },
  { id: 'demo-lengua', nombre: 'Spanish Language and Literature I', reducido: 'LAN', nivelEducativoEtapaId: 1, nivelEducativoColegioId: 'nec-1' },
  { id: 'demo-fisica', nombre: 'Physics and Chemistry', reducido: 'PHY', nivelEducativoEtapaId: 1, nivelEducativoColegioId: 'nec-1' },
  { id: 'demo-filosofia', nombre: 'Philosophy', reducido: 'PHI', nivelEducativoEtapaId: 1, nivelEducativoColegioId: 'nec-1' },
  { id: 'demo-ingles', nombre: 'Foreign Language I: English', reducido: 'ENG', nivelEducativoEtapaId: 1, nivelEducativoColegioId: 'nec-1' }
]

export const demoEvals = [
  { EvaluacionId: 'eval-1', ClaseId: 'demo-math', NivelEducativoColegioId: 'nec-1', TipoEvaluacionId: 1, EvaluacionGrupoId: null, EvaluacionNombre: 'Term 1', Seleccionada: true, EvaluacionActiva: true }
]

export const demoEvaluations = [
  {
    classId: 'demo-math',
    className: 'Mathematics I',
    shortName: 'MAT',
    teacher: 'Prof. Martinez',
    marks: [
      { id: 'demo-math', name: 'Mathematics I', shortName: 'MAT', grade: 8.5, maxGrade: 10, isPassed: true, gradeType: 'numeric', color: '#22c55e' }
    ],
    average: 8.5
  },
  {
    classId: 'demo-lengua',
    className: 'Spanish Language and Literature I',
    shortName: 'LAN',
    teacher: 'Prof. Garcia',
    marks: [
      { id: 'demo-lengua', name: 'Spanish Language and Literature I', shortName: 'LAN', grade: 7.0, maxGrade: 10, isPassed: true, gradeType: 'numeric', color: '#f59e0b' }
    ],
    average: 7.0
  },
  {
    classId: 'demo-fisica',
    className: 'Physics and Chemistry',
    shortName: 'PHY',
    teacher: 'Prof. Rodriguez',
    marks: [
      { id: 'demo-fisica', name: 'Physics and Chemistry', shortName: 'PHY', grade: 9.0, maxGrade: 10, isPassed: true, gradeType: 'numeric', color: '#ec4899' }
    ],
    average: 9.0
  },
  {
    classId: 'demo-filosofia',
    className: 'Philosophy',
    shortName: 'PHI',
    teacher: 'Prof. Lopez',
    marks: [
      { id: 'demo-filosofia', name: 'Philosophy', shortName: 'PHI', grade: 6.5, maxGrade: 10, isPassed: true, gradeType: 'numeric', color: '#06b6d4' }
    ],
    average: 6.5
  },
  {
    classId: 'demo-ingles',
    className: 'Foreign Language I: English',
    shortName: 'ENG',
    teacher: 'Prof. Williams',
    marks: [
      { id: 'demo-ingles', name: 'Foreign Language I: English', shortName: 'ENG', grade: 8.0, maxGrade: 10, isPassed: true, gradeType: 'numeric', color: '#f59e0b' }
    ],
    average: 8.0
  }
]

export const demoIncidencias = [
  {
    id: 'demo-inc-1',
    fecha: formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    hora: '09:30',
    materia: 'Mathematics I',
    clase: '11th Grade A',
    tipo: 'Observations',
    comentarioMateria: 'Forgot the textbook',
    comentarioDia: '',
    justificacion: '',
    fechaCompleta: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }
]

export const demoCirculares = [
  {
    id: 'demo-circ-1',
    circularId: 'circ-001',
    fecha: formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    asunto: 'School year start information',
    isBold: false,
    fechaCompleta: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'demo-circ-2',
    circularId: 'circ-002',
    fecha: formatDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)),
    asunto: 'Coexistence guidelines',
    isBold: false,
    fechaCompleta: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  }
]

function generateDemoWeekCalendar() {
  const subjects = [
    { name: 'Mathematics I', short: 'MAT' },
    { name: 'Spanish Language and Literature I', short: 'LAN' },
    { name: 'Physics and Chemistry', short: 'PHY' },
    { name: 'Philosophy', short: 'PHI' },
    { name: 'Foreign Language I: English', short: 'ENG' },
    { name: 'Physical Education', short: 'PE' }
  ]
  
  const hours = [
    { start: '08:30', end: '09:25' },
    { start: '09:25', end: '10:20' },
    { start: '10:20', end: '10:40', isBreak: true },
    { start: '10:40', end: '11:35' },
    { start: '11:35', end: '12:30' },
    { start: '12:30', end: '13:25' },
    { start: '13:25', end: '14:20' }
  ]
  
  const events: Array<{
    id: string
    subjectName: string
    subjectShortName: string
    className: string
    classShortName: string
    dayOfWeek: number
    startTime: string
    endTime: string
    startDate: string
    endDate: string
    isBreak: boolean
    hasExam: boolean
    hasTasks: boolean
    hasIncidences: boolean
    sessionId: string
  }> = []
  
  for (let day = 1; day <= 5; day++) {
    hours.forEach((hour, idx) => {
      if (hour.isBreak) {
        events.push({
          id: `break-${day}-${idx}`,
          subjectName: 'Break',
          subjectShortName: 'BRK',
          className: '',
          classShortName: '',
          dayOfWeek: day,
          startTime: hour.start,
          endTime: hour.end,
          startDate: '',
          endDate: '',
          isBreak: true,
          hasExam: false,
          hasTasks: false,
          hasIncidences: false,
          sessionId: `session-break-${day}-${idx}`
        })
      } else {
        const subjectIdx = (idx + day) % subjects.length
        const subject = subjects[subjectIdx]
        events.push({
          id: `class-${day}-${idx}`,
          subjectName: subject.name,
          subjectShortName: subject.short,
          className: '11th Grade A',
          classShortName: '11A',
          dayOfWeek: day,
          startTime: hour.start,
          endTime: hour.end,
          startDate: '',
          endDate: '',
          isBreak: false,
          hasExam: day === 3 && idx === 0,
          hasTasks: day === 2 && idx === 1,
          hasIncidences: false,
          sessionId: `session-${day}-${idx}`
        })
      }
    })
  }
  
  const today = new Date()
  const monday = new Date(today)
  const dayOfWeek = today.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(today.getDate() + diff)
  
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: friday.toISOString().split('T')[0],
    events
  }
}

export const demoWeekCalendar = generateDemoWeekCalendar()

export function getDemoResponse(url: string): { data: unknown } | null {
  if (url.includes('/api/context')) {
    return { data: demoContext }
  }
  if (url.includes('/api/course')) {
    return { data: demoCourse }
  }
  if (url.includes('/api/user-info')) {
    return { data: demoUserInfo }
  }
  if (url.includes('/api/counters')) {
    return { data: demoCounters }
  }
  if (url.includes('/api/gettasks')) {
    return { data: demoTasks }
  }
  if (url.includes('/api/announcements')) {
    return { data: demoAnnouncements }
  }
  if (url.includes('/api/birthdays')) {
    return { data: demoBirthdays }
  }
  if (url.includes('/api/getclasses')) {
    return { data: demoClasses }
  }
  if (url.includes('/api/getevals')) {
    return { data: demoEvals }
  }
  if (url.includes('/api/getevaluation')) {
    return { data: demoEvaluations }
  }
  if (url.includes('/api/getincidencias')) {
    return { data: demoIncidencias }
  }
  if (url.includes('/api/getcirculares')) {
    return { data: demoCirculares }
  }
  if (url.includes('/api/timetable') || url.includes('/api/week-calendar')) {
    return { data: demoWeekCalendar }
  }
  if (url.includes('/api/task-detail')) {
    return { data: demoTasks[0] }
  }
  if (url.includes('/api/unread-marks')) {
    return { data: { count: 2 } }
  }
  if (url.includes('/api/getsubjectgrades')) {
    const subjectIdMatch = url.match(/subjectId=([^&]+)/)
    const subjectId = subjectIdMatch ? subjectIdMatch[1] : 'demo-math'
    const evaluation = demoEvaluations.find(e => e.classId === subjectId) || demoEvaluations[0]
    return { 
      data: {
        id: evaluation.classId,
        name: evaluation.className,
        shortName: evaluation.shortName,
        mainGrade: evaluation.average,
        isPassed: (evaluation.average ?? 0) >= 5,
        grades: evaluation.marks.map(m => ({
          id: m.id,
          name: m.name,
          shortName: m.shortName,
          grade: m.grade,
          isPassed: m.isPassed,
          color: m.color
        }))
      }
    }
  }
  return { data: {} }
}

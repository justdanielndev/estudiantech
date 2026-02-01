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
  name: 'Estudiante Demo',
  avatar: '/demo-avatar.png'
}

export const demoContext = {
  cdnUrl: 'https://cdn.demo.educamos.com',
  schoolName: 'Colegio Demo',
  logo: '/icon.svg',
  variant: 'demo',
  roleBase: 'Alumno',
  rolColegioId: 'demo-colegio-id',
  calendarId: 'demo-calendar-id',
  culture: 'es-ES',
  personaId: 'demo-persona-id',
  personaLanguageId: 'es'
}

export const demoCourse = {
  schoolPhase: '2º Bachillerato',
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
    title: 'Ejercicios de Matemáticas - Tema 5',
    subject: 'Matemáticas II',
    dueDate: formatDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
    status: 'pending'
  },
  {
    id: 'demo-task-2',
    title: 'Ensayo: Don Quijote',
    subject: 'Lengua y Literatura',
    dueDate: formatDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)),
    status: 'submitted'
  },
  {
    id: 'demo-task-3',
    title: 'Proyecto de Física',
    subject: 'Física',
    dueDate: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    status: 'graded'
  }
]

export const demoAnnouncements = [
  {
    id: 'demo-ann-1',
    title: 'Reunión de padres',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    read: false,
    preview: 'Se convoca a todos los padres a la reunión trimestral...'
  },
  {
    id: 'demo-ann-2',
    title: 'Excursión al museo',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    preview: 'El próximo viernes realizaremos una excursión al Museo de Ciencias...'
  }
]

export const demoBirthdays = [
  { id: 'demo-bday-1', name: 'María García', date: 'Hoy', class: '1º Bachillerato A', avatar: null },
  { id: 'demo-bday-2', name: 'Carlos López', date: 'Próximamente', class: '1º Bachillerato B', avatar: null }
]

export const demoClasses = [
  { id: 'demo-math', nombre: 'Matemáticas I', reducido: 'MAT', nivelEducativoEtapaId: 1, nivelEducativoColegioId: 'nec-1' },
  { id: 'demo-lengua', nombre: 'Lengua Castellana y Literatura I', reducido: 'LEN', nivelEducativoEtapaId: 1, nivelEducativoColegioId: 'nec-1' },
  { id: 'demo-fisica', nombre: 'Física y Química', reducido: 'FYQ', nivelEducativoEtapaId: 1, nivelEducativoColegioId: 'nec-1' },
  { id: 'demo-filosofia', nombre: 'Filosofía', reducido: 'FIL', nivelEducativoEtapaId: 1, nivelEducativoColegioId: 'nec-1' },
  { id: 'demo-ingles', nombre: 'Lengua Extranjera I: Inglés', reducido: 'ING', nivelEducativoEtapaId: 1, nivelEducativoColegioId: 'nec-1' }
]

export const demoEvals = [
  { EvaluacionId: 'eval-1', ClaseId: 'demo-math', NivelEducativoColegioId: 'nec-1', TipoEvaluacionId: 1, EvaluacionGrupoId: null, EvaluacionNombre: '1ª Evaluación', Seleccionada: true, EvaluacionActiva: true }
]

export const demoEvaluations = [
  {
    classId: 'demo-math',
    className: 'Matemáticas I',
    shortName: 'MAT',
    teacher: 'Prof. Martínez',
    marks: [
      { id: 'demo-math', name: 'Matemáticas I', shortName: 'MAT', grade: 8.5, maxGrade: 10, isPassed: true, gradeType: 'numeric', color: '#22c55e' }
    ],
    average: 8.5
  },
  {
    classId: 'demo-lengua',
    className: 'Lengua Castellana y Literatura I',
    shortName: 'LEN',
    teacher: 'Prof. García',
    marks: [
      { id: 'demo-lengua', name: 'Lengua Castellana y Literatura I', shortName: 'LEN', grade: 7.0, maxGrade: 10, isPassed: true, gradeType: 'numeric', color: '#f59e0b' }
    ],
    average: 7.0
  },
  {
    classId: 'demo-fisica',
    className: 'Física y Química',
    shortName: 'FYQ',
    teacher: 'Prof. Rodríguez',
    marks: [
      { id: 'demo-fisica', name: 'Física y Química', shortName: 'FYQ', grade: 9.0, maxGrade: 10, isPassed: true, gradeType: 'numeric', color: '#ec4899' }
    ],
    average: 9.0
  },
  {
    classId: 'demo-filosofia',
    className: 'Filosofía',
    shortName: 'FIL',
    teacher: 'Prof. López',
    marks: [
      { id: 'demo-filosofia', name: 'Filosofía', shortName: 'FIL', grade: 6.5, maxGrade: 10, isPassed: true, gradeType: 'numeric', color: '#06b6d4' }
    ],
    average: 6.5
  },
  {
    classId: 'demo-ingles',
    className: 'Lengua Extranjera I: Inglés',
    shortName: 'ING',
    teacher: 'Prof. Williams',
    marks: [
      { id: 'demo-ingles', name: 'Lengua Extranjera I: Inglés', shortName: 'ING', grade: 8.0, maxGrade: 10, isPassed: true, gradeType: 'numeric', color: '#f59e0b' }
    ],
    average: 8.0
  }
]

export const demoIncidencias = [
  {
    id: 'demo-inc-1',
    fecha: formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    hora: '09:30',
    materia: 'Matemáticas I',
    clase: '2º Bachillerato A',
    tipo: 'Observaciones',
    comentarioMateria: 'Olvidó el libro de texto',
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
    asunto: 'Información inicio de curso',
    isBold: false,
    fechaCompleta: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'demo-circ-2',
    circularId: 'circ-002',
    fecha: formatDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)),
    asunto: 'Normas de convivencia',
    isBold: false,
    fechaCompleta: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  }
]

function generateDemoTimetable() {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
  const subjects = ['Matemáticas II', 'Lengua', 'Física', 'Historia', 'Inglés', 'Ed. Física', 'Filosofía']
  const hours = ['08:30', '09:30', '10:30', '11:30', '12:30', '13:30']
  
  const timetable: Record<string, { hour: string; subject: string }[]> = {}
  
  days.forEach(day => {
    timetable[day] = hours.map((hour, idx) => ({
      hour,
      subject: subjects[(idx + days.indexOf(day)) % subjects.length]
    }))
  })
  
  return timetable
}

export const demoTimetable = generateDemoTimetable()

export const demoWeekCalendar = {
  events: [
    {
      id: 'demo-event-1',
      title: 'Examen Matemáticas',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'exam'
    }
  ],
  tasks: demoTasks
}

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

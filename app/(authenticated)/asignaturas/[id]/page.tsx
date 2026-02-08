"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ChevronLeft, Loader } from "lucide-react"
import Link from "next/link"
import { useAppContextState } from "@/hooks/useAppContext"
import { authFetch } from "@/lib/api"
import { useI18n } from "@/hooks/useI18n"

interface SubjectGrade {
  id: string
  name: string
  shortName: string
  grade?: number
  isPassed: boolean
  color?: string
}

interface SubjectDetail {
  id: string
  name: string
  shortName: string
  mainGrade?: number
  isPassed: boolean
  grades: SubjectGrade[]
}

interface StudentClass {
  id: string
  nombre: string
  nivelEducativoColegioId: string
  nivelEducativoEtapaId: number
}

interface EvalPeriod {
  EvaluacionId: string
  ClaseId: string
  NivelEducativoColegioId: string
  TipoEvaluacionId: number
  EvaluacionGrupoId: string | null
  EvaluacionNombre: string
  Seleccionada: boolean
  EvaluacionActiva: boolean
}

const getGradeColor = (grade?: number, isPassed?: boolean) => {
  if (grade === undefined) return "bg-muted text-muted-foreground"
  if (isPassed === false) return "bg-red-100 text-red-900"
  if (grade >= 9) return "bg-green-100 text-green-900"
  if (grade >= 7) return "bg-blue-100 text-blue-900"
  if (grade >= 5) return "bg-yellow-100 text-yellow-900"
  return "bg-red-100 text-red-900"
}

export default function SubjectDetailPage() {
  const { t } = useI18n()
  const params = useParams()
  const subjectId = params.id as string
  const { context, isReady } = useAppContextState()
  
  const [subject, setSubject] = useState<SubjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isReady || !context?.personaId) return

    async function fetchSubjectDetail() {
      try {
        setLoading(true)
        const alumnoId = context!.personaId

        const classesResponse = await authFetch(`/api/getclasses?alumnoId=${alumnoId}`)
        if (!classesResponse.ok) throw new Error('Failed to fetch classes')
        const classesData = await classesResponse.json()
        const classes: StudentClass[] = classesData.data || []
        if (classes.length === 0) throw new Error('No classes found')
        const studentClass = classes[0]

        const evalsParams = new URLSearchParams({
          claseId: studentClass.id,
          nivelEducativoColegioId: studentClass.nivelEducativoColegioId,
          nivelEducativoEtapa: String(studentClass.nivelEducativoEtapaId)
        })
        const evalsResponse = await authFetch(`/api/getevals?${evalsParams}`)
        if (!evalsResponse.ok) throw new Error('Failed to fetch evaluations')
        const evalsData = await evalsResponse.json()
        const evalPeriods: EvalPeriod[] = evalsData.data || []
        if (evalPeriods.length === 0) throw new Error('No evaluation periods')
        const activeEval = evalPeriods.find(e => e.Seleccionada || e.EvaluacionActiva) || evalPeriods[0]

        const gradesParams = new URLSearchParams({
          subjectId,
          nivelEducativoColegioId: activeEval.NivelEducativoColegioId,
          claseId: activeEval.ClaseId,
          alumnoId,
          evaluacionId: activeEval.EvaluacionId,
          evaluacionGrupoId: activeEval.EvaluacionGrupoId || '',
          tipoEvaluacionId: String(activeEval.TipoEvaluacionId)
        })
        
        const response = await authFetch(`/api/getsubjectgrades?${gradesParams}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError(t('pages.subjectNotFound'))
          } else {
            throw new Error(`API error: ${response.status}`)
          }
          return
        }

        const data = await response.json()
        setSubject(data.data)
        setError(null)
      } catch (err) {
        console.error('Error fetching subject detail:', err)
        setError(err instanceof Error ? err.message : t('pages.loadingSubject'))
      } finally {
        setLoading(false)
      }
    }

    fetchSubjectDetail()
  }, [subjectId, isReady, context?.personaId, t])

  if (loading) {
    return (
      <main className="flex-1 px-6 py-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('pages.loadingSubject')}</p>
        </div>
      </main>
    )
  }

  if (error || !subject) {
    return (
      <main className="flex-1 px-6 py-4">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/asignaturas" className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{error || t('pages.subjectNotFound')}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 px-6 py-4 overflow-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/asignaturas" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{subject.name}</h1>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 mb-6">
        <p className="text-xs text-muted-foreground mb-1">{t('pages.overallGrade')}</p>
        <p className={`text-3xl font-semibold ${subject.mainGrade !== undefined ? (subject.isPassed ? 'text-foreground' : 'text-red-600') : 'text-muted-foreground'}`}>
          {subject.mainGrade?.toFixed(1) ?? "-"}
        </p>
      </div>

      {subject.grades.length > 0 ? (
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <div className="bg-secondary px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">{t('pages.grades')}</h2>
          </div>
          <div className="divide-y divide-border">
            {subject.grades.map((grade) => (
              <div key={grade.id} className="px-4 py-3 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {grade.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{grade.shortName}</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-semibold ${getGradeColor(grade.grade, grade.isPassed)} min-w-[60px] justify-center`}>
                  {grade.grade?.toFixed(1) ?? "-"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border border-border rounded-lg">
          <p className="text-muted-foreground">{t('pages.noGradesAvailable')}</p>
        </div>
      )}
    </main>
  )
}

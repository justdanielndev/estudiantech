'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { User, ChevronRight, Loader } from "lucide-react"
import type { Evaluation } from "@/lib/types"
import { useAppContextState } from "@/hooks/useAppContext"
import { authFetch } from "@/lib/api"
import { useI18n } from "@/hooks/useI18n"

const subjectColors: Record<string, string> = {
  'Matemáticas I': '#22c55e',
  'Mathematics I': '#22c55e',
  'Física y Química': '#ec4899',
  'Physics and Chemistry': '#ec4899',
  'Lengua Castellana y Literatura I': '#f59e0b',
  'Spanish Language and Literature I': '#f59e0b',
  'Valenciano: Lengua y Literatura': '#0d9488',
  'Lengua Extranjera I: Inglés': '#f59e0b',
  'Foreign Language I: English': '#f59e0b',
  'Dibujo Técnico I': '#6366f1',
  'Programación, Redes y Sistemas Informáticos I': '#8b5cf6',
  'Filosofía': '#06b6d4',
  'Philosophy': '#06b6d4',
  'Educación física': '#ec4899',
  'Physical Education': '#ec4899',
  'Religión': '#94a3b8',
}

interface StudentClass {
  id: string
  nombre: string
  reducido: string
  nivelEducativoEtapaId: number
  nivelEducativoColegioId: string
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

export default function SubjectsPage() {
  const { t } = useI18n()
  const { context, isReady } = useAppContextState()
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isReady || !context?.personaId) return

    async function fetchEvaluations() {
      try {
        setLoading(true)
        const alumnoId = context!.personaId

        const classesResponse = await authFetch(`/api/getclasses?alumnoId=${alumnoId}`)
        if (!classesResponse.ok) {
          throw new Error(`Failed to fetch classes: ${classesResponse.status}`)
        }
        const classesData = await classesResponse.json()
        const classes: StudentClass[] = classesData.data || []
        
        if (classes.length === 0) {
          throw new Error('No classes found for student')
        }
        
        const studentClass = classes[0]

        const evalsParams = new URLSearchParams({
          claseId: studentClass.id,
          nivelEducativoColegioId: studentClass.nivelEducativoColegioId,
          nivelEducativoEtapa: String(studentClass.nivelEducativoEtapaId)
        })
        const evalsResponse = await authFetch(`/api/getevals?${evalsParams}`)
        if (!evalsResponse.ok) {
          throw new Error(`Failed to fetch evaluation periods: ${evalsResponse.status}`)
        }
        const evalsData = await evalsResponse.json()
        const evalPeriods: EvalPeriod[] = evalsData.data || []
        
        if (evalPeriods.length === 0) {
          throw new Error('No evaluation periods available')
        }

        const activeEval = evalPeriods.find(e => e.Seleccionada || e.EvaluacionActiva) || evalPeriods[0]

        const params = new URLSearchParams({
          nivelEducativoColegioId: activeEval.NivelEducativoColegioId,
          claseId: activeEval.ClaseId,
          alumnoId: alumnoId,
          evaluacionId: activeEval.EvaluacionId,
          evaluacionGrupoId: activeEval.EvaluacionGrupoId || '',
          tipoEvaluacionId: String(activeEval.TipoEvaluacionId)
        })
        
        const response = await authFetch(`/api/getevaluation?${params}`)
        
        if (!response.ok) {
          console.warn(`API returned status ${response.status}. Using mock data.`)
          throw new Error(`API error: ${response.status}`)
        }
        
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          setEvaluations(data.data)
          setError(null)
        } else {
          setError(t('pages.noGradesPeriod'))
        }
      } catch (err) {
        console.error('Error fetching evaluations:', err)
        setError(err instanceof Error ? err.message : t('pages.noGradesPeriod'))
      } finally {
        setLoading(false)
      }
    }

    fetchEvaluations()
  }, [isReady, context?.personaId])

  const subjects = evaluations.flatMap(evaluation => 
    evaluation.marks.map(mark => ({
      id: mark.id,
      name: evaluation.className,
      shortName: evaluation.shortName,
      color: mark.color || subjectColors[evaluation.className] || '#64748b',
      teacher: undefined,
      grade: mark.grade,
      classId: evaluation.classId,
    }))
  )

  if (loading) {
    return (
      <div className="px-6 py-4 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('pages.loadingSubjects')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-4">
      <h1 className="text-sm font-semibold text-foreground mb-4">
        {t('pages.subjectsTitle')}
      </h1>
      {error && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-3 py-2 bg-secondary text-xs font-medium text-muted-foreground border-b border-border">
          <span>{t('pages.subject')}</span>
          <span className="w-20 text-center">{t('pages.grade')}</span>
          <span className="w-8" />
        </div>
        <div className="divide-y divide-border">
          {subjects.length > 0 ? (
            subjects.map((subject) => (
              <Link 
                key={subject.id} 
                href={`/asignaturas/${subject.id}`}
                className="grid grid-cols-[1fr_auto_auto] gap-4 px-3 py-3 hover:bg-accent/50 transition-colors items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                    style={{ backgroundColor: subject.color }}
                  >
                    {subject.shortName}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {subject.name}
                    </h3>
                    {subject.teacher && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span className="truncate">{subject.teacher}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-20 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold bg-tag-blue text-foreground">
                    {subject.grade?.toFixed(1) || "-"}
                  </span>
                </div>
                <div className="w-8 flex justify-center">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))
          ) : (
            <div className="px-3 py-8 text-center text-muted-foreground text-sm">
              {t('pages.noSubjects')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

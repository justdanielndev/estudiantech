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
  EvaluacionReducido: string
  Seleccionada: boolean
  EvaluacionActiva: boolean
}

export default function SubjectsPage() {
  const { t } = useI18n()
  const { context, isReady } = useAppContextState()
  const [evalPeriods, setEvalPeriods] = useState<EvalPeriod[]>([])
  const [selectedEval, setSelectedEval] = useState<EvalPeriod | null>(null)
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loadingPeriods, setLoadingPeriods] = useState(true)
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isReady || !context?.personaId) return

    async function fetchPeriods() {
      try {
        setLoadingPeriods(true)
        const alumnoId = context!.personaId

        const classesRes = await authFetch(`/api/getclasses?alumnoId=${alumnoId}`)
        if (!classesRes.ok) throw new Error(`Failed to fetch classes: ${classesRes.status}`)
        const classesData = await classesRes.json()
        const classes: StudentClass[] = classesData.data || []
        if (classes.length === 0) throw new Error('No classes found for student')
        const studentClass = classes[0]

        const evalsParams = new URLSearchParams({
          claseId: studentClass.id,
          nivelEducativoColegioId: studentClass.nivelEducativoColegioId,
          nivelEducativoEtapa: String(studentClass.nivelEducativoEtapaId)
        })
        const evalsRes = await authFetch(`/api/getevals?${evalsParams}`)
        if (!evalsRes.ok) throw new Error(`Failed to fetch evaluation periods: ${evalsRes.status}`)
        const evalsData = await evalsRes.json()
        const periods: EvalPeriod[] = evalsData.data || []
        if (periods.length === 0) throw new Error('No evaluation periods available')

        setEvalPeriods(periods)
        setSelectedEval(periods.find(e => e.Seleccionada || e.EvaluacionActiva) || periods[0])
      } catch (err) {
        setError(err instanceof Error ? err.message : t('pages.noGradesPeriod'))
      } finally {
        setLoadingPeriods(false)
      }
    }

    fetchPeriods()
  }, [isReady, context?.personaId])

  useEffect(() => {
    if (!selectedEval || !context?.personaId) return

    async function fetchGrades() {
      try {
        setLoadingGrades(true)
        const params = new URLSearchParams({
          nivelEducativoColegioId: selectedEval!.NivelEducativoColegioId,
          claseId: selectedEval!.ClaseId,
          alumnoId: context!.personaId,
          evaluacionId: selectedEval!.EvaluacionId,
          evaluacionGrupoId: selectedEval!.EvaluacionGrupoId || '',
          tipoEvaluacionId: String(selectedEval!.TipoEvaluacionId)
        })

        const res = await authFetch(`/api/getevaluation?${params}`)
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json()
        setEvaluations(data.data || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('pages.noGradesPeriod'))
      } finally {
        setLoadingGrades(false)
      }
    }

    fetchGrades()
  }, [selectedEval, context?.personaId])

  const subjects = evaluations.flatMap(evaluation =>
    evaluation.marks.map(mark => ({
      id: mark.id,
      name: evaluation.className,
      shortName: evaluation.shortName,
      color: mark.color || subjectColors[evaluation.className] || '#64748b',
      grade: mark.grade,
      classId: evaluation.classId,
    }))
  )

  if (loadingPeriods) {
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-sm font-semibold text-foreground">{t('pages.subjectsTitle')}</h1>
      </div>

      {evalPeriods.length > 1 && (
        <div className="flex gap-1 mb-4 flex-wrap">
          {evalPeriods.map((period) => (
            <button
              key={period.EvaluacionId}
              onClick={() => setSelectedEval(period)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedEval?.EvaluacionId === period.EvaluacionId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {period.EvaluacionReducido || period.EvaluacionNombre}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-3 py-2 bg-secondary text-xs font-medium text-muted-foreground border-b border-border">
          <span>{t('pages.subject')}</span>
          <span className="w-20 text-center">{t('pages.grade')}</span>
          <span className="w-8" />
        </div>
        <div className="divide-y divide-border">
          {loadingGrades ? (
            <div className="px-3 py-8 flex justify-center">
              <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : subjects.length > 0 ? (
            subjects.map((subject) => (
              <Link
                key={subject.id}
                href={`/asignaturas/${subject.id}?eval=${selectedEval?.EvaluacionId}`}
                className="grid grid-cols-[1fr_auto_auto] gap-4 px-3 py-3 hover:bg-accent/50 transition-colors items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                    style={{ backgroundColor: subject.color }}
                  >
                    {subject.shortName}
                  </div>
                  <h3 className="text-sm font-medium text-foreground truncate">{subject.name}</h3>
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

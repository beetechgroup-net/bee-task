import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import type { Task } from "../../types";
import {
  calculateCapacityInMs,
  calculateDurationInInterval,
} from "../../utils/capacityUtils";
import { Clock, Calendar as CalendarIcon, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface WorkedTimeReportProps {
  tasks?: Task[];
  dailyWorkHours?: number;
  userId?: string;
}

const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const WorkedTimeReport: React.FC<WorkedTimeReportProps> = ({
  tasks: propTasks,
  dailyWorkHours: propDailyWorkHours,
  userId: propUserId,
}) => {
  const { user: authUser } = useAuth();
  const { tasks: storeTasks } = useStore();

  const targetUserId = propUserId || authUser?.uid;
  const tasks = propTasks || storeTasks;

  const [periodType, setPeriodType] = useState<"mensal" | "anual">("mensal");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [fetchedHours, setFetchedHours] = useState<number | null>(null);

  // Fetch dailyWorkHours if not passed as prop
  useEffect(() => {
    const fetchHours = async () => {
      if (propDailyWorkHours !== undefined || !targetUserId) return;
      try {
        const userRef = doc(db, "users", targetUserId);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.dailyWorkHours !== undefined) {
            setFetchedHours(data.dailyWorkHours);
          }
        }
      } catch (err) {
        console.error("Error fetching dailyWorkHours in WorkedTimeReport:", err);
      }
    };
    fetchHours();
  }, [targetUserId, propDailyWorkHours]);

  const dailyHours = propDailyWorkHours ?? fetchedHours ?? 0;

  // Generate Year options around the current year (4 years back, current year, 4 years forward)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 9 }, (_, i) => currentYear - 4 + i);
  }, []);

  // Compute intervals and metrics
  const metrics = useMemo(() => {
    let start: Date;
    let end: Date;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    if (periodType === "mensal") {
      start = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0);
      end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
    } else {
      // Anual: Apenas dos meses anteriores ao mês corrente
      start = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
      if (selectedYear < currentYear) {
        end = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
      } else if (selectedYear === currentYear) {
        if (currentMonth === 0) {
          end = new Date(selectedYear, 0, 1, 0, 0, 0, 0); // No completed months yet
        } else {
          end = new Date(selectedYear, currentMonth, 0, 23, 59, 59, 999); // last day of currentMonth - 1
        }
      } else {
        end = new Date(selectedYear, 0, 1, 0, 0, 0, 0); // Future year: empty range
      }
    }

    const allLogs = tasks.flatMap((t) => t.logs);
    const workedMs = calculateDurationInInterval(allLogs, start.getTime(), end.getTime());
    const expectedMs = dailyHours > 0 ? calculateCapacityInMs(start, end, dailyHours) : 0;
    const balanceMs = workedMs - expectedMs;

    return {
      workedMs,
      expectedMs,
      balanceMs,
      hasHoursConfigured: dailyHours > 0,
      currentYear,
      currentMonth,
    };
  }, [tasks, periodType, selectedMonth, selectedYear, dailyHours]);

  const formatHoursAndMinutes = (ms: number) => {
    const absMs = Math.abs(ms);
    const totalMinutes = Math.floor(absMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  };

  const getProgressPercentage = () => {
    if (metrics.expectedMs <= 0) return 0;
    return Math.min((metrics.workedMs / metrics.expectedMs) * 100, 100);
  };

  const getAnnualPeriodDescription = () => {
    const { currentYear, currentMonth } = metrics;
    if (selectedYear < currentYear) {
      return `O cálculo considera o ano completo de ${selectedYear} (Janeiro a Dezembro).`;
    } else if (selectedYear === currentYear) {
      if (currentMonth === 0) {
        return `O cálculo de ${selectedYear} considera apenas os meses anteriores ao corrente (nenhum mês concluído ainda).`;
      }
      return `O cálculo de ${selectedYear} considera apenas os meses concluídos anteriores ao corrente (Janeiro a ${MONTHS_PT[currentMonth - 1]} de ${selectedYear}).`;
    } else {
      return `O ano selecionado (${selectedYear}) está no futuro. O cálculo considera apenas meses concluídos anteriores ao mês corrente (saldo zerado).`;
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-secondary)",
        padding: "1.75rem",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-bg-tertiary)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Header controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Clock size={22} className="text-accent" style={{ color: "var(--color-accent)" }} />
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0 }}>
            Relatório de Tempo Trabalhado
          </h2>
        </div>

        {/* Filter controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Segmented Period Selector */}
          <div
            style={{
              display: "flex",
              backgroundColor: "var(--color-bg-primary)",
              padding: "0.25rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-bg-tertiary)",
            }}
          >
            {(["mensal", "anual"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setPeriodType(type)}
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor:
                    periodType === type ? "var(--color-bg-tertiary)" : "transparent",
                  color:
                    periodType === type
                      ? "var(--color-text-primary)"
                      : "var(--color-text-secondary)",
                  fontSize: "0.85rem",
                  fontWeight: periodType === type ? 600 : 500,
                  transition: "all 0.2s",
                }}
              >
                {type === "mensal" ? "Mensal" : "Anual"}
              </button>
            ))}
          </div>

          {/* Month selector (shown only for mensal) */}
          {periodType === "mensal" && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-bg-primary)",
                border: "1px solid var(--color-bg-tertiary)",
                color: "var(--color-text-primary)",
                fontSize: "0.85rem",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {MONTHS_PT.map((m, index) => (
                <option key={index} value={index}>
                  {m}
                </option>
              ))}
            </select>
          )}

          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-bg-primary)",
              border: "1px solid var(--color-bg-tertiary)",
              color: "var(--color-text-primary)",
              fontSize: "0.85rem",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Info notice about annual calculation */}
      {periodType === "anual" && (
        <div
          style={{
            fontSize: "0.85rem",
            color: "var(--color-text-secondary)",
            backgroundColor: "var(--color-bg-primary)",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-bg-tertiary)",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertTriangle size={16} style={{ color: "var(--color-text-accent)", flexShrink: 0 }} />
          <span>{getAnnualPeriodDescription()}</span>
        </div>
      )}

      {/* Main Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Card 1: Tempo Trabalhado */}
        <div
          style={{
            backgroundColor: "var(--color-bg-primary)",
            padding: "1.25rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-bg-tertiary)",
          }}
        >
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Clock size={16} />
            TEMPO TRABALHADO
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {formatHoursAndMinutes(metrics.workedMs)}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-secondary)",
              marginTop: "0.25rem",
            }}
          >
            Total de logs registrados no período
          </div>
        </div>

        {/* Card 2: Horas Esperadas */}
        <div
          style={{
            backgroundColor: "var(--color-bg-primary)",
            padding: "1.25rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-bg-tertiary)",
          }}
        >
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <CalendarIcon size={16} />
            HORAS ESPERADAS
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {metrics.hasHoursConfigured
              ? formatHoursAndMinutes(metrics.expectedMs)
              : "N/A"}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-secondary)",
              marginTop: "0.25rem",
            }}
          >
            {metrics.hasHoursConfigured
              ? `Baseado em ${dailyHours}h diárias (dias úteis)`
              : "Defina sua jornada diária no perfil"}
          </div>
        </div>

        {/* Card 3: Saldo de Horas */}
        <div
          style={{
            backgroundColor: "var(--color-bg-primary)",
            padding: "1.25rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-bg-tertiary)",
          }}
        >
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {metrics.hasHoursConfigured && metrics.balanceMs >= 0 ? (
              <TrendingUp size={16} style={{ color: "var(--color-success)" }} />
            ) : metrics.hasHoursConfigured ? (
              <TrendingDown size={16} style={{ color: "var(--color-danger)" }} />
            ) : (
              <AlertTriangle size={16} />
            )}
            SALDO DE HORAS
          </div>
          {metrics.hasHoursConfigured ? (
            <>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color:
                    metrics.balanceMs >= 0
                      ? "var(--color-success)"
                      : "var(--color-danger)",
                }}
              >
                {metrics.balanceMs >= 0 ? "+" : "-"}
                {formatHoursAndMinutes(metrics.balanceMs)}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color:
                    metrics.balanceMs >= 0
                      ? "var(--color-success)"
                      : "var(--color-danger)",
                  fontWeight: 600,
                  marginTop: "0.25rem",
                }}
              >
                {metrics.balanceMs >= 0
                  ? "Sobrando no período selecionado"
                  : "Devendo no período selecionado"}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                N/A
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-secondary)",
                  marginTop: "0.25rem",
                }}
              >
                Configure as horas diárias no perfil
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar & Warning section */}
      {metrics.hasHoursConfigured ? (
        <div style={{ marginTop: "1rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.85rem",
              color: "var(--color-text-secondary)",
              marginBottom: "0.5rem",
              fontWeight: 500,
            }}
          >
            <span>Progresso da carga horária esperada</span>
            <span
              style={{
                color:
                  metrics.workedMs >= metrics.expectedMs
                    ? "var(--color-success)"
                    : "var(--color-accent)",
                fontWeight: 600,
              }}
            >
              {((metrics.workedMs / metrics.expectedMs) * 100).toFixed(1)}%
            </span>
          </div>
          <div
            style={{
              height: "10px",
              backgroundColor: "var(--color-bg-tertiary)",
              borderRadius: "5px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${getProgressPercentage()}%`,
                backgroundColor:
                  metrics.workedMs >= metrics.expectedMs
                    ? "var(--color-success)"
                    : "var(--color-accent)",
                borderRadius: "5px",
                transition: "width 0.5s ease-out",
              }}
            />
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            border: "1px dashed var(--color-danger)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
            marginTop: "1.5rem",
            color: "var(--color-text-primary)",
          }}
        >
          <AlertTriangle size={20} style={{ color: "var(--color-danger)", flexShrink: 0 }} />
          <span style={{ fontSize: "0.875rem" }}>
            Você ainda não configurou sua jornada diária. Acesse a aba de{" "}
            <strong>Configurações do Perfil</strong> (no canto inferior esquerdo) para definir suas
            horas diárias de trabalho e calcular o saldo esperado.
          </span>
        </div>
      )}
    </div>
  );
};

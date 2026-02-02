import React, { useState, useEffect } from "react";
import { useStore } from "../../context/StoreContext";
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  BrainCircuit,
  Settings,
} from "lucide-react";
import { useLocalStorage } from "../../hooks/useLocalStorage";

export const PomodoroTimer: React.FC = () => {
  const { tasks, toggleTaskLog } = useStore();

  // Timer settings (in minutes) - Persisted
  const [workMinutes, setWorkMinutes] = useLocalStorage("pomodoro-work", 25);
  const [breakMinutes, setBreakMinutes] = useLocalStorage("pomodoro-break", 5);

  const [timeLeft, setTimeLeft] = useState(workMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Persistence Key
  const STORAGE_KEY = "pomodoro-state-v2";

  // Load state on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // parsed: { mode, isActive, endTimestamp, pausedTimeLeft }

        setMode(parsed.mode || "work");

        if (parsed.isActive && parsed.endTimestamp) {
          const remaining = Math.ceil(
            (parsed.endTimestamp - Date.now()) / 1000,
          );
          if (remaining > 0) {
            setTimeLeft(remaining);
            setIsActive(true);
          } else {
            // Timer finished while user was away
            setIsActive(false);
            handleTimerComplete(parsed.mode || "work", true);
          }
        } else if (parsed.pausedTimeLeft) {
          setTimeLeft(parsed.pausedTimeLeft);
          setIsActive(false);
        } else {
          // Fallback if no specific state
          setTimeLeft(
            (parsed.mode === "work" ? workMinutes : breakMinutes) * 60,
          );
        }
      } catch (e) {
        console.error("Failed to parse pomodoro state", e);
      }
    }
  }, []); // Run once on mount

  // Helper to save state
  const saveState = (
    newIsActive: boolean,
    newMode: "work" | "break",
    time: number,
  ) => {
    const state = {
      isActive: newIsActive,
      mode: newMode,
      endTimestamp: newIsActive ? Date.now() + time * 1000 : null,
      pausedTimeLeft: newIsActive ? null : time,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  // Update timer when settings change (only if not active to avoid jumping)
  useEffect(() => {
    if (!isActive) {
      // Only if we haven't started/paused a specific session that is different from default
      // But simply: if specific pausedTime is set, we might keep it.
      // For simplicity, if user changes settings while paused, we usually reset or keep?
      // Current behavior: update.
      // Let's check if we have a "paused" state that is mid-way.
      const savedState = localStorage.getItem(STORAGE_KEY);
      let isMidWay = false;
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (
          !parsed.isActive &&
          parsed.pausedTimeLeft &&
          parsed.pausedTimeLeft !==
            (parsed.mode === "work" ? workMinutes : breakMinutes) * 60
        ) {
          isMidWay = true;
        }
      }

      if (!isMidWay) {
        setTimeLeft(mode === "work" ? workMinutes * 60 : breakMinutes * 60);
      }
    }
  }, [workMinutes, breakMinutes, mode, isActive]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeLeft > 0) {
      // Calculate target time once when effect starts/resumes
      // Retrieve the authoritative endTimestamp from storage first to align with it
      const savedState = localStorage.getItem(STORAGE_KEY);
      let targetTime = Date.now() + timeLeft * 1000;

      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed.isActive && parsed.endTimestamp) {
            targetTime = parsed.endTimestamp;
          }
        } catch (e) {}
      }

      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.ceil((targetTime - now) / 1000);

        if (diff <= 0) {
          // Timer might be finished
          setTimeLeft(0);
        } else {
          setTimeLeft(diff);
        }
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Only finish if it was active
      setIsActive(false);
      handleTimerComplete(mode);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, mode]); // Important: Removed timeLeft from dependency to avoid loop reset

  const handleTimerComplete = (
    currentMode: "work" | "break",
    fromBackground = false,
  ) => {
    const nextMode = currentMode === "work" ? "break" : "work";
    setMode(nextMode);

    // We update state for the NEW mode
    const nextDuration =
      nextMode === "work" ? workMinutes * 60 : breakMinutes * 60;
    setTimeLeft(nextDuration);
    saveState(false, nextMode, nextDuration); // Save as paused at start of next round

    // Logic for auto-pausing active tasks when Break starts
    if (nextMode === "break" && !fromBackground) {
      pauseActiveTask();
    }

    if (Notification.permission === "granted" && !fromBackground) {
      new Notification("BeeTask Pomodoro", {
        body: nextMode === "break" ? "Time for a break!" : "Back to work!",
      });
    } else if (fromBackground) {
      // Did it finish while away? Maybe show a distinct notification or just reset.
      console.log("Timer finished in background.");
    }
  };

  const pauseActiveTask = () => {
    const activeTask = tasks.find((t) => t.logs.some((l) => !l.endTime));
    if (activeTask) {
      toggleTaskLog(activeTask.id);
      console.log(`Auto-paused task: ${activeTask.title}`);
    }
  };

  const toggleTimer = () => {
    if (!isActive && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const newIsActive = !isActive;
    setIsActive(newIsActive);
    saveState(newIsActive, mode, timeLeft);
  };

  const resetTimer = () => {
    setIsActive(false);
    const resetTime = mode === "work" ? workMinutes * 60 : breakMinutes * 60;
    setTimeLeft(resetTime);
    saveState(false, mode, resetTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        marginTop: "auto", // Push to bottom if container has height
        backgroundColor: "var(--color-bg-primary)",
        borderRadius: "var(--radius-md)",
        padding: "1rem",
        border: "1px solid var(--color-bg-tertiary)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {mode === "work" ? (
            <BrainCircuit size={18} color="var(--color-accent)" />
          ) : (
            <Coffee size={18} color="var(--color-success)" />
          )}
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color:
                mode === "work"
                  ? "var(--color-accent)"
                  : "var(--color-success)",
            }}
          >
            {mode === "work" ? "Focus" : "Break"}
          </span>
        </div>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          style={{
            color: "var(--color-text-secondary)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Settings size={16} />
        </button>
      </div>

      {isSettingsOpen ? (
        <div style={{ marginBottom: "1rem", animation: "fadeIn 0.2s" }}>
          <div
            style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: "0.75rem",
                  display: "block",
                  color: "var(--color-text-secondary)",
                }}
              >
                Focus (m)
              </label>
              <input
                type="number"
                value={workMinutes}
                onChange={(e) => setWorkMinutes(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "0.25rem",
                  borderRadius: "4px",
                  border: "1px solid var(--color-bg-tertiary)",
                  background: "var(--color-bg-secondary)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: "0.75rem",
                  display: "block",
                  color: "var(--color-text-secondary)",
                }}
              >
                Break (m)
              </label>
              <input
                type="number"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "0.25rem",
                  borderRadius: "4px",
                  border: "1px solid var(--color-bg-tertiary)",
                  background: "var(--color-bg-secondary)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            style={{
              width: "100%",
              padding: "0.25rem",
              background: "var(--color-bg-tertiary)",
              border: "none",
              borderRadius: "4px",
              color: "var(--color-text-primary)",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      ) : (
        <div
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            textAlign: "center",
            marginBottom: "1rem",
            color: "var(--color-text-primary)",
          }}
        >
          {formatTime(timeLeft)}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={toggleTimer}
          style={{
            flex: 1,
            backgroundColor: isActive
              ? "var(--color-bg-tertiary)"
              : "var(--color-accent)",
            color: isActive ? "var(--color-text-primary)" : "#fff",
            border: "none",
            borderRadius: "var(--radius-sm)",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {isActive ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          onClick={resetTimer}
          style={{
            width: "36px",
            backgroundColor: "transparent",
            border: "1px solid var(--color-bg-tertiary)",
            borderRadius: "var(--radius-sm)",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--color-text-secondary)",
          }}
          title="Reset"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};

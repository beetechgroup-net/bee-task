import React, { useEffect, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Users,
  CheckCircle2,
  Quote,
  PartyPopper,
} from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useChatContext } from "../../context/ChatContext";

type TickerType = "finance" | "weather" | "stat" | "social" | "utility";

interface TickerItem {
  id: string;
  type: TickerType;
  label: string;
  value: string;
  change?: number; // percentage (finance)
  subtext?: string;
  icon?: React.ReactNode;
  color?: string;
}

interface WeatherData {
  tempMin: number;
  tempMax: number;
  currentTemp: number;
  weatherCode: number;
}

// Duplicated for simplicity - in a real app, move to a shared utils/constants file
import { HOLIDAYS_2026 } from "../../utils/holidays";

export const Ticker: React.FC = () => {
  const { tasks } = useStore();
  const { onlineUsersCount } = useChatContext();
  const [items, setItems] = useState<TickerItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // ... (keeping tasks logic)

  // Calculate tasks completed today & Update "Tasks Done" item
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasksDoneToday = tasks.filter((t) => {
      if (t.status !== "done") return false;
      const finishEvent = t.history?.find((h) => h.action === "finish");
      if (finishEvent) {
        return finishEvent.timestamp >= today.getTime();
      }
      const lastLog = t.logs[t.logs.length - 1];
      if (lastLog && lastLog.endTime) {
        return lastLog.endTime >= today.getTime();
      }
      return false;
    }).length;

    setItems((prev) => {
      const others = prev.filter((i) => i.id !== "tasks-done");
      const taskItem: TickerItem = {
        id: "tasks-done",
        type: "stat",
        label: "Tarefas Hoje",
        value: `${tasksDoneToday}`,
        icon: <CheckCircle2 size={14} />,
        color: "#10b981", // emerald-500
      };
      return [taskItem, ...others];
    });
  }, [tasks]);

  useEffect(() => {
    // --- Mock Generators ---
    const mockIndices = () => {
      const baseIbov = 127000;
      const baseSp500 = 5000;

      const randomFluctuation = (base: number) => {
        const change = (Math.random() - 0.5) * (base * 0.02); // +/- 1%
        return {
          value: base + change,
          change: (change / base) * 100,
        };
      };

      const ibov = randomFluctuation(baseIbov);
      const sp500 = randomFluctuation(baseSp500);

      return [
        {
          id: "ibov",
          type: "finance",
          label: "IBOV",
          value: `${ibov.value.toFixed(0)}`,
          change: ibov.change,
        },
        {
          id: "sp500",
          type: "finance",
          label: "S&P 500",
          value: `${sp500.value.toFixed(2)}`,
          change: sp500.change,
        },
      ] as TickerItem[];
    };

    // --- API Fetchers ---
    const fetchFinance = async () => {
      try {
        const res = await fetch(
          "https://economia.awesomeapi.com.br/last/BTC-BRL,USD-BRL,EUR-BRL",
        );
        const data = await res.json();
        const btc = data.BTCBRL;
        const usd = data.USDBRL;
        const eur = data.EURBRL;

        const financeItems: TickerItem[] = [];

        if (btc) {
          financeItems.push({
            id: "btc",
            type: "finance",
            label: "BTC",
            value: `R$ ${parseFloat(btc.bid).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}`,
            change: parseFloat(btc.pctChange),
          });
        }
        if (usd) {
          financeItems.push({
            id: "usd",
            type: "finance",
            label: "USD",
            value: `R$ ${parseFloat(usd.bid).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}`,
            change: parseFloat(usd.pctChange),
          });
        }
        if (eur) {
          financeItems.push({
            id: "eur",
            type: "finance",
            label: "EUR",
            value: `R$ ${parseFloat(eur.bid).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}`,
            change: parseFloat(eur.pctChange),
          });
        }
        return financeItems;
      } catch (e) {
        console.error("Failed to fetch finance", e);
        return [];
      }
    };

    const fetchWeather = async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-20.4428&longitude=-54.6464&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo",
        );
        const data = await res.json();

        if (data && data.current && data.daily) {
          setWeather({
            currentTemp: data.current.temperature_2m,
            weatherCode: data.current.weather_code,
            tempMin: data.daily.temperature_2m_min[0],
            tempMax: data.daily.temperature_2m_max[0],
          });
        }
      } catch (e) {
        console.error("Failed to fetch weather", e);
      }
    };

    // --- Social & Utility Mocks ---
    const getSocialAndUtility = () => {
      const items: TickerItem[] = [];

      // Online Users (Real)
      items.push({
        id: "online-users",
        type: "stat",
        label: "Online",
        value: `${onlineUsersCount}`,
        icon: <Users size={14} />,
        color: "#60a5fa",
      });

      // Holiday Logic
      const today = new Date();
      // Simple string comparison for 2026 specific demo, assuming current year is relevant or we look ahead
      // We parse the holiday strings.
      const nextHoliday = HOLIDAYS_2026.map((h) => ({
        ...h,
        dateObj: new Date(h.date + "T12:00:00"),
      })) // Add time to avoid timezone offset issues on simple date parsing
        .find((h) => h.dateObj >= today);

      if (nextHoliday) {
        // Format date: "17/02"
        const dateStr = nextHoliday.date
          .split("-")
          .slice(1)
          .reverse()
          .join("/");
        items.push({
          id: "holiday",
          type: "social",
          label: "Próximo Feriado",
          value: `${nextHoliday.name} (${dateStr})`,
          icon: <PartyPopper size={14} />,
          color: "#f472b6",
        });
      }

      // Quote
      const quotes = [
        "Foco no processo.",
        "Um bug de cada vez.",
        "Code is poetry.",
        "Café compilado com sucesso.",
        "Ship it!",
      ];
      items.push({
        id: "quote",
        type: "utility",
        label: "Quote",
        value: quotes[Math.floor(Math.random() * quotes.length)],
        icon: <Quote size={14} />,
        color: "#a78bfa",
      });

      return items;
    };

    const updateAllData = async () => {
      const finance = await fetchFinance();
      const indices = mockIndices();
      const socUtil = getSocialAndUtility();

      // Merge: keeping task statistics (managed by other effect)
      setItems((prev) => {
        const tasksItem = prev.find((i) => i.id === "tasks-done");

        // Order: Tasks -> Finance -> Stats -> Social -> Utility -> Indices
        const newList = [
          ...(tasksItem ? [tasksItem] : []),
          ...finance,
          ...indices,
          ...socUtil,
        ];
        return newList;
      });

      fetchWeather();
    };

    updateAllData();
    const interval = setInterval(updateAllData, 60000 * 5); // Update every 5 mins
    return () => clearInterval(interval);
  }, [onlineUsersCount]);

  const getWeatherIcon = (code: number) => {
    if (code <= 1) return <Sun size={16} color="#fbbf24" />;
    if (code <= 3) return <Cloud size={16} color="#9ca3af" />;
    if (code <= 67) return <CloudRain size={16} color="#60a5fa" />;
    if (code <= 77) return <CloudSnow size={16} color="#e5e7eb" />;
    if (code <= 99) return <CloudLightning size={16} color="#f59e0b" />;
    return <Sun size={16} />;
  };

  const renderItem = (item: TickerItem) => {
    return (
      <div
        key={item.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0 1rem",
          borderRight: "1px solid #374151",
          height: "100%",
        }}
      >
        {/* Icon / Label */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          {item.icon && <span style={{ color: item.color }}>{item.icon}</span>}
          <span
            style={{
              fontWeight: 600,
              color: "#9ca3af",
              fontSize: "0.75rem",
              textTransform: "uppercase",
            }}
          >
            {item.label}
          </span>
        </div>

        {/* Value */}
        <span style={{ fontWeight: 600, color: "#f3f4f6" }}>{item.value}</span>

        {/* Change (Finance) */}
        {item.change !== undefined && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: item.change >= 0 ? "#34d399" : "#f87171",
            }}
          >
            {item.change >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              {Math.abs(item.change).toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        backgroundColor: "#111827",
        color: "#fff",
        height: "36px",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        position: "fixed", // Fixed top
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 50,
        borderBottom: "1px solid #374151",
        fontSize: "0.85rem",
        whiteSpace: "nowrap",
      }}
    >
      <style>{`
        @keyframes ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); } 
        }
        .ticker-track {
            display: flex;
            animation: ticker 40s linear infinite; /* Faster speed */
            width: max-content; /* Ensure width is sufficient */
        }
        .ticker-track:hover {
             animation-play-state: paused; 
        }
      `}</style>

      <div className="ticker-track">
        {[0, 1].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            {/* Weather First */}
            {weather && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0 1rem",
                  borderRight: "1px solid #374151",
                  height: "100%",
                }}
              >
                <span style={{ fontWeight: 600, color: "#93c5fd" }}>
                  C. Grande
                </span>
                {getWeatherIcon(weather.weatherCode)}
                <span>{weather.currentTemp}°C</span>
              </div>
            )}

            {items.map(renderItem)}
          </div>
        ))}
      </div>
    </div>
  );
};

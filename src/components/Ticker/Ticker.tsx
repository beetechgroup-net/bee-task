import React, { useEffect, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
} from "lucide-react";

interface TickerItem {
  id: string;
  label: string;
  value: string;
  change: number; // percentage
  icon?: React.ReactNode;
}

interface WeatherData {
  tempMin: number;
  tempMax: number;
  currentTemp: number;
  weatherCode: number;
}

export const Ticker: React.FC = () => {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    // Mock for Indices (as free real-time API is hard)
    // We simulate 'live' updates by fluctuating slightly around base values
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
          label: "IBOV",
          value: `${ibov.value.toFixed(0)} pts`,
          change: ibov.change,
        },
        {
          id: "sp500",
          label: "S&P 500",
          value: `${sp500.value.toFixed(2)}`,
          change: sp500.change,
        },
      ];
    };

    const fetchCrypto = async () => {
      try {
        const res = await fetch(
          "https://economia.awesomeapi.com.br/last/BTC-BRL",
        );
        const data = await res.json();
        const btc = data.USDBRL || data.BTCBRL; // awesomeapi usually returns key based on query pair

        if (btc) {
          return {
            id: "btc",
            label: "Bitcoin (BRL)",
            value: `R$ ${parseFloat(btc.bid).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            change: parseFloat(btc.pctChange),
          };
        }
      } catch (e) {
        console.error("Failed to fetch crypto", e);
      }
      return null;
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

    const updateData = async () => {
      const btcItem = await fetchCrypto();
      const indices = mockIndices();

      const newItems = [...indices];
      if (btcItem) newItems.unshift(btcItem);

      setItems(newItems);
      fetchWeather();
    };

    updateData();
    const interval = setInterval(updateData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (code: number) => {
    // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
    if (code <= 1) return <Sun size={16} color="#fbbf24" />;
    if (code <= 3) return <Cloud size={16} color="#9ca3af" />;
    if (code <= 67) return <CloudRain size={16} color="#60a5fa" />;
    if (code <= 77) return <CloudSnow size={16} color="#e5e7eb" />;
    if (code <= 99) return <CloudLightning size={16} color="#f59e0b" />;
    return <Sun size={16} />;
  };

  return (
    <div
      style={{
        backgroundColor: "#111827", // Dark background forticker
        color: "#fff",
        height: "32px",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        position: "relative",
        borderBottom: "1px solid #374151",
        fontSize: "0.85rem",
        whiteSpace: "nowrap",
      }}
    >
      <style>{`
        @keyframes ticker {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }
        .ticker-content {
            display: inline-flex;
            gap: 3rem;
            animation: ticker 40s linear infinite; // Slow speed
            padding-left: 100vw; // Start off-screen
            min-width: 100%;
        }
        .ticker-content:hover {
            animation-play-state: paused;
        }
      `}</style>

      <div className="ticker-content">
        {/* Weather Item */}
        {weather && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontWeight: 600, color: "#93c5fd" }}>
              Campo Grande
            </span>
            {getWeatherIcon(weather.weatherCode)}
            <span>{weather.currentTemp}°C</span>
            <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>
              (Min {weather.tempMin}° / Max {weather.tempMax}°)
            </span>
          </div>
        )}

        {/* Financial Items */}
        {items.map((item) => (
          <div
            key={item.id}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <span style={{ fontWeight: 600 }}>{item.label}</span>
            <span>{item.value}</span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: item.change >= 0 ? "#34d399" : "#f87171",
              }}
            >
              {item.change >= 0 ? (
                <ArrowUp size={14} />
              ) : (
                <ArrowDown size={14} />
              )}
              <span style={{ fontWeight: 600 }}>
                {Math.abs(item.change).toFixed(2)}%
              </span>
            </div>
          </div>
        ))}

        {/* Duplicate for infinite loop illusion? 
            CSS marquee usually needs duplication or a better animation logic for seamless loop.
            With translateX from 100% to -100%, it restarts.
            For true infinite seamless, usually we animate translateX from 0 to -50% and have doubled content.
            Let's keep simple first: fly through.
        */}
      </div>
    </div>
  );
};

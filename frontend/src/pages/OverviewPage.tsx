import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Country {
  code: string;
  name: string;
}

interface Forecast {
  year: number;
  low_carbon_share_pct: number;
  electricity_generation_twh: number;
}

interface ForecastResponse {
  iso3: string;
  base_year: number;
  forecasts: Forecast[];
}

interface Props {
  goHome: () => void;
  initialCode: string | null;
  initialName: string | null;
}

type MetricView = "energy" | "lowcarbon";

const OverviewPage: React.FC<Props> = ({
  goHome,
  initialCode,
  initialName,
}) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [selectedCode, setSelectedCode] = useState(initialCode || "IND");
  const [selectedName, setSelectedName] = useState<string | null>(
    initialName || null
  );
  const [search, setSearch] = useState(initialName || "");
  const [metricView, setMetricView] = useState<MetricView>("energy");
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const fetchCountries = useCallback(async () => {
    try {
      const res = await axios.get<Country[]>("http://localhost:8000/countries");
      setCountries(res.data);
    } catch (e) {
      console.error("countries failed", e);
    }
  }, []);

  const fetchForecast = useCallback(async (iso3: string) => {
    setLoading(true);
    try {
      const res = await axios.get<ForecastResponse>(
        `http://localhost:8000/forecast/${iso3}?horizon=10`
      );
      setForecast(res.data);
    } catch (e) {
      console.error("forecast failed", e);
      setForecast(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  useEffect(() => {
    fetchForecast(selectedCode);
  }, [fetchForecast, selectedCode]);

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const trigger = () => {
    if (!filtered[0]) return;
    const chosen = filtered[activeIndex] || filtered[0];
    setSelectedCode(chosen.code);
    setSelectedName(chosen.name);
    setSearch(chosen.name);
  };

  const showDropdown = search && filtered.some((c) => c.name !== search);

  const chartData =
    forecast?.forecasts.map((f) => ({
      year: f.year,
      energy: f.electricity_generation_twh,
      lowcarbon: f.low_carbon_share_pct,
    })) || [];

  const displayName =
    selectedName ||
    countries.find((c) => c.code === selectedCode)?.name ||
    selectedCode;

  return (
    <div className="surface">
      <div className="page-header">
        <button className="back-btn" onClick={goHome}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            width={16}
            height={16}
          >
            <path
              d="M19 12H5M11 6l-6 6 6 6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to homepage
        </button>
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#6b7280",
          }}
        >
          Overview
        </span>
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>
        Single‑country forecast
      </h2>
      <p
        style={{
          marginTop: 8,
          fontSize: 13,
          color: "#4b5563",
          maxWidth: 520,
        }}
      >
        Search a country to view its historical electricity generation and
        low‑carbon share, then toggle between Energy and Low‑carbon views of the
        next decade.
      </p>

      {/* search */}
      <div className="search-pill-row">
        <div className="search-pill">
          <span className="search-pill-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="6" strokeWidth="2" />
              <line x1="16" y1="16" x2="21" y2="21" strokeWidth="2" />
            </svg>
          </span>
          <input
            placeholder="Search for a country…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                if (!filtered.length) return;
                setActiveIndex((p) => (p + 1) % filtered.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (!filtered.length) return;
                setActiveIndex((p) =>
                  p === 0 ? filtered.length - 1 : p - 1
                );
              } else if (e.key === "Enter") {
                e.preventDefault();
                trigger();
              }
            }}
          />
          <button className="search-pill-arrow" type="button" onClick={trigger}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              width={16}
              height={16}
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {showDropdown && (
          <div className="suggestion-panel">
            {filtered.length === 0 && (
              <div
                style={{
                  padding: "8px 14px",
                  fontSize: 12,
                  color: "#6b7280",
                }}
              >
                No countries found in dataset.
              </div>
            )}
            {filtered.slice(0, 8).map((c, idx) => (
              <button
                key={c.code}
                className={
                  "suggestion-item" +
                  (idx === activeIndex ? " suggestion-item--active" : "")
                }
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => {
                  setSelectedCode(c.code);
                  setSelectedName(c.name);
                  setSearch(c.name);
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* chart + toggle */}
      <div className="section-card" style={{ marginTop: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
              {displayName}
            </div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              {metricView === "energy"
                ? "Total electricity generation (TWh)"
                : "Low‑carbon electricity share (%)"}
            </div>
          </div>
          <div className="toggle-row">
            <button
              className={`toggle-btn ${
                metricView === "energy" ? "active" : ""
              }`}
              onClick={() => setMetricView("energy")}
            >
              Energy
            </button>
            <button
              className={`toggle-btn ${
                metricView === "lowcarbon" ? "active" : ""
              }`}
              onClick={() => setMetricView("lowcarbon")}
            >
              Low‑carbon
            </button>
          </div>
        </div>

        <div style={{ height: 320 }}>
          {loading ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Loading…
            </div>
          ) : chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                {metricView === "energy" ? (
                  <Line
                    type="monotone"
                    dataKey="energy"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={false}
                  />
                ) : (
                  <Line
                    type="monotone"
                    dataKey="lowcarbon"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
                fontSize: 12,
              }}
            >
              No data yet. Search a country to load forecasts.
            </div>
          )}
        </div>

        {/* forecast table only */}
        {chartData.length > 0 && (
          <div className="table-wrapper" style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 6px 0" }}>
              Forecast table
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Energy (TWh)</th>
                  <th>Low‑carbon %</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row) => (
                  <tr key={row.year}>
                    <td>{row.year}</td>
                    <td>{row.energy.toFixed(1)}</td>
                    <td>{row.lowcarbon.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewPage;
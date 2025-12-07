import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { API_BASE } from "../config";

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
}

type MetricView = "energy" | "lowcarbon";

const ComparePage: React.FC<Props> = ({ goHome }) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [forecastA, setForecastA] = useState<ForecastResponse | null>(null);
  const [forecastB, setForecastB] = useState<ForecastResponse | null>(null);

  const [codeA, setCodeA] = useState("IND");
  const [codeB, setCodeB] = useState("USA");
  const [nameA, setNameA] = useState<string | null>(null);
  const [nameB, setNameB] = useState<string | null>(null);

  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [activeIndexA, setActiveIndexA] = useState(0);
  const [activeIndexB, setActiveIndexB] = useState(0);

  const [metricA, setMetricA] = useState<MetricView>("energy");
  const [metricB, setMetricB] = useState<MetricView>("energy");
  const [loading, setLoading] = useState(false);

  const fetchCountries = useCallback(async () => {
    try {
      const res = await axios.get<Country[]>(`${API_BASE}/countries`);
      setCountries(res.data);
    } catch (e) {
      console.error("countries failed", e);
    }
  }, []);

  const fetchForecast = useCallback(
    async (
      iso3: string,
      setter: React.Dispatch<React.SetStateAction<ForecastResponse | null>>
    ) => {
      setLoading(true);
      try {
        const res = await axios.get<ForecastResponse>(
          `${API_BASE}/forecast/${iso3}?horizon=10`
        );
        setter(res.data);
      } catch (e) {
        console.error("forecast failed", e);
        setter(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  useEffect(() => {
    fetchForecast("IND", setForecastA);
    fetchForecast("USA", setForecastB);
  }, [fetchForecast]);

  const filteredA = countries.filter((c) =>
    c.name.toLowerCase().includes(searchA.toLowerCase())
  );
  const filteredB = countries.filter((c) =>
    c.name.toLowerCase().includes(searchB.toLowerCase())
  );

  const chooseCountryA = (c: Country | undefined) => {
    if (!c) return;
    setCodeA(c.code);
    setNameA(c.name);
    setSearchA(c.name);
    fetchForecast(c.code, setForecastA);
  };
  const chooseCountryB = (c: Country | undefined) => {
    if (!c) return;
    setCodeB(c.code);
    setNameB(c.name);
    setSearchB(c.name);
    fetchForecast(c.code, setForecastB);
  };

  const triggerA = () => {
    if (!filteredA[0]) return;
    const chosen = filteredA[activeIndexA] || filteredA[0];
    chooseCountryA(chosen);
  };
  const triggerB = () => {
    if (!filteredB[0]) return;
    const chosen = filteredB[activeIndexB] || filteredB[0];
    chooseCountryB(chosen);
  };

  const showDropdownA = searchA && filteredA.some((c) => c.name !== searchA);
  const showDropdownB = searchB && filteredB.some((c) => c.name !== searchB);

  const chartA =
    forecastA?.forecasts.map((f) => ({
      year: f.year,
      energy: f.electricity_generation_twh,
      lowcarbon: f.low_carbon_share_pct,
    })) || [];
  const chartB =
    forecastB?.forecasts.map((f) => ({
      year: f.year,
      energy: f.electricity_generation_twh,
      lowcarbon: f.low_carbon_share_pct,
    })) || [];

  const displayNameA =
    nameA || countries.find((c) => c.code === codeA)?.name || codeA;
  const displayNameB =
    nameB || countries.find((c) => c.code === codeB)?.name || codeB;

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
          Comparison
        </span>
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>
        Compare two countries
      </h2>
      <p
        style={{
          marginTop: 8,
          fontSize: 13,
          color: "#4b5563",
          maxWidth: 560,
        }}
      >
        Select any two countries to compare their energy and low‑carbon
        trajectories side by side. Toggle between Energy and Low‑carbon, and
        inspect the forecast tables below each chart.
      </p>

      {/* dual search row */}
      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
        }}
      >
        {/* Country A */}
        <div>
          <p
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 4,
            }}
          >
            Country A
          </p>
          <div className="search-pill">
            <span className="search-pill-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="6" strokeWidth="2" />
                <line x1="16" y1="16" x2="21" y2="21" strokeWidth="2" />
              </svg>
            </span>
            <input
              placeholder="Search…"
              value={searchA}
              onChange={(e) => {
                setSearchA(e.target.value);
                setActiveIndexA(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  if (!filteredA.length) return;
                  setActiveIndexA((p) => (p + 1) % filteredA.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  if (!filteredA.length) return;
                  setActiveIndexA((p) =>
                    p === 0 ? filteredA.length - 1 : p - 1
                  );
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  triggerA();
                }
              }}
            />
            <button
              className="search-pill-arrow"
              type="button"
              onClick={triggerA}
            >
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

          {showDropdownA && (
            <div className="suggestion-panel">
              {filteredA.length === 0 && (
                <div
                  style={{
                    padding: "8px 14px",
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  No countries found.
                </div>
              )}
              {filteredA.slice(0, 8).map((c, idx) => (
                <button
                  key={c.code}
                  className={
                    "suggestion-item" +
                    (idx === activeIndexA ? " suggestion-item--active" : "")
                  }
                  onMouseEnter={() => setActiveIndexA(idx)}
                  onClick={() => chooseCountryA(c)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Country B */}
        <div>
          <p
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 4,
            }}
          >
            Country B
          </p>
          <div className="search-pill">
            <span className="search-pill-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="6" strokeWidth="2" />
                <line x1="16" y1="16" x2="21" y2="21" strokeWidth="2" />
              </svg>
            </span>
            <input
              placeholder="Search…"
              value={searchB}
              onChange={(e) => {
                setSearchB(e.target.value);
                setActiveIndexB(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  if (!filteredB.length) return;
                  setActiveIndexB((p) => (p + 1) % filteredB.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  if (!filteredB.length) return;
                  setActiveIndexB((p) =>
                    p === 0 ? filteredB.length - 1 : p - 1
                  );
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  triggerB();
                }
              }}
            />
            <button
              className="search-pill-arrow"
              type="button"
              onClick={triggerB}
            >
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

          {showDropdownB && (
            <div className="suggestion-panel">
              {filteredB.length === 0 && (
                <div
                  style={{
                    padding: "8px 14px",
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  No countries found.
                </div>
              )}
              {filteredB.slice(0, 8).map((c, idx) => (
                <button
                  key={c.code}
                  className={
                    "suggestion-item" +
                    (idx === activeIndexB ? " suggestion-item--active" : "")
                  }
                  onMouseEnter={() => setActiveIndexB(idx)}
                  onClick={() => chooseCountryB(c)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* side-by-side cards */}
      <div
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        {/* Card A */}
        <div className="section-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                {displayNameA}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                {metricA === "energy"
                  ? "Total generation (TWh)"
                  : "Low‑carbon share (%)"}
              </div>
            </div>
            <div className="toggle-row">
              <button
                className={`toggle-btn ${metricA === "energy" ? "active" : ""}`}
                onClick={() => setMetricA("energy")}
              >
                Energy
              </button>
              <button
                className={`toggle-btn ${
                  metricA === "lowcarbon" ? "active" : ""
                }`}
                onClick={() => setMetricA("lowcarbon")}
              >
                Low‑carbon
              </button>
            </div>
          </div>

          <div style={{ height: 260 }}>
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
            ) : chartA.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  {metricA === "energy" ? (
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
                No data.
              </div>
            )}
          </div>

          {chartA.length > 0 && (
            <div className="table-wrapper" style={{ marginTop: 16 }}>
              <p
                style={{ fontSize: 12, color: "#6b7280", margin: "0 0 6px 0" }}
              >
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
                  {chartA.map((row) => (
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

        <div className="vertical-divider" />

        {/* Card B */}
        <div className="section-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                {displayNameB}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                {metricB === "energy"
                  ? "Total generation (TWh)"
                  : "Low‑carbon share (%)"}
              </div>
            </div>
            <div className="toggle-row">
              <button
                className={`toggle-btn ${metricB === "energy" ? "active" : ""}`}
                onClick={() => setMetricB("energy")}
              >
                Energy
              </button>
              <button
                className={`toggle-btn ${
                  metricB === "lowcarbon" ? "active" : ""
                }`}
                onClick={() => setMetricB("lowcarbon")}
              >
                Low‑carbon
              </button>
            </div>
          </div>

          <div style={{ height: 260 }}>
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
            ) : chartB.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartB}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  {metricB === "energy" ? (
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
                No data.
              </div>
            )}
          </div>

          {chartB.length > 0 && (
            <div className="table-wrapper" style={{ marginTop: 16 }}>
              <p
                style={{ fontSize: 12, color: "#6b7280", margin: "0 0 6px 0" }}
              >
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
                  {chartB.map((row) => (
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
    </div>
  );
};

export default ComparePage;

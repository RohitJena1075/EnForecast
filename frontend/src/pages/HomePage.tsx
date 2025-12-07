import React, { useEffect, useState } from "react";
import axios from "axios";
import { View } from "../App";
import { API_BASE } from "../config";

interface Props {
  setView: (v: View) => void;
  setSelectedCode: (code: string | null) => void;
  setSelectedName: (name: string | null) => void;
}

interface Country {
  code: string;
  name: string;
}

type HomeTab = "about" | "history" | "model";

const HomePage: React.FC<Props> = ({
  setView,
  setSelectedCode,
  setSelectedName,
}) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<HomeTab>("about");

  useEffect(() => {
    axios
      .get<Country[]>(`${API_BASE}/countries`)
      .then((res) => setCountries(res.data))
      .catch(() => setCountries([]));
  }, []);

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const goOverviewWith = (country: Country | undefined) => {
    if (!country) return;
    setSelectedCode(country.code);
    setSelectedName(country.name);
    setView("overview");
  };

  const handleEnter = () => {
    if (!filtered[0]) return;
    goOverviewWith(filtered[activeIndex] || filtered[0]);
  };

  return (
    <div className="surface">
      <div className="hero-banner">
        <div className="brand-title">ENFORECAST</div>

        <h1 className="hero-title" style={{ marginTop: 10 }}>
          Discover the world’s energy future
        </h1>
        <p className="hero-sub">
          Search any country to explore historical electricity generation and
          low‑carbon share, then jump into an interactive forecast overview.
        </p>

        {/* hero search */}
        <div style={{ marginTop: 32 }}>
          <div className="hero-search-row">
            <input
              className="hero-search-input"
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
                  setActiveIndex((prev) => (prev + 1) % filtered.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  if (!filtered.length) return;
                  setActiveIndex((prev) =>
                    prev === 0 ? filtered.length - 1 : prev - 1
                  );
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  handleEnter();
                }
              }}
            />
            <button
              className="hero-search-button"
              type="button"
              onClick={handleEnter}
            >
              Explore energy
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

          {search && (
            <div className="hero-suggestions">
              {filtered.length === 0 && (
                <div
                  style={{
                    padding: "8px 16px",
                    fontSize: 12,
                    color: "#e5e7eb",
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
                  onClick={() => goOverviewWith(c)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* stats row */}
        <div className="stats-row" style={{ marginTop: 40 }}>
          <div className="stat-card">
            <div className="stat-icon">
              <span style={{ color: "#e5f0ff", fontSize: 18 }}>🌐</span>
            </div>
            <div>
              <div className="stat-value">{countries.length || "—"}</div>
              <div className="stat-label">Total countries</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <span style={{ color: "#e5f0ff", fontSize: 18 }}>📅</span>
            </div>
            <div>
              <div className="stat-value">1990–2024</div>
              <div className="stat-label">History window</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <span style={{ color: "#e5f0ff", fontSize: 18 }}>⏱</span>
            </div>
            <div>
              <div className="stat-value">10</div>
              <div className="stat-label">Forecast years</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <span style={{ color: "#e5f0ff", fontSize: 18 }}>⚙</span>
            </div>
            <div>
              <div className="stat-value">XGBoost</div>
              <div className="stat-label">Model family</div>
            </div>
          </div>
        </div>

        {/* CTA row */}
        <div className="cta-row">
          <button className="compare-pill" onClick={() => setView("compare")}>
            Compare countries
          </button>
        </div>

        {/* lower info with tabs + visible expand button */}
        <div className="home-lower">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div className="home-tabs">
              <button
                type="button"
                className={
                  "home-tab " +
                  (activeTab === "about" ? "home-tab--active" : "")
                }
                onClick={() => activeTab !== "about" && setActiveTab("about")}
              >
                About
              </button>
              <button
                type="button"
                className={
                  "home-tab " +
                  (activeTab === "history" ? "home-tab--active" : "")
                }
                onClick={() =>
                  activeTab !== "history" && setActiveTab("history")
                }
              >
                History
              </button>
              <button
                type="button"
                className={
                  "home-tab " +
                  (activeTab === "model" ? "home-tab--active" : "")
                }
                onClick={() => activeTab !== "model" && setActiveTab("model")}
              >
                Model overview
              </button>
            </div>

            {/* expand button clearly visible */}
            <button
              type="button"
              onClick={() => setView("docs")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                border: "none",
                width: 34,
                height: 34,
                background: "#ffffff",
                color: "#1d4ed8",
                fontSize: 18,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 6px 18px rgba(15,23,42,0.35)",
              }}
            >
              +
            </button>
          </div>

          <div className="home-tab-content">
            {/* left narrative */}
            <div className="home-info-card">
              {activeTab === "about" && (
                <>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                    Why EnForecast exists
                  </h4>
                  <p style={{ marginTop: 8 }}>
                    EnForecast turns fragmented electricity statistics into a
                    single, navigable view of the global energy transition. It
                    links country‑level generation data with modelled scenarios
                    so you can see not just where the grid is today, but where
                    it is likely heading.
                  </p>
                  <p style={{ marginTop: 6 }}>
                    The platform combines cleaned production data with
                    macro‑context. That context lets the model learn how demand
                    growth, technology costs and policy shifts interact to move
                    low‑carbon shares over time.
                  </p>
                  <p style={{ marginTop: 6 }}>
                    The workflow is straightforward: choose a country, inspect
                    its past mix, then explore forecast curves and tables. The
                    comparison view lines up peers side by side so you can see
                    which systems are decarbonising fastest.
                  </p>
                </>
              )}

              {activeTab === "history" && (
                <>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                    Historical coverage and pipeline
                  </h4>
                  <p style={{ marginTop: 8 }}>
                    The dataset aggregates annual electricity generation by fuel
                    from statistical sources and harmonises everything into
                    terawatt‑hours on a consistent time axis. Every country is
                    aligned to the same calendar, which makes cross‑country
                    charts meaningful.
                  </p>
                  <p style={{ marginTop: 6 }}>
                    Preprocessing computes derived shares for coal, oil, gas,
                    nuclear, hydro, solar, wind and other renewables. Lagged
                    versions of low‑carbon share, total generation and fossil
                    share are then attached so the model can read multi‑year
                    patterns, not just single snapshots.
                  </p>
                  <p style={{ marginTop: 6 }}>
                    Outliers and missing values are treated conservatively to
                    keep the training data stable while preserving real
                    structural breaks such as nuclear phase‑outs, large hydro
                    builds or rapid solar deployment waves.
                  </p>
                </>
              )}

              {activeTab === "model" && (
                <>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                    Modelling approach and maths
                  </h4>
                  <p style={{ marginTop: 8 }}>
                    The core engine is a pair of gradient‑boosted tree models:
                    one predicts the yearly change in low‑carbon share, the
                    other predicts the change in the logarithm of total
                    generation. Working with deltas keeps the learning problem
                    closer to stationary.
                  </p>
                  <p style={{ marginTop: 6 }}>
                    In simplified notation, the low‑carbon update is Δsₜ =
                    f(xₜ), where sₜ is the share in year t and xₜ bundles lagged
                    shares, fossil intensity and macro features. The new share
                    becomes sₜ₊₁ = clip(sₜ + Δsₜ, 0, 100). For generation, the
                    model learns ΔlogGₜ and rolls it forward as logGₜ₊₁ = logGₜ
                    + ΔlogGₜ, with Gₜ₊₁ = exp(logGₜ₊₁).
                  </p>
                  <p style={{ marginTop: 6 }}>
                    During forecasting, each predicted year is fed back into the
                    feature pipeline, recomputing lags and fossil/renewable
                    shares. This produces trajectories that respond to recent
                    dynamics instead of following a single fixed growth rate.
                  </p>
                </>
              )}
            </div>

            {/* right metrics only (no processing-flow paragraph here) */}
            <div className="home-metric-card">
              <h5 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                Snapshot metrics
              </h5>

              <div className="metric-row">
                <span className="metric-label">Global coverage</span>
                <span className="metric-value">
                  {countries.length || "—"} countries
                </span>
              </div>

              <div className="metric-row">
                <span className="metric-label">Time horizon</span>
                <span className="metric-value">10‑year forward view</span>
              </div>

              <div className="metric-row">
                <span className="metric-label">Temporal granularity</span>
                <span className="metric-value">Annual, per country</span>
              </div>

              <div className="metric-row">
                <span className="metric-label">Feature count</span>
                <span className="metric-value">20+ engineered inputs</span>
              </div>

              <div className="metric-row">
                <span className="metric-label">Targets</span>
                <span className="metric-value">
                  Δ low‑carbon share, Δ log‑generation
                </span>
              </div>

              <p style={{ marginTop: 10, fontSize: 11, opacity: 0.9 }}>
                Model quality (validation)
              </p>
              <div className="metric-bar">
                <div className="metric-bar-fill" style={{ width: "80%" }} />
              </div>
              <p style={{ marginTop: 4, fontSize: 11 }}>
                Typical mean absolute error stays below roughly eight
                percentage‑points on annual growth across most test countries,
                with wider bands for very small or volatile systems.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

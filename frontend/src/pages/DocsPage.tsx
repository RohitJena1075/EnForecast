import React from 'react';

interface Props {
  goHome: () => void;
}

const DocsPage: React.FC<Props> = ({ goHome }) => {
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
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#6b7280',
          }}
        >
          Documentation
        </span>
      </div>

      <h2 style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>
        EnForecast methodology
      </h2>
      <p
        style={{
          marginTop: 6,
          fontSize: 14,
          color: '#4b5563',
          maxWidth: 720,
        }}
      >
        This page explains what problem EnForecast is solving, how the dataset is
        built, what modelling choices were made, and how a single forecast request
        flows through the system from raw rows to the chart you see on screen.
      </p>

      {/* ABOUT */}
      <section style={{ marginTop: 28 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: '#111827' }}>
          1. About EnForecast
        </h3>
        <div
          style={{
            marginTop: 8,
            fontSize: 14,
            lineHeight: 1.6,
            color: '#374151',
            maxWidth: 900,
          }}
        >
          <p>
            EnForecast is a country‑level forecasting interface for electricity
            systems. For each country, the platform tracks the evolution of total
            electricity generation and the share coming from low‑carbon sources
            such as renewables and nuclear. The interface is intentionally simple:
            you select a country, EnForecast renders the historical time series, and
            then extends that trajectory ten years into the future using a trained
            machine‑learning model. Behind this simplicity is a pipeline that
            standardises heterogeneous raw statistics, constructs consistent
            features and applies models that are tuned for long‑horizon stability.
          </p>
          <p>
            Instead of treating forecasts as black‑box numbers, EnForecast tries to
            expose the underlying structure. The model is trained to predict
            incremental changes in key quantities rather than absolute levels.
            Conceptually, if sₜ represents the low‑carbon share in year t, the
            model approximates the mapping f: xₜ → Δsₜ where xₜ is a feature vector
            containing lagged values of s, fossil intensity indicators and
            macro‑drivers. The next share is computed as sₜ₊₁ = clip(sₜ + Δsₜ,
            0, 100). The same idea is applied to total generation Gₜ, but in the
            logarithmic space to enforce non‑negativity and temper exponential
            blow‑ups.
          </p>
          <p>
            The goal is not to match every future data point exactly but to
            provide plausible envelopes for planning and comparison. Analysts can
            inspect how a country is expected to move in the (G, s) plane, where G
            is total generation and s is low‑carbon share, and compare that
            trajectory to peers with similar income or resource endowments.
          </p>
        </div>
      </section>

      {/* HISTORY / DATA */}
      <section style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: '#111827' }}>
          2. Data history and construction
        </h3>
        <div
          style={{
            marginTop: 8,
            fontSize: 14,
            lineHeight: 1.6,
            color: '#374151',
            maxWidth: 900,
          }}
        >
          <p>
            The historical layer begins with annual electricity statistics for
            each country. Raw series are reported in multiple units and
            classifications; the processing pipeline converts them to a common
            energy basis (terawatt‑hours per year) and maps them into a unified
            set of categories: coal, oil, gas, nuclear, hydro, solar, wind and
            other renewables. These categories are then summed to obtain
            Gₜ, the total generation in year t. From Gₜ, EnForecast derives
            intensity measures such as fossil share fₜ and low‑carbon share
            sₜ = 100 − fₜ.
          </p>
          <p>
            To capture temporal structure, the dataset augments each observation
            with lagged values. For a chosen horizon L (here L = 3), the feature
            table contains sₜ₋₁, sₜ₋₂, sₜ₋₃, Gₜ₋₁, Gₜ₋₂, Gₜ₋₃ and similar lags for
            selected shares like solar and wind. These lagged variables encode
            local trends: steady increases in s over several years translate into
            positive Δs predictions, while stagnation or reversals pull forecasts
            back. Additional static covariates such as income group and region
            tags help the model discriminate between structurally different
            systems, for example rapidly growing emerging grids versus mature,
            demand‑saturated ones.
          </p>
          <p>
            Data quality is handled with conservative rules. Small gaps in
            historical series are interpolated only when surrounding values are
            statistically consistent; large gaps cause the affected years to be
            excluded from training to avoid leaking artefacts into the feature
            space. Outliers resulting from reporting revisions or one‑off shocks
            are detected using robust z‑score thresholds on ΔlogGₜ and Δsₜ and are
            either winsorised or removed. The resulting panel aims to be
            sufficiently clean for machine‑learning while still reflecting
            genuine structural breaks like policy shifts or economic crises.
          </p>
        </div>
      </section>

      {/* MODEL */}
      <section style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: '#111827' }}>
          3. Model overview and objectives
        </h3>
        <div
          style={{
            marginTop: 8,
            fontSize: 14,
            lineHeight: 1.6,
            color: '#374151',
            maxWidth: 900,
          }}
        >
          <p>
            EnForecast uses gradient‑boosted decision trees to learn two related
            prediction tasks. The first task estimates the yearly increment in
            low‑carbon share, Δsₜ = sₜ − sₜ₋₁, and the second estimates the
            increment in log‑generation, ΔlogGₜ = log Gₜ − log Gₜ₋₁. Gradient
            boosting builds an ensemble of shallow trees in stages, where each new
            tree fits the residual errors left by the previous ones. This
            structure is well suited to tabular data with non‑linear interactions
            and mixed scales.
          </p>
          <p>
            During training, each instance corresponds to a particular country and
            year t with a complete lag window. The feature vector xₜ contains
            lagged shares, lagged log‑generation, fossil intensity indicators and
            meta‑information such as region and income group encoded as dummy
            variables. The loss function for Δsₜ is the mean squared error
            between predicted and observed increments, subject to soft bounds that
            discourage extreme jumps. For ΔlogGₜ, the loss is computed on the
            log‑space differences so that multiplicative growth patterns are
            modelled additively.
          </p>
          <p>
            At inference time, the system starts from the last observed year
            t₀ with known sₜ₀ and Gₜ₀. For each forecast step k = 1,…,H, it builds
            a new feature vector xₜ₀₊ₖ from the most recent lags, obtains
            Δŝₜ₀₊ₖ and ΔlogĜₜ₀₊ₖ from the respective models, and updates the
            state via sₜ₀₊ₖ = clip(sₜ₀₊ₖ₋₁ + Δŝₜ₀₊ₖ, 0, 100) and
            logGₜ₀₊ₖ = logGₜ₀₊ₖ₋₁ + ΔlogĜₜ₀₊ₖ. The predicted level is then
            Gₜ₀₊ₖ = exp(logGₜ₀₊ₖ). This recursive procedure ensures that each step
            is aware of the trajectory so far, rather than extrapolating from a
            single snapshot. Evaluation on held‑out countries focuses on metrics
            such as mean absolute error of ΔlogGₜ and Δsₜ, as well as directional
            accuracy in capturing accelerations or slow‑downs.
          </p>
        </div>
      </section>

      {/* PROCESSING FLOW */}
      <section style={{ marginTop: 32, marginBottom: 16 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: '#111827' }}>
          4. Processing flow from request to chart
        </h3>
        <div
          style={{
            marginTop: 8,
            fontSize: 14,
            lineHeight: 1.6,
            color: '#374151',
            maxWidth: 900,
          }}
        >
          <p>
            When a user selects a country in the interface, the frontend issues a
            forecast request to the API specifying the ISO3 code and the desired
            horizon H. The backend retrieves the full historical record for that
            country from the relational database, joins it with the country meta
            table, and passes the resulting frame through the same feature
            engineering steps used in training. Only years with a complete lag
            window are retained so that feature columns align with the model
            configuration.
          </p>
          <p>
            The backend then extracts the most recent row, representing year t₀,
            and initialises the state with sₜ₀ and Gₜ₀. Features are scaled using
            a pre‑fitted transformer so that distributions match the training
            regime. For each forecast year k, the system forms xₜ₀₊ₖ from the
            latest lags, applies the low‑carbon and generation models, and
            updates s and G using the delta equations described earlier. After
            each update, derived quantities such as fossil share, technology
            shares and emission intensity can be recomputed if required for
            downstream charts or tables.
          </p>
          <p>
            Finally, the backend constructs a compact JSON payload containing the
            historical series and the H forecasted points. The frontend merges
            these into a single timeline so that charts can render history and
            prediction seamlessly with a visual transition at t₀. Tables are
            built directly from the same payload, with additional columns for
            percentage growth rates or cumulative change where needed. Because
            the whole pipeline—from raw query to chart—is deterministic given the
            input ISO3 and model configuration, scenarios can be regenerated
            exactly for auditing or future model comparisons.
          </p>
        </div>
      </section>
    </div>
  );
};

export default DocsPage;

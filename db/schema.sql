CREATE TABLE IF NOT EXISTS countries (
    country_id SERIAL PRIMARY KEY,
    iso3 CHAR(3) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(50),
    population_millions DECIMAL(10,2),
    gdp_billions_usd DECIMAL(12,2),
    net_zero_target_year INTEGER,
    ndc_2030_target_pct DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE countries
    ADD COLUMN IF NOT EXISTS subregion VARCHAR(80),
    ADD COLUMN IF NOT EXISTS income_group VARCHAR(40),
    ADD COLUMN IF NOT EXISTS access_electricity_pct DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS energy_use_koe_per_cap DECIMAL(10,2);

CREATE TABLE IF NOT EXISTS energy_generation (
    id BIGSERIAL,
    country_id INT REFERENCES countries(country_id),
    date DATE NOT NULL,
    total_mwh BIGINT,
    coal_mwh BIGINT DEFAULT 0,
    oil_mwh BIGINT DEFAULT 0,
    gas_mwh BIGINT DEFAULT 0,
    nuclear_mwh BIGINT DEFAULT 0,
    solar_mwh BIGINT DEFAULT 0,
    wind_mwh BIGINT DEFAULT 0,
    hydro_mwh BIGINT DEFAULT 0,
    other_renewables_mwh BIGINT DEFAULT 0,
    co2_kg_per_mwh DECIMAL(8,2),
    renewable_pct DECIMAL(5,2),
    fossil_pct DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (country_id, date)
);

CREATE TABLE IF NOT EXISTS energy_yearly (
    id BIGSERIAL PRIMARY KEY,
    country_id INT REFERENCES countries(country_id),
    year INT NOT NULL,
    total_energy_ej DECIMAL(14,4),
    electricity_generation_twh DECIMAL(14,3),
    coal_twh DECIMAL(14,3),
    oil_twh DECIMAL(14,3),
    gas_twh DECIMAL(14,3),
    nuclear_twh DECIMAL(14,3),
    hydro_twh DECIMAL(14,3),
    solar_twh DECIMAL(14,3),
    wind_twh DECIMAL(14,3),
    other_renewables_twh DECIMAL(14,3),
    low_carbon_share_pct DECIMAL(5,2),
    fossil_share_pct DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (country_id, year)
);

CREATE INDEX IF NOT EXISTS idx_energy_yearly_country_year
    ON energy_yearly(country_id, year);
CREATE INDEX IF NOT EXISTS idx_energy_date
    ON energy_generation(date DESC);
CREATE INDEX IF NOT EXISTS idx_energy_country
    ON energy_generation(country_id);

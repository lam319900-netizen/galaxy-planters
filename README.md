# SmartCrop 🌾🛰️
### Agricultural Decision-Support for Crop Rotation in Upper Egypt (Sohag Governorate)
*NASA Earth Observation & Open Science Agricultural Hackathon MVP*

---

## 📖 Project Mission
**SmartCrop** is a scientifically transparent agricultural decision-support web application that empowers smallholder farmers, extension agronomists, and agricultural policymakers in Upper Egypt to evaluate and compare multi-season crop rotation strategies.

By synthesizing **live NASA POWER Earth observation data**, **local soil information (ISRIC SoilGrids & Egyptian Soil and Water Research Institute)**, **FAO-56 crop water requirements**, and **farmer management priorities**, SmartCrop generates and ranks 2-year (4-season) rotation plans tailored to arid, heat-stressed environments.

---

## 🎯 1. Strict MVP Scope
- **Geographic Focus**: Centered strictly on **Sohag Governorate, Egypt** (26.55°N, 31.70°E) across all 12 administrative centers (*Markaz*: Sohag, Akhmim, Girga, Tahta, Maragha, Balyana, Monshaa, Sakulta, Juhayna, Dar El Salam, Tama, New Sohag).
- **Target Crops**: Restricted to 5 quintessential, locally documented crops:
  1. **Wheat (قمح)** – Winter staple food security cereal.
  2. **Egyptian Clover / Berseem (برسيم مصري)** – Winter multi-cut restorative fodder legume (+180 kg N/ha biological fixation).
  3. **Grain Sorghum (ذرة رفيعة)** – Summer heat/drought-tolerant C4 cereal.
  4. **Faba Bean (فول بلدي)** – Winter low-water protein legume (+110 kg N/ha fixation).
  5. **Dry Bulb Onion (بصل جاف)** – Winter/spring high-value commercial bulb cash crop.
- **Multi-Season Sequences**: Evaluates crop succession over **4 consecutive seasons (2 full years)**: Winter Year 1 ➔ Summer Year 1 ➔ Winter Year 2 ➔ Summer Year 2.
- **Scientific Transparency**: Zero black-box AI claims. Explicit formulas, configurable weights, and published agronomic references.

---

## 🌐 2. Bilingual Interface (English & Arabic)
- **Instant Language Switch**: Visible `EN / العربية` toggle in the header.
- **Layout Direction**: Automatic dynamic switching between **LTR (English)** and **RTL (Arabic)** with `dir="rtl"` and Arabic typography (`Cairo` and `Tajawal` fonts).
- **100% Translated**: All forms, descriptions, validation alerts, crop descriptions, recommendation rationales, charts, and methodology sections are fully bilingual.
- **Persistent State**: The user's language selection is saved in `localStorage` and persists across navigation and page refreshes.

---

## 🛰️ 3. NASA POWER API Integration
SmartCrop connects directly to the NASA Langley Atmospheric Science Data Center (ASDC) **NASA POWER API** (Prediction Of Worldwide Energy Resources, AG community):

- **Endpoint**: `https://power.larc.nasa.gov/api/temporal/daily/point`
- **Queried Parameters**:
  - `T2M`: Daily 2-meter air temperature (°C).
  - `T2M_MAX`: Daily maximum air temperature (°C) — critical for summer heatwave risk.
  - `T2M_MIN`: Daily minimum air temperature (°C).
  - `PRECTOTCORR`: Daily precipitation corrected (mm) — demonstrates Sohag's hyper-arid climate (~5.4 mm/year).
  - `ALLSKY_SFC_SW_DWN`: All-sky surface shortwave solar irradiance (MJ/m²/day).
- **Time Period**: Verified full annual meteorological baseline (2024-01-01 to 2024-12-31).
- **Robust Error & Missing Value Handling**:
  - Automatically filters invalid/missing observation codes (`-900` and `-999`).
  - Computes Growing Degree Days (GDD, Base 10°C) and seasonal partition averages (Summer vs. Winter).
  - **Explicit Demo Mode Fallback**: If the NASA API times out or the client is offline, SmartCrop offers a clearly badged historical baseline. It **never** silently substitutes simulated data for real API observations.

---

## 🌍 4. Soil Data & Provenance
- Integrates spatial predictions from **ISRIC SoilGrids 250m REST API** (`rest.isric.org`).
- Validated with regional benchmarks from the **Egyptian Soil & Water Research Institute (SWRI / ARC)**:
  - **Nile Alluvial Clay Loam** (Old Valley): Heavy fertility, pH 7.8–8.0, OM 1.1–1.4%, high CEC.
  - **Reclaimed Desert Margins** (Juhayna & Dar El Salam): Sandy loam, pH 8.1–8.3, OM < 0.5%, fast drainage.
  - **Calcareous Desert Plateau** (New Sohag): Elevated limestone soils with active $\text{CaCO}_3 > 15\%$.
- Optional field measurements: Farmers can provide their exact field laboratory pH and Organic Matter %, which override regional defaults.

---

## 🧠 5. Recommendation Engine & Scoring Methodology
SmartCrop uses a transparent **Multi-Criteria Decision Analysis (MCDA)** scoring algorithm (0–100 normalized scale):

$$\text{Overall Score} = (\text{Water} \times W_w) + (\text{Climate} \times W_c) + (\text{Soil} \times W_s) + (\text{Sequence} \times W_{seq}) + (\text{Priority} \times W_p)$$

### Default Weights:
- **Water Alignment ($W_w = 0.25$)**: Matches total 2-year evapotranspiration against user's canal/well irrigation availability (Low, Medium, High).
- **Climate Suitability ($W_c = 0.20$)**: Evaluates crop heat threshold vs. NASA POWER recorded extreme summer temperatures ($T_{max} > 42^\circ\text{C}$).
- **Soil Health Index ($W_s = 0.20$)**: Evaluates symbiotic biological nitrogen fixation, organic matter addition, and soil texture compaction relief.
- **Agronomic Sequence Harmony ($W_{seq} = 0.15$)**: Penalizes monoculture cereal-after-cereal, rewards cereal following legumes, checks for pest breaks (*Orobanche*, *Sclerotium*).
- **Farmer Priority Alignment ($W_p = 0.20$)**: Dynamically boosts criteria based on user's primary goal (Water conservation, Soil health, Climate resilience, Profitability).

### 3 Generated Multi-Season Rotation Plans:
1. **Plan A: Water-Conserving & Climate Resilience Rotation**
   - *Sequence*: Faba Bean ➔ Grain Sorghum ➔ Wheat ➔ Summer Fallow / Solarization
   - *2-Year Water Footprint*: 1,380 mm (35% water savings).
   - *Net N Balance*: -30 kg N/ha.
2. **Plan B: Soil Health & Integrated Fodder-Cereal Rotation**
   - *Sequence*: Egyptian Clover (Berseem) ➔ Grain Sorghum ➔ Wheat ➔ Grain Sorghum
   - *2-Year Water Footprint*: 2,200 mm.
   - *Net N Balance*: +180 kg N/ha biological fixation.
3. **Plan C: High-Value Cash Crop & Food Security Sequence**
   - *Sequence*: Wheat ➔ Grain Sorghum ➔ Dry Bulb Onion ➔ Grain Sorghum
   - *2-Year Water Footprint*: 1,960 mm.
   - *Focus*: Maximum gross liquidity from Sohag's early onion crop backed by wheat security.

---

## 💻 6. Installation & How to Run

### Prerequisites
- **Node.js**: v18.0.0 or higher (v24.x tested)
- **npm** (or `npm.cmd` on Windows)

### Steps

1. **Clone or Navigate to the Project**:
   ```bash
   cd nasaneso
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build for Production**:
   ```bash
   npm run build
   ```

5. **Preview Production Build**:
   ```bash
   npm run preview
   ```

---

## 📊 7. Visual Components & Features
- **Global Interactive Map (Leaflet.js & OpenStreetMap)**:
  - Hybrid location selection: 12 Sohag Certified Centers or global custom coordinates anywhere on the world map.
  - Interactive pin-drop on click, "Use My GPS Location" (`navigator.geolocation`), and manual coordinate inputs.
  - Automatic detection of regional boundaries with a custom global badge when outside Sohag.
- **Dynamic NASA POWER Climate Station**:
  - Live API queries retrieving $T_{mean}$, $T_{max}$, precipitation, solar radiation, and Growing Degree Days (GDD, Base 10°C).
  - Valid observation count tracking and automated filter of missing data values ($\le -900$).
- **Local Agricultural Units Toggle (Hectare vs. Feddan)**:
  - Instant switching between **Hectare (ha / mm)** and **Egyptian Feddan (Feddan / m³)** across all views.
  - Automatic conversions: $\text{kg/feddan} = \text{kg/ha} / 2.381$ and $\text{m}^3/\text{feddan} = \text{mm} \times 4.2$.
- **Interactive Multi-Criteria Radar & Bar Chart**: Side-by-side comparison across all 5 scoring dimensions using Chart.js.
- **4-Season Timeline**: Graphical progression showing sowing/harvest dates, water demand, and nitrogen balance.
- **Side-by-Side Comparison Matrix**: Tabular comparison of 2-year water consumption, soil benefits, and risk ratings.
- **Print / PDF Advisory Export**: Pre-styled printer-friendly stylesheet for field extension agents.

---

## ⚠️ 8. Data Limitations & Agronomic Disclaimers
- SmartCrop is an **advisory decision-support MVP** designed for strategic planning.
- **No Guarantees**: A crop rotation does not guarantee specific yields, profits, or pest-free outcomes.
- **Canal Water Delivery Realities**: Actual water availability in Egypt depends on Ministry of Water Resources and Irrigation rotational delivery schedules (*El-Monaowabat* / نوبات الري) and branch canal maintenance.
- **Microclimate & Soil Salinity**: Field-level soil testing and consultation with local agricultural extension offices (الجمعيات والإدارات الزراعية) are strongly recommended.

---

## 📜 Scientific References & Citations
- **NASA POWER Project**: NASA Langley Atmospheric Science Data Center (ASDC). Surface Meteorology and Solar Energy.
- **FAO Drainage Paper No. 56**: Allen, R.G., Pereira, L.S., Raes, D., Smith, M. *Crop Evapotranspiration: Guidelines for Computing Crop Water Requirements*.
- **Egyptian Agricultural Research Center (ARC)**: Shandaweel Agricultural Research Station (Sohag), Field Crops & Forage Departments.
- **ISRIC – World Soil Information**: SoilGrids 250m global gridded soil information.

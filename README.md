# Portfolio Builder & Simulator

A comprehensive portfolio simulation tool built for Indian investors. Backtest SIPs, lump sum investments, SWPs, and hybrid strategies using real mutual fund NAV data — then plan goals, compare what-if scenarios, and save your portfolios.

Built on top of [asrajavel/portfolio-simulator](https://github.com/asrajavel/portfolio-simulator) (AGPL-3.0).

## Features

### SIP Simulator
Backtest systematic investment plans across any Indian mutual fund or index. See rolling XIRR returns, volatility analysis, drawdown charts, and return distributions for any time horizon.

### Lumpsum Simulator
Simulate one-time investments with the same rolling XIRR analysis. Compare multiple portfolios side by side with different asset allocations.

### SWP Simulator
Model systematic withdrawal plans — invest a corpus and withdraw monthly. See survival analysis (how long does your money last?) and final corpus outcomes across all historical rolling windows. Includes a withdrawal rate safety indicator.

### Hybrid Simulator
Combine lumpsum + SIP in a single strategy. Tracks XIRR, final corpus, and max drawdown across rolling periods.

### Goal Calculator
Plan financial goals with two modes: set a target amount and find the required SIP, or enter your SIP and see what it grows to. Includes inflation adjustment, scenario comparison (conservative/moderate/aggressive), and year-by-year projections. Comes with India-specific presets for emergency fund, car, home, child education, wedding, and retirement.

### What-If Scenarios
Compare up to 5 investment scenarios side by side. Tweak SIP amounts, lumpsum, expected returns, time horizon, annual step-up percentage, and inflation to see the impact visually.

### Save & Load Portfolios
Save your portfolio configurations locally and reload them anytime. Export/import as JSON for backup or sharing across devices.

## Tech Stack

- React 18 + TypeScript
- Vite (build tooling)
- Base UI (Uber) component library
- Highcharts / Highstock for financial charts
- Web Workers for heavy computation (SIP, Lumpsum, SWP, Hybrid calculations run off the main thread)
- Oat-inspired design system (zinc palette, system-ui fonts, minimal shadows)

## Data Sources

- **Indian Mutual Funds**: Real-time NAV data via [MFAPI](https://www.mfapi.in/)
- **Indices & International**: Via Yahoo Finance proxy
- **Government Schemes**: PPF, SSY, NPS, and other fixed-return instruments

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Deployment

This is a static site — deploy anywhere. Recommended: [Vercel](https://vercel.com) (auto-detects Vite, deploys in one click from GitHub).

## License

GNU Affero General Public License v3.0 — see [LICENSE](LICENSE) for details.

Since this is AGPL-3.0, if you deploy a modified version as a web app, you must make your source code publicly available.

## Credits

- Original project by [asrajavel](https://github.com/asrajavel/portfolio-simulator)
- Design inspired by [Oat](https://github.com/knadh/oat) by Kailash Nadh (Zerodha CTO)
- Built with help from Claude (Anthropic)

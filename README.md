# WebPlots

🚀 **[Live Demo](https://emunozgutier.github.io/webplots/)**

A versatile web-based plotting tool built with React, TypeScript, and Plotly.

## Features
*   **Data Loading**: specialized support for CSV data.
*   **Interactive Plotting**: powered by Plotly.js.
*   **Drag-and-Drop**: intuitive side menu for configuring X and Y axes.
*   **Customization**:
    *   **Trace Config**: Granular control over each trace's display name, color, and plot type (Line vs Scatter).
    *   **Symbols**: Choose from various marker symbols (Circle, Square, Diamond, etc.) for scatter plots.
    *   **Layout**: Logarithmic scales, custom titles, and axis ranges.
*   **Debug Mode**: View the generated Plotly code receipt for use in other scripts.

## Development

This project is built with **React** + **TypeScript** + **Vite**.

### Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Run development server:
    ```bash
    npm run dev
    ```
3.  Build for production:
    ```bash
    npm run build
    ```

### Deployment

This project is configured to deploy to [GitHub Pages](https://pages.github.com/).

```bash
npm run deploy
```

---

## React + TypeScript + Vite Details

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

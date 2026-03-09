# WebPlots: High-Performance Interactive Data Visualization & CSV Plotter

🚀 **[Live Demo](https://emunozgutier.github.io/webplots/)**

WebPlots is a versatile, lightning-fast web-based data visualization tool built with **React**, **TypeScript**, and **Plotly.js**. Designed for researchers and data analysts who need to explore large datasets instantly without the overhead of heavy software.

![WebPlots Feature Demo](public/demo_preview.webp)

## Key Features

### 📊 Instant Table Summaries
Understand your data distribution at a glance. WebPlots automatically generates:
*   **Sparkline Histograms & Scatter Plots**: Visual distribution summaries right in the table headers.
*   **Statistical Analysis**: Instant Min, Max, Average, and Median calculations.
*   **Gaussian Mixture Modeling**: Click the zoom icon on any column to see multi-component Gaussian fits and statistical outliers.

### 🔄 Dynamic Data Grouping
Organize complex datasets with intuitive drag-and-drop grouping.
*   **Multi-Trace Grouping**: Drag any column to the "Group Axis" to split your data into categorical sub-traces.
*   **Custom Filtering**: Granular control over which data points are included in your plots.

### ⚡ Lightning-Fast Interface
Built for massive datasets.
*   **High-Performance Virtualization**: Smoothly scroll through 1,000,000+ rows with zero lag.
*   **Responsive Plotting**: Powered by Plotly.js for interactive, publication-quality charts.

### 🛠️ Advanced Customization
*   **Trace Configuration**: Full control over display names, colors, and plot types (Line vs Scatter).
*   **Debug Mode**: View the generated Plotly code receipt to use in your own scripts.
*   **Flexible Layouts**: Logarithmic scales, custom axis titles, and range controls.

## Development

This project is built with modern web technologies: **React 19**, **TypeScript**, and **Vite**.

### Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Run development server**:
    ```bash
    npm run dev
    ```
3.  **Build for production**:
    ```bash
    npm run build
    ```

### Deployment

Configured for seamless deployment to [GitHub Pages](https://pages.github.com/).

```bash
npm run deploy
```

---

*Built with ❤️ for the data science community.*

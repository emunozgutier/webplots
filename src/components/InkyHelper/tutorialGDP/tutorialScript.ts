export interface TutorialStep {
  text: string;
  
  // Optional action to perform when navigating TO this step
  action?: (stores: any) => void;
  
  // Where the squid should point its tentacle
  // Can be a CSS selector (e.g., '#file-nav-dropdown') or exact coordinates
  targetSelector?: string;
  targetCoords?: { x: number, y: number };
  
  // Requirements that must be met before the "Next" button is enabled
  requireDataLoaded?: boolean;
  requirementCheck?: (stores: any) => boolean;
}

export const gdpTutorialSteps: TutorialStep[] = [
  {
    text: "Welcome to the GDP plotting tutorial! First, please load your dataset using the File or Test menu. (The Next button will enable once data is loaded).",
    requireDataLoaded: true,
    targetSelector: "#test-nav-dropdown" // Example: Pointing at the Test menu
  },
  {
    text: "First, we set the axes. X-axis is 'gdpPercap' (with Log scale!) and Y-axis is 'lifeExp'.",
    action: (stores) => {
      stores.axisSideMenuStore.getState().setXAxis('gdpPercap');
      stores.axisSideMenuStore.getState().addYAxisColumn('lifeExp');
      stores.plotLayoutStore.getState().setEnableLogXAxis(true);
    },
    targetSelector: ".axis-config-panel" // Just an example selector, adjust to your actual UI
  },
  {
    text: "Let's color the bubbles by 'continent'. Notice how the Style side menu updates!",
    action: (stores) => {
      stores.styleSideMenuStore.getState().setHue({ source: 'column', value: 'continent', enabled: true });
    },
    targetSelector: ".style-side-menu"
  },
  {
    text: "We map the size of the bubbles to the 'pop' (Population) column.",
    action: (stores) => {
      stores.styleSideMenuStore.getState().setSize({ source: 'column', value: 'pop', enabled: true, sizeMode: 'area' });
    }
  },
  {
    text: "Now, let's animate over time by setting the animation column to 'year'.",
    action: (stores) => {
      stores.animationSideMenuStore.getState().setAnimationColumn('year');
    },
    targetSelector: ".animation-controls"
  },
  {
    text: "The Plot Area above shows the chart. Below is the Data Table & Stats, which dynamically update with the animation!",
  },
  {
    text: "You're all set! Press Play on the Animation menu on the left and enjoy exploring the data!",
  }
];

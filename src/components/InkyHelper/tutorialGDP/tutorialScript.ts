export interface TutorialChoice {
  label: string;
  actionType: 'next' | 'skip';
  primary?: boolean;
}

export interface TutorialStep {
  text: string;
  
  // Optional action to perform when navigating TO this step
  action?: (stores: any) => void;
  
  // Where the squid should point its tentacle
  targetSelector?: string;
  dynamicTargetSelector?: () => string | undefined;
  targetCoords?: { x: number, y: number };
  
  // Requirements that must be met before the "Next" button is enabled
  requireDataLoaded?: boolean;
  requirementCheck?: (stores: any) => boolean;

  // Custom choices to display instead of the default Next/Skip buttons
  choices?: TutorialChoice[];
}

export const gdpTutorialSteps: TutorialStep[] = [
  {
    text: "Would you like a tutorial?",
    choices: [
      { label: "GDP Tutorial", actionType: "next", primary: true },
      { label: "No thanks", actionType: "skip" }
    ]
  },
  {
    text: "First, let's load the data. Go to Test > World Life Expect vs GDP to load the sample data.",
    requireDataLoaded: true,
    targetSelector: "#test-nav-dropdown",
    dynamicTargetSelector: () => {
      // Check if the dropdown menu is open and the item is visible
      const el = document.querySelector("#test-nav-gapminder");
      if (el && el.getBoundingClientRect().height > 0) {
        return "#test-nav-gapminder";
      }
      return "#test-nav-dropdown";
    }
  },
  {
    text: "Great! Now take a look at the Data Table below. Try scrolling to the right until you can see the 'year', 'gdp', and 'life_expectancy' columns.",
    targetSelector: ".table-scroll-container",
    requirementCheck: () => {
        const container = document.querySelector('.table-scroll-container');
        if (!container) return false;
        
        const headers = Array.from(container.querySelectorAll('th'));
        const targetHeaders = headers.filter(th => {
            const text = th.textContent?.toLowerCase() || '';
            return text.includes('year') || text.includes('gdp') || text.includes('life_expectancy');
        });

        if (targetHeaders.length < 3) return false;

        const containerRect = container.getBoundingClientRect();
        
        return targetHeaders.every(th => {
            const rect = th.getBoundingClientRect();
            // Check if header is at least partially visible within the scroll container
            return rect.right > containerRect.left && rect.left < containerRect.right;
        });
    }
  },
  {
    text: "First, we set the axes. X-axis is 'gdp' (with Log scale!) and Y-axis is 'life_expectancy'.",
    action: (stores) => {
      stores.axisSideMenuStore.getState().setXAxis('gdp');
      stores.axisSideMenuStore.getState().addYAxisColumn('life_expectancy');
      stores.plotLayoutStore.getState().setEnableLogXAxis(true);
    },
    targetSelector: ".axis-config-panel" // Just an example selector, adjust to your actual UI
  },
  {
    text: "Let's color the bubbles by 'region'. Notice how the Style side menu updates!",
    action: (stores) => {
      stores.styleSideMenuStore.getState().setHue({ source: 'column', value: 'region', enabled: true });
    },
    targetSelector: ".style-side-menu"
  },
  {
    text: "We map the size of the bubbles to the 'population' column.",
    action: (stores) => {
      stores.styleSideMenuStore.getState().setSize({ source: 'column', value: 'population', enabled: true, sizeMode: 'area' });
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

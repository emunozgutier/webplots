import { useColumnTypeStore } from '../../../store/useColumnTypeStore';

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
    text: "Before we continue, let's make sure the 'year' column is treated as literal years instead of formatted numbers. In the Data Table below, click the 'Generic' badge under the 'year' column header and change it to 'Year'.",
    targetSelector: ".table-scroll-container",
    requirementCheck: () => {
        return useColumnTypeStore.getState().overrides['year'] === 'Year';
    }
  },
  {
    text: "Great! Now take a look at the Data Table below. Try scrolling to the right until the 'life_expectancy' column appears.",
    targetSelector: ".table-scroll-container",
    requirementCheck: () => {
        const container = document.querySelector('.table-scroll-container');
        if (!container) return false;
        
        const headers = Array.from(container.querySelectorAll('th'));
        const targetHeaders = headers.filter(th => {
            const text = th.textContent?.toLowerCase() || '';
            return text.includes('life_expectancy');
        });

        if (targetHeaders.length < 1) return false;

        const containerRect = container.getBoundingClientRect();
        
        return targetHeaders.every(th => {
            const rect = th.getBoundingClientRect();
            // Check if it's FULLY visible with a slight padding, ensuring the user really scrolled to it
            return rect.left >= containerRect.left && rect.right <= containerRect.right - 10;
        });
    }
  },
  {
    text: "Now, let's configure our chart! Open the Axis menu and set the X-axis to 'gdp' (with Log scale checked!) and the Y-axis to 'life_expectancy'.",
    targetSelector: ".axis-side-menu-container", 
    dynamicTargetSelector: () => {
        return document.querySelector('#axis-side-menu') ? '#axis-side-menu' : '.axis-side-menu-container';
    },
    requirementCheck: (stores) => {
      const axisData = stores.axisSideMenuStore.getState().sideMenuData;
      const enableLogX = stores.plotLayoutStore.getState().enableLogXAxis;
      return axisData.xAxis === 'gdp' && axisData.yAxis.includes('life_expectancy') && enableLogX === true;
    }
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

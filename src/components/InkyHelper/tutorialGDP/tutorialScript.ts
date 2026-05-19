import { useColumnTypeStore } from '../../../store/useColumnTypeStore';
import type { CardinalDirection } from '../../../utils/DataClasses';

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
  autoAdvance?: boolean;

  // Custom choices to display instead of the default Next/Skip buttons
  choices?: TutorialChoice[];
  
  targetPosition?: CardinalDirection;
  dynamicTargetPosition?: () => CardinalDirection;
  bubblePlacement?: CardinalDirection;
  dynamicBubblePlacement?: () => CardinalDirection;
  noPointing?: boolean;
  dragAndDrop?: () => { 
    sourceSelector: string; 
    destSelector: string;
    sourcePosition?: CardinalDirection;
    destPosition?: CardinalDirection;
  } | undefined;
}

export const gdpTutorialSteps: TutorialStep[] = [
  {
    text: "Would you like a tutorial?",
    choices: [
      { label: "GDP Tutorial", actionType: "next", primary: true },
      { label: "No thanks", actionType: "skip" }
    ],
    bubblePlacement: 'nw'
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
    },
    targetPosition: 'se',
    bubblePlacement: 'se',
  },
  {
    text: "Let's first set the year column to the year type. Click the 'Generic' badge under the 'year' column header and change it to 'Year'.",
    targetSelector: "#type-badge-year",
    targetPosition: "n",
    bubblePlacement: 'w',
    requirementCheck: () => {
        return useColumnTypeStore.getState().overrides['year'] === 'Year';
    }
  },
  {
    text: "Great! Now scroll right until you can see the whole life expectancy column.",
    bubblePlacement: 'w',
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
    text: "Now click on the zoom button (the magnifying glass) in the 'life_expectancy' column header to view its data distribution.",
    targetSelector: "#zoom-btn-life_expectancy",
    targetPosition: "n",
    bubblePlacement: "w",
    requirementCheck: (stores) => {
        return stores.workspaceLocalStore.getState().popupContent !== null;
    }
  },
  {
    text: "Here is the zoomed distribution! Notice how there are 2 clear Gaussians (peaks) in this plot, showing a bimodal distribution of life expectancy. Close this popup when you're ready to proceed.",
    targetSelector: "#popup-menu-container",
    targetPosition: "w",
    bubblePlacement: "e",
    noPointing: true,
    requirementCheck: (stores) => {
        return stores.workspaceLocalStore.getState().popupContent === null;
    }
  },
  {
    text: "Now, let's configure our chart! Open the Axis menu and set the X-axis to 'gdp'.",
    targetSelector: "#x-axis-label", 
    dynamicTargetSelector: () => {
        const label = document.querySelector('#x-axis-label');
        if (label && label.getBoundingClientRect().width > 0) return '#x-axis-label';
        return '#side-menu-btn-axis';
    },
    dragAndDrop: () => {
        const label = document.querySelector('#x-axis-label');
        const destSelector = (label && label.getBoundingClientRect().width > 0) ? '#x-axis-label' : '#side-menu-btn-axis';
        return { 
            sourceSelector: "#draggable-column-text-gdp", 
            destSelector,
            sourcePosition: 'e'
        };
    },
    requirementCheck: (stores) => {
      const axisData = stores.axisSideMenuStore.getState().sideMenuData;
      return axisData.xAxis === 'gdp';
    }
  },
  {
    text: "Great! Now set the Y-axis to 'life_expectancy'.",
    requirementCheck: (stores) => {
      const axisData = stores.axisSideMenuStore.getState().sideMenuData;
      return axisData.yAxis.includes('life_expectancy');
    }
  },
  {
    text: "Now click the 'Plot' tab to see our scatter plot!",
    targetSelector: "#plot-view-tab",
    requirementCheck: () => {
        const tab = document.querySelector('#plot-view-tab');
        return tab?.classList.contains('active') || document.querySelector('.js-plotly-plot') !== null;
    }
  },
  {
    text: "Let's fix the X-axis scale! Click the 'Settings' button on the bottom right.",
    targetSelector: "#plot-settings-btn",
    targetPosition: "n",
    requirementCheck: (stores) => {
        return stores.workspaceLocalStore.getState().popupContent !== null;
    }
  },
  {
    text: "Check the 'Log X-Axis' box to use a logarithmic scale.",
    targetSelector: "#enableLogXAxisToggle",
    targetPosition: "n",
    requirementCheck: () => {
        const checkbox = document.querySelector('#enableLogXAxisToggle') as HTMLInputElement;
        return checkbox && checkbox.checked === true;
    }
  },
  {
    text: "Now click 'Save Layout' to apply the changes and close the popup.",
    targetSelector: "#save-layout-btn",
    targetPosition: "n",
    requirementCheck: (stores) => {
        return stores.plotLayoutStore.getState().plotLayout.enableLogXAxis === true && stores.workspaceLocalStore.getState().popupContent === null;
    }
  },
  {
    text: "Now, open the 'Style' menu from the right side bar to customize how our data looks.",
    targetSelector: "#side-menu-btn-color",
    requirementCheck: () => {
        const el = document.querySelector('#style-element-huecolor-toggle');
        return el !== null && el.getBoundingClientRect().width > 0;
    }
  },
  {
    text: "Toggle the switch on 'Hue/Color' to enable it.",
    targetSelector: "#style-element-huecolor-toggle",
    dynamicTargetSelector: () => {
        const el = document.querySelector('#style-element-huecolor-toggle');
        if (el && el.getBoundingClientRect().width > 0) return '#style-element-huecolor-toggle';
        return '#side-menu-btn-color';
    },
    requirementCheck: (stores) => {
        return stores.styleSideMenuStore.getState().colorData.hue.enabled === true;
    }
  },
  {
    text: "First, let's color the bubbles by region! Change the 'Source Mode' under 'Hue/Color' to 'Column Value'.",
    targetSelector: "#style-element-huecolor-source",
    dynamicTargetSelector: () => {
        const el = document.querySelector('#style-element-huecolor-source');
        if (el && el.getBoundingClientRect().width > 0) return '#style-element-huecolor-source';
        return '#side-menu-btn-color';
    },
    requirementCheck: (stores) => {
        return stores.styleSideMenuStore.getState().colorData.hue.source === 'column';
    }
  },
  {
    text: "Now select 'region' as the dataset column for Hue/Color.",
    targetSelector: "#style-element-huecolor-column",
    dynamicTargetSelector: () => {
        const el = document.querySelector('#style-element-huecolor-column');
        if (el && el.getBoundingClientRect().width > 0) return '#style-element-huecolor-column';
        return '#side-menu-btn-color';
    },
    requirementCheck: (stores) => {
        return stores.styleSideMenuStore.getState().colorData.hue.value === 'region';
    }
  },
  {
    text: "Next, let's change the size of the bubbles! First, toggle the switch on 'Node Size' to enable it.",
    targetSelector: "#style-element-nodesize-toggle",
    dynamicTargetSelector: () => {
        const el = document.querySelector('#style-element-nodesize-toggle');
        if (el && el.getBoundingClientRect().width > 0) return '#style-element-nodesize-toggle';
        return '#side-menu-btn-color';
    },
    requirementCheck: (stores) => {
        return stores.styleSideMenuStore.getState().colorData.size.enabled === true;
    }
  },
  {
    text: "Change the 'Source Mode' under 'Node Size' to 'Column Value'.",
    targetSelector: "#style-element-nodesize-source",
    dynamicTargetSelector: () => {
        const el = document.querySelector('#style-element-nodesize-source');
        if (el && el.getBoundingClientRect().width > 0) return '#style-element-nodesize-source';
        return '#side-menu-btn-color';
    },
    requirementCheck: (stores) => {
        return stores.styleSideMenuStore.getState().colorData.size.source === 'column';
    }
  },
  {
    text: "Select 'population' as the dataset column for Node Size.",
    targetSelector: "#style-element-nodesize-column",
    dynamicTargetSelector: () => {
        const el = document.querySelector('#style-element-nodesize-column');
        if (el && el.getBoundingClientRect().width > 0) return '#style-element-nodesize-column';
        return '#side-menu-btn-color';
    },
    requirementCheck: (stores) => {
        return stores.styleSideMenuStore.getState().colorData.size.value === 'population';
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

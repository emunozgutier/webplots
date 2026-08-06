import { create } from 'zustand';
import { useCsvDataStore } from './useCsvDataStore';
import type { CsvDataStore } from './useCsvDataStore';
import { useWorkspaceStore, workspaceRegistry } from './Workspace/useWorkspaceStore';

interface DemoDataState {
    isWeatherLoading: boolean;
    isGapminderLoading: boolean;
    weatherError: string | null;
    gapminderError: string | null;
    loadWeatherData: () => Promise<void>;
    loadGapminderData: () => Promise<void>;
}

const WEATHER_DATA_URL = 'https://raw.githubusercontent.com/emunozgutier/webplots/main/public/data/weather_data.json';
const GAPMINDER_DATA_URL = 'https://raw.githubusercontent.com/emunozgutier/webplots/main/public/data/gapminder.json';

export const useDemoData = create<DemoDataState>()((set) => ({
    isWeatherLoading: false,
    isGapminderLoading: false,
    weatherError: null,
    gapminderError: null,

    loadWeatherData: async () => {
        set({ isWeatherLoading: true, weatherError: null });
        try {
            const response = await fetch(WEATHER_DATA_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch weather data: ${response.statusText}`);
            }
            const rawData = await response.json();
            const flattenedData: CsvDataStore[] = [];

            // Flatten the nested JSON structure into an array of objects
            for (const city of Object.keys(rawData)) {
                const cityData = rawData[city];
                const daily = cityData.daily;

                if (daily && daily.time) {
                    for (let i = 0; i < daily.time.length; i++) {
                        const dateStr = daily.time[i];
                        const dateObj = new Date(dateStr);

                        // Calculate day out of the year
                        const start = new Date(dateObj.getFullYear(), 0, 0);
                        const diff = (dateObj.getTime() - start.getTime()) + ((start.getTimezoneOffset() - dateObj.getTimezoneOffset()) * 60 * 1000);
                        const oneDay = 1000 * 60 * 60 * 24;
                        const dayOfYear = Math.floor(diff / oneDay);

                        flattenedData.push({
                            city: city,
                            date: dateStr,
                            year: dateObj.getFullYear(),
                            day_out_of_the_year: dayOfYear,
                            temp_day_high: daily.temperature_2m_max?.[i] ?? null,
                            temp_day_low: daily.temperature_2m_min?.[i] ?? null,
                            sunrise_time: daily.sunrise?.[i] ?? null,
                            sunset_time: daily.sunset?.[i] ?? null,
                            latitude: cityData.latitude,
                            longitude: cityData.longitude,
                            temperature_2m_mean: daily.temperature_2m_mean?.[i] ?? null,
                            rain_sum: daily.rain_sum?.[i] ?? null,
                            surface_pressure_mean: daily.surface_pressure_mean?.[i] ?? null
                        });
                    }
                }
            }

            if (flattenedData.length > 0) {
                const csvStore = useCsvDataStore.getState();
                csvStore.setPlotData(flattenedData);
                const cols = Object.keys(flattenedData[0]);
                csvStore.setColumns(cols);
                
                const activeStores = workspaceRegistry.get(useWorkspaceStore.getState().activeWorkspaceId);
                if (activeStores) {
                    if (cols.length > 1) { // Assuming 'city' is index 0 and 'date' is index 1
                        activeStores.axisSideMenuStore.getState().setXAxis(cols[1]);
                    } else if (cols.length > 0) {
                        activeStores.axisSideMenuStore.getState().setXAxis(cols[0]);
                    }
                }
            }
            set({ isWeatherLoading: false });
        } catch (error: unknown) {
            console.error('Error fetching weather json from GitHub:', error);
            set({ isWeatherLoading: false, weatherError: error instanceof Error ? error.message : 'Error loading weather data' });
            throw error;
        }
    },

    loadGapminderData: async () => {
        set({ isGapminderLoading: true, gapminderError: null });
        try {
            const response = await fetch(GAPMINDER_DATA_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch Gapminder data: ${response.statusText}`);
            }
            const rawData = await response.json();
            const flattenedData: CsvDataStore[] = [];

            for (const country of rawData) {
                const { geo, name, gdp, life_expectancy, population, region } = country;
                
                const yearsSet = new Set<string>();
                if (gdp) Object.keys(gdp).forEach(y => yearsSet.add(y));
                if (life_expectancy) Object.keys(life_expectancy).forEach(y => yearsSet.add(y));
                if (population) Object.keys(population).forEach(y => yearsSet.add(y));
                
                const years = Array.from(yearsSet).sort((a, b) => parseInt(a) - parseInt(b));
                
                const currentYear = new Date().getFullYear();
                for (const yearStr of years) {
                    const yearNum = parseInt(yearStr, 10);
                    if (yearNum > currentYear) continue;
                    
                    flattenedData.push({
                        geo: geo,
                        country: name,
                        region: region ?? "unknown",
                        year: yearNum,
                        gdp: gdp?.[yearStr] ?? null,
                        life_expectancy: life_expectancy?.[yearStr] ?? null,
                        population: population?.[yearStr] ?? null
                    });
                }
            }

            if (flattenedData.length > 0) {
                const csvStore = useCsvDataStore.getState();
                csvStore.setPlotData(flattenedData);
                const cols = Object.keys(flattenedData[0]);
                csvStore.setColumns(cols);
                
                const activeStores = workspaceRegistry.get(useWorkspaceStore.getState().activeWorkspaceId);
                if (activeStores) {
                    const isTutorialActive = useWorkspaceStore.getState().isTutorialActive;
                    if (!isTutorialActive) {
                        activeStores.axisSideMenuStore.getState().setXAxis('gdp');
                        activeStores.axisSideMenuStore.getState().addYAxisColumn('life_expectancy');
                        activeStores.groupSideMenuStore.getState().setGroupAxis('country');
                        activeStores.styleSideMenuStore.getState().setSize({ source: 'column', value: 'population', enabled: true, sizeMode: 'area', range: [5, 32600], mappingType: 'exponential', midPoint: [0.5, 0.66] });
                        activeStores.styleSideMenuStore.getState().setHue({ source: 'column', value: 'region', enabled: true });
                        activeStores.styleSideMenuStore.getState().setColorData({
                            groupColorOverrides: {
                                'americas': '#7feb00',
                                'europe': '#ffe700',
                                'africa': '#00d5e9',
                                'asia': '#ff5872'
                            }
                        });
                        activeStores.plotLayoutStore.getState().setEnableLogXAxis(true);
                        activeStores.animationSideMenuStore.getState().setAnimationColumn('year');
                        activeStores.animationSideMenuStore.getState().setDisplayMode('background');
                        activeStores.filterSideMenuStore.getState().addFilter('year', 'number', { min: 1900 });
                    }
                }
            }
            set({ isGapminderLoading: false });
        } catch (error: unknown) {
            console.error('Error fetching Gapminder json from GitHub:', error);
            set({ isGapminderLoading: false, gapminderError: error instanceof Error ? error.message : 'Error loading Gapminder data' });
            throw error;
        }
    }
}));

if (typeof window !== 'undefined') {
    const win = window as unknown as { __registerZustandStore?: (store: unknown, name: string) => void };
    if (win.__registerZustandStore) {
        win.__registerZustandStore(useDemoData, 'DemoDataStore');
    }
}

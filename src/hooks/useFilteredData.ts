import { useMemo } from 'react';
import { useCsvDataStore } from '../store/CsvDataStore';
import { useFilterStore } from '../store/FilterStore';

export const useFilteredData = () => {
    const { data: rawData } = useCsvDataStore();
    const { filters } = useFilterStore();

    const filteredData = useMemo(() => {
        if (filters.length === 0) return rawData;

        return rawData.filter(row => {
            return filters.every(filter => {
                const val = row[filter.column];

                if (filter.type === 'number') {
                    const min = (filter.config as any).min;
                    const max = (filter.config as any).max;

                    if (typeof val !== 'number') return false;
                    if (min != null && val < min) return false;
                    if (max != null && val > max) return false;
                    return true;
                } else {
                    const included = (filter.config as any).includedValues;
                    // If no values selected/configured, usually implies "all" or "none". 
                    // In our UI init, we select all. If empty array, it blocks everything.
                    if (!included) return true;
                    return included.includes(String(val));
                }
            });
        });
    }, [rawData, filters]);

    return filteredData;
};

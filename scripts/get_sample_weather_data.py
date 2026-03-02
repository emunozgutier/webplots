import os
import json
import requests
from datetime import datetime, timedelta

def get_dates():
    # The Open-Meteo Archive API generally has data up to 5 days ago
    end_date_obj = datetime.now() - timedelta(days=5)
    
    # 10 years before the end date
    try:
        start_date_obj = end_date_obj.replace(year=end_date_obj.year - 10)
    except ValueError:
        # Handle leap year edge case
        start_date_obj = end_date_obj.replace(year=end_date_obj.year - 10, day=28)
        
    return start_date_obj.strftime("%Y-%m-%d"), end_date_obj.strftime("%Y-%m-%d")

def main():
    cities = {
        "New York City": {"lat": 40.7128, "lon": -74.0060},
        "Tokyo": {"lat": 35.6762, "lon": 139.6503},
        "Los Angeles": {"lat": 34.0522, "lon": -118.2437},
        "San Francisco": {"lat": 37.7749, "lon": -122.4194},
        "Seoul": {"lat": 37.5665, "lon": 126.9780},
        "Paris": {"lat": 48.8566, "lon": 2.3522},
        "Chicago": {"lat": 41.8781, "lon": -87.6298},
        "Shanghai": {"lat": 31.2304, "lon": 121.4737},
        "London": {"lat": 51.5074, "lon": -0.1278},
        "Beijing": {"lat": 39.9042, "lon": 116.4074}
    }

    start_date, end_date = get_dates()
    base_url = "https://archive-api.open-meteo.com/v1/archive"
    
    final_data = {}

    for city, coords in cities.items():
        print(f"Fetching data for {city} from {start_date} to {end_date}...")
        
        params = {
            "latitude": coords["lat"],
            "longitude": coords["lon"],
            "start_date": start_date,
            "end_date": end_date,
            "daily": "temperature_2m_mean,rain_sum,surface_pressure_mean,temperature_2m_max,temperature_2m_min,sunrise,sunset",
            "timezone": "auto"
        }

        try:
            import time
            time.sleep(2)
            # We use a 30 second timeout per request.
            # Using requests here handles SSL certificates properly on macOS.
            response = requests.get(base_url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            daily_data = data.get("daily", {})
            for key in ["sunrise", "sunset"]:
                if key in daily_data and daily_data[key]:
                    formatted_times = []
                    for t in daily_data[key]:
                        if t:
                            try:
                                dt = datetime.fromisoformat(t)
                                formatted_times.append(dt.strftime("%H:%M"))
                            except ValueError:
                                # Fallback if parsing fails
                                formatted_times.append(t)
                        else:
                            formatted_times.append(t)
                    daily_data[key] = formatted_times

            final_data[city] = {
                "latitude": coords["lat"],
                "longitude": coords["lon"],
                "daily": daily_data
            }
            print(f"Successfully fetched data for {city}.")
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching data for {city}: {e}")
        except Exception as e:
            print(f"Unexpected error for {city}: {e}")

    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(script_dir, "..", "public", "weather_data.json")
    
    # Ensure the public directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    print(f"\nSaving data to {os.path.abspath(output_file)}...")
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(final_data, f, indent=2)
        
    print("Done! Data has been saved.")

if __name__ == "__main__":
    main()

import subprocess
import json
import datetime
import os

def get_current_commit_info():
    try:
        # Get the latest commit title
        title = subprocess.run(['git', 'log', '-1', '--pretty=%s'], capture_output=True, text=True, check=True).stdout.strip()
        # Get the latest commit message body
        message = subprocess.run(['git', 'log', '-1', '--pretty=%b'], capture_output=True, text=True, check=True).stdout.strip()
        return title, message
    except subprocess.CalledProcessError:
        return "No commit title available", "No commit message available"

def main():
    now = datetime.datetime.now()
    # isocalendar returns (iso_year, iso_week, iso_weekday)
    # where iso_weekday is 1 for Monday, ..., 7 for Sunday. Saturday is 6.
    iso_year, iso_week, iso_weekday = now.isocalendar()
    
    # Format: year.week.day (e.g., 2026.08.6)
    version_string = f"{now.year}.{iso_week:02d}.{iso_weekday}"
    
    commit_title, commit_message = get_current_commit_info()
    
    data = {
        "commit_title": commit_title,
        "commit_message": commit_message,
        "version_string": version_string
    }
    
    # Ensure public directory exists
    os.makedirs('public', exist_ok=True)
    
    version_file_path = 'public/version.json'
    with open(version_file_path, 'w') as f:
        json.dump(data, f, indent=4)
        
    print(f"Successfully generated {version_file_path} with version {version_string}")

if __name__ == "__main__":
    main()

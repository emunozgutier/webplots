import subprocess
import json
import datetime
import os

def get_current_commit_info():
    try:
        # Get the last 20 commits
        # Format: '%s<<DELIMITER>>%b<<END_COMMIT>>'
        log_format = '%s<<DELIMITER>>%b<<END_COMMIT>>'
        result = subprocess.run(['git', 'log', '-20', f'--pretty={log_format}'], capture_output=True, text=True, check=True)
        
        commits = result.stdout.strip().split('<<END_COMMIT>>')
        
        for commit in commits:
            commit = commit.strip()
            if not commit:
                continue
                
            parts = commit.split('<<DELIMITER>>')
            if len(parts) >= 2:
                title = parts[0].strip()
                message = parts[1].strip()
                
                # Check if this is an auto-generated or version-bumping commit
                title_lower = title.lower()
                if ('auto versioning' not in title_lower and 
                    'update version.json' not in title_lower and
                    'version.json' not in title_lower):
                    return title, message
                    
        return "No suitable commit found", "No commit message available"
    except subprocess.CalledProcessError:
        return "No commit title available", "No commit message available"

def commit_and_push():
    try:
        # Check if there are any changes (including untracked files)
        status = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True)
        if status.stdout.strip():
            print("Changes detected. Committing and pushing...")
            subprocess.run(['git', 'add', '.'], check=True)
            subprocess.run(['git', 'commit', '-m', 'auto versioning'], check=True)
            subprocess.run(['git', 'push'], check=True)
            print("Successfully committed and pushed changes.")
        else:
            print("No changes to commit.")
    except subprocess.CalledProcessError as e:
        print(f"Error during git commit: {e}")

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

    commit_and_push()

if __name__ == "__main__":
    main()

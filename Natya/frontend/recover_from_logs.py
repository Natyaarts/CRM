import os
import re

log_file = r'C:\Users\91811\.gemini\antigravity\brain\970e54b8-e2d4-42f6-a430-f365af87fc8b\.system_generated\logs\overview.txt'
if not os.path.exists(log_file):
    print("Log file not found")
    exit()

with open(log_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

current_file = None
file_content = {}
capture = False

for line in lines:
    if line.startswith("File Path: `file:///c:/Users/91811/Downloads/Natya%20crm/Natya/frontend/src/"):
        pathpart = line.split("src/")[-1].split("`")[0]
        # urldecode
        import urllib.parse
        pathpart = urllib.parse.unquote(pathpart)
        target = os.path.join(r"c:\Users\91811\Downloads\Natya crm\Natya\frontend\src", pathpart)
        current_file = target
        file_content[current_file] = []
        capture = False
        continue

    if "The following code has been modified to include a line number before every line" in line:
        capture = True
        continue
    
    if line.startswith("The above content shows the entire, complete file contents"):
        capture = False
        current_file = None
        continue
        
    if capture and current_file:
        # Match "1: some code"
        m = re.match(r'^\d+:\s?(.*)\n?', line)
        if m:
            file_content[current_file].append(m.group(1) + '\n')

for fpath, lines in file_content.items():
    if len(lines) > 0:
        os.makedirs(os.path.dirname(fpath), exist_ok=True)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print(f"Restored {fpath} with {len(lines)} lines")

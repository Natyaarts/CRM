import os
import json
import shutil

history_dir = r'C:\Users\91811\AppData\Roaming\Code\User\History'
target_dir = r'c:\Users\91811\Downloads\Natya crm\Natya\frontend\src'

if not os.path.exists(history_dir):
    print('VSCode History not found')
else:
    recovered = 0
    for root_hash in os.listdir(history_dir):
        hash_path = os.path.join(history_dir, root_hash)
        if not os.path.isdir(hash_path):
            continue
        entries_file = os.path.join(hash_path, 'entries.json')
        if not os.path.exists(entries_file):
            continue
        try:
            with open(entries_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # data is typically {'version':1, 'resource':'file:///...', 'entries': [...]}
            resource = data.get('resource', '')
            if 'Natya%20crm' in resource and 'frontend/src' in resource and resource.endswith(('.jsx', '.js', '.css', '.html')):
                rel_path = resource.split('frontend/src/')[-1]
                target_file = os.path.join(target_dir, rel_path)
                
                # Get the latest entry
                entries = data.get('entries', [])
                if entries:
                    entries.sort(key=lambda x: x.get('timestamp', 0))
                    
                    # We need to find the latest one that is > 0 bytes
                    best_file = None
                    for entry in reversed(entries):
                        entry_path = os.path.join(hash_path, entry['id'])
                        if os.path.exists(entry_path) and os.path.getsize(entry_path) > 0:
                            best_file = entry_path
                            break
                    
                    if best_file:
                        os.makedirs(os.path.dirname(target_file), exist_ok=True)
                        shutil.copy2(best_file, target_file)
                        print(f'Recovered: {rel_path} from VSCode history')
                        recovered += 1
        except Exception as e:
            pass # ignore parse errors
            
    print(f'Total recovered files: {recovered}')

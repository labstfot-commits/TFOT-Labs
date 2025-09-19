import json
import glob
import os

# Directory with lang files
dir_path = '.'

# Languages without Twitter in their array (based on common structure)
langs_without_twitter = ['ru', 'zh', 'fr', 'de', 'hi', 'ko', 'he', 'sw', 'pt', 'es', 'it']

for file_path in glob.glob('*.json'):
    if file_path == 'update_socials.py':
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if 'footer' in data and 'socials' in data['footer']:
        socials = data['footer']['socials']
        updated = False
        for lang in langs_without_twitter:
            if lang in socials and len(socials[lang]) == 3 and 'Twitter' not in socials[lang]:
                # Replace the third network with "Twitter"
                socials[lang][2] = 'Twitter'
                updated = True
        
        if updated:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Updated {file_path}")

print("All updates completed.")
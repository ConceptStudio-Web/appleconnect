import glob

files = glob.glob('*.html')
count = 0

for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            lines = file.readlines()
        
        new_lines = []
        last_line = None
        
        # We only want to deduplicate the specific Mobile contact lines we just touched
        target_str = 'Mobile: <a href="tel:+263717331700">+263 71 733 1700</a>'
        
        changed = False
        for line in lines:
            stripped = line.strip()
            if target_str in stripped:
                # If this line is effectively the same as the last appended line
                if last_line and stripped in last_line:
                    changed = True
                    continue # Skip duplicate
            
            new_lines.append(line)
            last_line = line
            
        if changed:
            with open(f, 'w', encoding='utf-8') as file:
                file.writelines(new_lines)
            print(f"Deduplicated {f}")
            count += 1
            
    except Exception as e:
        print(f"Error processing {f}: {e}")

print(f"Total files cleaned: {count}")

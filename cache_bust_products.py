import os

directory = r"C:\Users\ndaza\.gemini\antigravity\scratch\appleconnect"
target = '<script src="data/products.js"></script>'
replacement = '<script src="data/products.js?v=25"></script>'

count = 0
for filename in os.listdir(directory):
    if filename.endswith(".html"):
        filepath = os.path.join(directory, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        if target in content:
            new_content = content.replace(target, replacement)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {filename}")
            count += 1
        else:
            print(f"Skipped {filename} (match not found)")

print(f"Total files updated: {count}")

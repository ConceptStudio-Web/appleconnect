import glob

files = glob.glob('*.html')
replacements = [
    ('tel:+263292330482', 'tel:+263717331700'),
    ('>+263 292330482<', '>+263 71 733 1700<'),
    ('Call: +263 292330482', 'Call: +263 71 733 1700'),
    ('Tel: +263 292330482', 'Tel: +263 71 733 1700'),
    ('Tel: <a href="tel:+263717331700">', 'Mobile: <a href="tel:+263717331700">') # fix label if we replaced number in Tel line
]

count = 0
for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        new_content = content
        for old, new in replacements:
            new_content = new_content.replace(old, new)
        
        # Special case: if we have duplicate lines now (e.g. Tel replaced to Mobile, and Mobile already exists)
        # We might want to deduplicate, but user just asked to use the number.
        # However, checking if "Tel:" became "Mobile:" implicitly via number change? 
        # No, "Tel: [mobile]" is what we'll get. 
        # If I change "Tel:" to "Mobile:", I might have two "Mobile:" lines.
        # I'll stick to just replacing numbers for now as requested.
        
        if new_content != content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"Updated {f}")
            count += 1
    except Exception as e:
        print(f"Error updating {f}: {e}")

print(f"Total files updated: {count}")

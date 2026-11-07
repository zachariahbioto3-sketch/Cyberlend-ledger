import glob, io

replacements = [
    ("Ã¢â‚¬â€œ", "\u2013"),  # mojibake en dash
    ("Ã¢â‚¬â€", "\u2014"),   # mojibake em dash
    ("Ã‚Â·", "\u00b7"),      # double-mojibake middot
    ("Ã‚Â·".replace("Â·","\u00b7"), "\u00b7"),
    ("Â·", "\u00b7"),        # mojibake middot
]

files = glob.glob("src/**/*.tsx", recursive=True) + glob.glob("src/**/*.ts", recursive=True)
changed = []
for f in files:
    with io.open(f, "r", encoding="utf-8") as fh:
        content = fh.read()
    orig = content
    for bad, good in replacements:
        content = content.replace(bad, good)
    if content != orig:
        with io.open(f, "w", encoding="utf-8") as fh:
            fh.write(content)
        changed.append(f)

print("Changed files:")
for f in changed:
    print(" ", f)

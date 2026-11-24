#!/usr/bin/env python3
with open('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/HppInputTable.js', 'r') as f:
    content = f.read()

# Replace the malformed button section
old_text = '''                      <button
                        className={`px-2 py-1 text-xs rounded border ${mode === 'perOrder' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                      >
                        <button
                        className={`px-2 py-1 text-xs rounded border ${mode === 'perUnit' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}'''

new_text = '''                      <button
                        className={`px-2 py-1 text-xs rounded border ${mode === 'perOrder' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                      >
                        Per Order
                      </button>
                      <button
                        className={`px-2 py-1 text-xs rounded border ${mode === 'perUnit' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                      >
                        Per Unit
                      </button>'''

if old_text in content:
    content = content.replace(old_text, new_text)
    with open('c:/Users/ARIEZ/Desktop/shopee-profit-auditor/app/components/HppInputTable.js', 'w') as f:
        f.write(content)
    print('Success: Replaced button tags')
else:
    print('Pattern not found')
    # Debug: print what we have around the button area
    idx = content.find('className={`px-2 py-1')
    if idx > 0:
        print('Found at index', idx)
        print('Context:', repr(content[idx-50:idx+200]))
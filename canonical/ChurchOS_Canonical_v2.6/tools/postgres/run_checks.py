"""Container entrypoint; preserve a failure result even before DB checks start."""
import json,subprocess,sys
from pathlib import Path
out=Path('/evidence');out.mkdir(parents=True,exist_ok=True)
commands=[['python','tools/validate.py'],['python','tools/sql_syntax.py'],['python','-m','unittest','discover','-s','tests','-p','test_*.py'],['python','tools/db_verify.py','--disposable-cluster','--output',str(out/'db-result.json')]]
summary={'runtime':'INCOMPLETE','stages':[]}
for cmd in commands:
 result=subprocess.run(cmd)
 summary['stages'].append({'command':cmd,'exit_code':result.returncode})
 (out/'launcher-result.json').write_text(json.dumps(summary,indent=2)+'\n')
 if result.returncode:sys.exit(result.returncode)
summary['runtime']='PASS'
(out/'launcher-result.json').write_text(json.dumps(summary,indent=2)+'\n')

"""SQL grammar only; does not execute PL/pgSQL bodies, constraints or permissions."""
from pathlib import Path
import json,sys
from pglast import parse_sql,get_postgresql_version
ROOT=Path(__file__).resolve().parents[1]
def check_sql(text):
 # Only the existing SQL-test psql directive is supported; reject unknown meta commands.
 lines=[]
 for line in text.splitlines():
  if line.lstrip().startswith('\\'):
   if line.strip()!=r'\set ON_ERROR_STOP on':raise ValueError('Unsupported psql directive')
  else:lines.append(line)
 return len(parse_sql('\n'.join(lines)))
def main():
 results=[]
 for p in sorted((ROOT/'db/migrations').glob('*.sql'))+sorted((ROOT/'db/security-tests').glob('*.sql')):
  try:count=check_sql(p.read_text());results.append({'file':str(p.relative_to(ROOT)),'status':'PASS','statements':count})
  except Exception as exc:results.append({'file':str(p.relative_to(ROOT)),'status':'FAIL','error':type(exc).__name__})
 passed=len(results)==21 and all(x['status']=='PASS' for x in results)
 print(json.dumps({'sql_grammar':'PASS' if passed else 'FAIL','parser_postgresql_version':get_postgresql_version(),'files':results,'runtime':'NOT_RUN'},indent=2))
 return 0 if passed else 1
if __name__=='__main__':sys.exit(main())

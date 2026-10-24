import importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('syntax',Path(__file__).resolve().parents[1]/'tools/sql_syntax.py');syntax=importlib.util.module_from_spec(spec);spec.loader.exec_module(syntax)
class SqlSyntaxTests(unittest.TestCase):
 def test_valid_sql(self):self.assertEqual(1,syntax.check_sql(r'\set ON_ERROR_STOP on'+'\nselect 1;'))
 def test_bad_sql(self):
  with self.assertRaises(Exception):syntax.check_sql('create table broken (id uuid name text);')
 def test_unknown_psql_directive(self):
  with self.assertRaises(ValueError):syntax.check_sql(r'\include external.sql')
if __name__=='__main__':unittest.main()

import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest
SPEC=importlib.util.spec_from_file_location('catalog',Path(__file__).resolve().parents[1]/'tools/catalog.py')
catalog=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(catalog)

class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        for folder in ('site','shared','templates','lessons'):
            shutil.copytree(catalog.ROOT/folder,self.root/folder,ignore=shutil.ignore_patterns('.tools','node_modules','__pycache__'))
        self.path=self.root/'lessons/software-design/facade/lesson.json'
    def tearDown(self):self.temp.cleanup()
    def edit(self,**changes):
        data=json.loads(self.path.read_text());data.update(changes);self.path.write_text(json.dumps(data))
    def test_build_relative_links_and_escaping(self):
        self.edit(title='<script>alert(1)</script>')
        out=catalog.build(self.root);text=(out/'index.html').read_text()
        self.assertIn('&lt;script&gt;',text);self.assertNotIn('<script>alert(1)',text)
        self.assertIn('lessons/software-design/facade/index.html',text)
        self.assertTrue((out/'lessons/software-design/facade/index.html').is_file())
        self.assertFalse((out/'lessons/software-design/facade/tests').exists())
    def test_bad_paths_rejected(self):
        for value in ('../README.html','/index.html','C:\\secrets.html'):
            with self.subTest(value=value):
                self.edit(entrypoint=value)
                with self.assertRaises(ValueError):catalog.collect(self.root)
    def test_invalid_mode_rejected(self):
        self.edit(mode='pretend-real');
        with self.assertRaises(ValueError):catalog.collect(self.root)
    def test_new_lesson_appears_without_editing_homepage(self):
        before=len(catalog.collect(self.root))
        catalog.create('mathematics','balance','Balance an equation',self.root)
        out=catalog.build(self.root)
        self.assertEqual(len(json.loads((out/'catalog.json').read_text())),before+1)
        self.assertIn('Balance an equation',(out/'index.html').read_text())
        with self.assertRaises(ValueError):catalog.create('mathematics','balance','Overwrite',self.root)

if __name__=='__main__':unittest.main()

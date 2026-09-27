import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

SOURCE = Path(__file__).parents[1] / 'shelf'

class UpdateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.dest = self.root / 'install'
        self.old = self.dest / 'releases/old'
        self.old.mkdir(parents=True)
        (self.old/'revision').write_text('old')
        (self.dest/'current').symlink_to(self.old)
        self.fixture = self.root / 'fixture'; shutil.copytree(SOURCE, self.fixture)
        self.sha = 'a'*40
        (self.fixture/'commit.json').write_text(json.dumps({'sha':self.sha}))
        self.bin = self.root / 'bin'; self.bin.mkdir()
        curl = self.bin/'curl'
        curl.write_text('''#!/usr/bin/env python3
import os,sys,shutil
from pathlib import Path
if os.environ.get('MOCK_OFFLINE'): sys.exit(22)
args=sys.argv[1:]; url=next(x for x in args if x.startswith('https://'))
name='commit.json' if 'api.github.com' in url else url.rsplit('/',1)[-1]
if name == os.environ.get('MOCK_FAIL'): sys.exit(22)
shutil.copyfile(Path(os.environ['MOCK_SOURCE'])/name,args[args.index('-o')+1])
''')
        curl.chmod(0o755)
        self.env = {**os.environ, 'HOME':str(self.root), 'BAZZPI_DEST':str(self.dest),
                    'XDG_STATE_HOME':str(self.root/'state'), 'MOCK_SOURCE':str(self.fixture),
                    'PATH':str(self.bin)+os.pathsep+os.environ['PATH']}

    def tearDown(self): self.tmp.cleanup()
    def run_update(self):
        return subprocess.run(['bash', str(SOURCE/'update.sh')], env=self.env, capture_output=True, timeout=10)
    def test_offline_keeps_current(self):
        self.env['MOCK_OFFLINE']='1'
        self.run_update()
        self.assertEqual((self.dest/'current').resolve(), self.old)
        self.assertEqual((self.root/'state/bazzpi/update-status').read_text().strip(), 'offline')
    def test_partial_download_cannot_replace_current(self):
        self.env['MOCK_FAIL']='shelf.js'
        self.assertNotEqual(self.run_update().returncode, 0)
        self.assertEqual((self.dest/'current').resolve(), self.old)
    def test_invalid_code_cannot_replace_current(self):
        (self.fixture/'shelf.js').write_text('const = ;')
        self.assertNotEqual(self.run_update().returncode, 0)
        self.assertEqual((self.dest/'current').resolve(), self.old)
    def test_complete_release_switches_atomically_and_retains_previous(self):
        result=self.run_update()
        self.assertEqual(result.returncode, 0, result.stderr.decode())
        self.assertEqual((self.dest/'current/revision').read_text().strip(), self.sha)
        self.assertEqual((self.dest/'previous').resolve(), self.old)
        self.assertEqual(self.run_update().returncode,0)
        self.assertEqual((self.root/'state/bazzpi/update-status').read_text().strip(), 'current')
    def test_rejected_revision_not_retried_every_boot(self):
        folder=self.root/'state/bazzpi'; folder.mkdir(parents=True)
        (folder/'rejected-revision').write_text(self.sha)
        self.run_update()
        self.assertEqual((self.dest/'current').resolve(), self.old)
        self.assertEqual((folder/'update-status').read_text().strip(), 'rollback')

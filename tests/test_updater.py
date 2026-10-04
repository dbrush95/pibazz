"""Exercise atomic update behavior with simulated GitHub transports."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SHA = 'a' * 40

class UpdaterTests(unittest.TestCase):
    def exercise(self, fail_api=False):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            dest = root / 'install'
            old = dest / 'releases/old'
            old.mkdir(parents=True)
            (dest / 'current').symlink_to(old)
            bin_dir = root / 'bin'
            bin_dir.mkdir()
            curl = bin_dir / 'curl'
            curl.write_text('''#!/usr/bin/env python3
import json, os, pathlib, sys
args = sys.argv[1:]
url = next(a for a in args if a.startswith('https://'))
with open(os.environ['CALL_LOG'], 'a') as log: log.write(url + '\\n')
out = pathlib.Path(args[args.index('-o') + 1])
if 'raw.githubusercontent.com' in url:
    out.write_text('incomplete')
    sys.exit(35)
if '/commits/' in url:
    out.write_text(json.dumps({'sha': 'a' * 40}))
else:
    assert 'Accept: application/vnd.github.raw+json' in args
    assert url.endswith('?ref=' + 'a' * 40)
    if os.environ['FAIL_API'] == '1': sys.exit(22)
    name = url.split('/shelf/')[1].split('?')[0]
    out.write_bytes((pathlib.Path(os.environ['SOURCE']) / 'shelf' / name).read_bytes())
''')
            curl.chmod(0o755)
            env = dict(os.environ, HOME=str(root), XDG_STATE_HOME=str(root/'state'),
                       BAZZPI_DEST=str(dest), BAZZPI_UPDATE_REF='main',
                       PATH=str(bin_dir)+os.pathsep+os.environ['PATH'],
                       SOURCE=str(ROOT), CALL_LOG=str(root/'calls'), FAIL_API=str(int(fail_api)))
            result = subprocess.run(['bash', str(ROOT/'shelf/update.sh')], env=env, capture_output=True, text=True)
            status = (root/'state/bazzpi/update-status').read_text().strip()
            if fail_api:
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(status, 'failed')
                self.assertEqual((dest/'current').resolve(), old)
            else:
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(status, 'updated')
                self.assertEqual((dest/'current/revision').read_text().strip(), SHA)
                self.assertEqual((dest/'previous').resolve(), old)
                self.assertEqual((dest/'current/shelf.js').read_bytes(), (ROOT/'shelf/shelf.js').read_bytes())
                calls = (root/'calls').read_text()
                self.assertEqual(calls.count('raw.githubusercontent.com'), 1)
                self.assertEqual(calls.count('/contents/shelf/'), 6)
            self.assertEqual(list((dest/'releases').glob('.stage-*')), [])

    def test_raw_tls_failure_uses_api(self):
        self.exercise()

    def test_api_failure_preserves_active_release(self):
        self.exercise(fail_api=True)

"""Run with python3 -m unittest discover -s tests -v. No Pi hardware required."""
import importlib.util
import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from unittest.mock import patch, Mock

spec = importlib.util.spec_from_file_location('shelf', Path(__file__).parents[1] / 'shelf/shelf.py')
shelf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(shelf)

class MoonlightTests(unittest.TestCase):
    def test_pasted_sunshine_address(self):
        self.assertEqual(shelf.normalize_host('https://192.168.1.20:47990/'), '192.168.1.20')
        self.assertEqual(shelf.normalize_host('192.168.1.20:47990'), '192.168.1.20')
        with self.assertRaises(RuntimeError): shelf.normalize_host('--help')

    def test_hardware_is_not_forced_and_exact_app_name_preserved(self):
        with patch.object(shelf, 'moonlight_bin', return_value='moonlight-qt'), patch.object(shelf, 'run_in_front') as run:
            shelf.moonlight('192.168.1.20', "Game: Kid's Adventure!", 1920, 1080, 60, 20000, 'H.264')
            args, env = run.call_args.args
            self.assertEqual(args[args.index('--video-decoder')+1], 'auto')
            self.assertIn("Game: Kid's Adventure!", args)
            self.assertNotIn('H264_DECODER_HINT', env)

    def test_list_separates_diagnostics_and_keeps_numeric_names(self):
        proc = Mock(returncode=0, stdout='Loading app list...\nSteam\n123. Game\n', stderr='Qt warning: connection failed\n')
        with patch.object(shelf, 'moonlight_bin', return_value='moonlight-qt'), patch.object(shelf.subprocess, 'run', return_value=proc):
            self.assertEqual(shelf.list_apps('pc.local'), ['Steam', '123. Game'])
            proc.returncode = 1
            with self.assertRaises(RuntimeError): shelf.list_apps('pc.local')

    def test_pair_pin_is_generated_before_process_output(self):
        proc = Mock()
        proc.stdout = iter([])
        proc.wait.return_value = 0
        with patch.object(shelf, 'moonlight_bin', return_value='moonlight-qt'), patch.object(shelf.subprocess, 'Popen', return_value=proc) as popen, patch.object(shelf, 'tuck_shelf') as tuck:
            result = shelf.start_pair('pc.local')
            self.assertRegex(result['pin'], r'^\d{4}$')
            self.assertEqual(popen.call_args.args[0][-2:], ['--pin', result['pin']])
            tuck.assert_not_called()

class ApiTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.home = patch.object(shelf, 'HOME', Path(self.tmp.name)); self.home.start()
        self.profile = patch.object(shelf, 'PROFILE_PATH', Path(self.tmp.name)/'profile.json'); self.profile.start()
        shelf.UNLOCKED = False
        self.server = shelf.ThreadingHTTPServer(('127.0.0.1', 0), shelf.Handler)
        self.port = patch.object(shelf, 'PORT', self.server.server_port); self.port.start()
        self.base = f'http://127.0.0.1:{self.server.server_port}'
        threading.Thread(target=self.server.serve_forever, daemon=True).start()

    def tearDown(self):
        self.server.shutdown(); self.server.server_close()
        self.port.stop(); self.profile.stop(); self.home.stop(); self.tmp.cleanup()

    def request(self, path, body=None, token='', origin=None):
        headers = {'Origin': origin or self.base, 'Content-Type':'application/json', 'X-Bazzpi-Token':token}
        req = urllib.request.Request(self.base+path, data=json.dumps(body).encode() if body is not None else None, headers=headers)
        try:
            with urllib.request.urlopen(req) as response: return response.status, json.load(response)
        except urllib.error.HTTPError as response: return response.code, json.load(response)

    def test_profile_lock_actually_protects_api(self):
        code, result = self.request('/api/profile', {'name':'Player','pin':'1234'})
        self.assertEqual(code, 200)
        token = result['token']
        self.assertEqual(self.request('/api/files')[0], 401)
        self.assertEqual(self.request('/api/files', token=token)[0], 200)
        self.assertEqual(self.request('/api/lock', {}, token)[0], 200)
        self.assertEqual(self.request('/api/files', token=token)[0], 401)
        self.assertEqual(self.request('/api/unlock', {'pin':'1234'})[0], 200)

    def test_websites_cannot_call_local_commands(self):
        self.assertEqual(self.request('/api/profile', {'name':'Player'}, origin='https://evil.example')[0], 403)
        self.assertEqual(self.request('/api/profile', [1,2])[0], 400)

    def test_file_escape_blocked(self):
        self.request('/api/profile', {'name':'Player'})
        self.assertEqual(self.request('/api/file?path=../outside')[0], 400)

if __name__ == '__main__': unittest.main()

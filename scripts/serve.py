from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse
import os
import sys


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
START_PORT = int(os.environ.get("PORT", "8081"))
MAX_ATTEMPTS = 20


class BrightHarborHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        self._serve_with_index_fallback()

    def do_HEAD(self):
        self._serve_with_index_fallback()

    def _serve_with_index_fallback(self):
        parsed_path = unquote(urlparse(self.path).path)
        requested = (PUBLIC / parsed_path.lstrip("/")).resolve()

        if not str(requested).startswith(str(PUBLIC)):
            self.send_error(403, "Forbidden")
            return

        if not requested.exists() or requested.is_dir():
            self.path = "/index.html"

        return super().do_GET() if self.command == "GET" else super().do_HEAD()

    def log_message(self, format, *args):
        return


def make_server(port):
    handler = partial(BrightHarborHandler, directory=str(PUBLIC))
    return ThreadingHTTPServer(("", port), handler)


def main():
    last_error = None

    for port in range(START_PORT, START_PORT + MAX_ATTEMPTS):
        try:
            server = make_server(port)
        except OSError as error:
            last_error = error
            if error.errno == 48:
                print(f"Port {port} is already in use, trying the next one...")
                continue
            if error.errno == 1:
                print(f"Your Mac blocked port {port}, trying the next one...")
                continue
            raise

        print("")
        print("Bright Harbor Time Off Requests is running.")
        print(f"Open this URL: http://127.0.0.1:{port}/")
        print("")
        print("Leave this terminal window open while you use the site.")
        print("Press Control + C here when you want to stop the site.")
        print("")

        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped Bright Harbor Time Off Requests.")
        finally:
            server.server_close()
        return

    print("")
    print(f"Could not find an open local preview port from {START_PORT} to {START_PORT + MAX_ATTEMPTS - 1}.")
    if last_error:
        print(f"Last error: {last_error}")
    print("Close other preview terminal windows, then run npm run serve again.")
    sys.exit(1)


if __name__ == "__main__":
    main()

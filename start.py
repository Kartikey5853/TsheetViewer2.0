"""
TSheet Viewer 2.0 — Start Script
Boots up both FastAPI backend and React frontend.
"""

import subprocess
import sys
import os
import time
import signal

ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT, "backend")
FRONTEND_DIR = os.path.join(ROOT, "frontend")


def main():
    processes = []

    try:
        # 1. Start FastAPI backend
        print("\n🚀 Starting FastAPI backend on http://localhost:8000 ...")
        backend = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
            cwd=BACKEND_DIR,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0,
        )
        processes.append(backend)
        time.sleep(2)

        # 2. Start Vite dev server
        print("⚡ Starting React frontend on http://localhost:5173 ...")
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        frontend = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=FRONTEND_DIR,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0,
        )
        processes.append(frontend)

        print("\n✅ TSheet Viewer 2.0 is running!")
        print("   Backend:  http://localhost:8000")
        print("   Frontend: http://localhost:5173")
        print("   API Docs: http://localhost:8000/docs")
        print("\n   Press Ctrl+C to stop both servers.\n")

        # Wait for either process to exit
        while True:
            for p in processes:
                if p.poll() is not None:
                    print(f"\n⚠ Process exited with code {p.returncode}")
                    raise KeyboardInterrupt
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
        for p in processes:
            try:
                if os.name == "nt":
                    p.send_signal(signal.CTRL_BREAK_EVENT)
                else:
                    p.terminate()
            except Exception:
                pass
        for p in processes:
            try:
                p.wait(timeout=5)
            except Exception:
                p.kill()
        print("👋 Goodbye!")


if __name__ == "__main__":
    main()

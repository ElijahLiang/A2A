"""
兼容旧入口：PyInstaller / `uvicorn server:app`。
应用定义见 main.py。
"""

from main import app

__all__ = ["app"]

if __name__ == "__main__":
    import runpy

    runpy.run_module("main", run_name="__main__")

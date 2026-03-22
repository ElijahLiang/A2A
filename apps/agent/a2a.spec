# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec for A2A — bundles Python backend + built frontend into one executable

import sys
from pathlib import Path

block_cipher = None

# Collect hidden imports required by uvicorn / FastAPI at runtime
HIDDEN_IMPORTS = [
    # uvicorn internals
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.loops.asyncio",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.http.h11_impl",
    "uvicorn.protocols.http.httptools_impl",
    "uvicorn.protocols.websockets",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.protocols.websockets.websockets_impl",
    "uvicorn.protocols.websockets.wsproto_impl",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    # fastapi / starlette
    "fastapi",
    "starlette.routing",
    "starlette.staticfiles",
    "starlette.responses",
    # pydantic v2
    "pydantic",
    "pydantic.deprecated.class_validators",
    # openai
    "openai",
    "httpx",
    "anyio",
    "anyio.abc",
    "anyio._backends._asyncio",
    "h11",
]

# Include the built frontend dist/ folder as data
DATAS = [
    ("dist", "dist"),
]

a = Analysis(
    ["server.py"],
    pathex=[],
    binaries=[],
    datas=DATAS,
    hiddenimports=HIDDEN_IMPORTS,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="A2A",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,   # Keep console so users can see logs / set env vars
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)

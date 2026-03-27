"""
AES-256-GCM 加密存储用户 API Key。
Master Key 从环境变量读取，生产环境应使用 KMS。
"""

import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _get_master_key() -> bytes:
    raw = os.getenv("KEY_VAULT_MASTER_KEY", "dev_master_key_change_in_prod_32b")
    return raw.encode()[:32].ljust(32, b"\x00")


def encrypt_key(plaintext: str) -> str:
    """加密 API Key，返回 base64 编码的 nonce+ciphertext"""
    aesgcm = AESGCM(_get_master_key())
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ct).decode()


def decrypt_key(encoded: str) -> str:
    """解密，返回明文 API Key"""
    aesgcm = AESGCM(_get_master_key())
    raw = base64.b64decode(encoded.encode())
    nonce, ct = raw[:12], raw[12:]
    return aesgcm.decrypt(nonce, ct, None).decode()

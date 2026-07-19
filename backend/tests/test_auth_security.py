from datetime import timedelta

import jwt
import pytest

from app.core.security import create_token, decode_token, fingerprint_token


def test_access_and_refresh_tokens_are_not_interchangeable() -> None:
    access, _ = create_token("user-id", "access", timedelta(minutes=5))
    refresh, _ = create_token("user-id", "refresh", timedelta(days=1))

    assert decode_token(access, "access")["sub"] == "user-id"
    with pytest.raises(jwt.InvalidTokenError):
        decode_token(refresh, "access")
    with pytest.raises(jwt.InvalidTokenError):
        decode_token(access, "refresh")


def test_token_fingerprint_is_deterministic_and_hides_token() -> None:
    token = "segredo-do-refresh-token"

    fingerprint = fingerprint_token(token)

    assert fingerprint == fingerprint_token(token)
    assert token not in fingerprint
    assert len(fingerprint) == 64

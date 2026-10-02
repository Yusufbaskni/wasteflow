from fastapi.testclient import TestClient

from app.ana import app

client = TestClient(app)


def _login(username, password):
    response = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["token"]


def test_lots_require_session():
    assert client.get("/api/v1/lots").status_code == 401
    assert client.get("/health").json()["ok"] is True


def test_role_gates_audit_and_users():
    admin = _login("yusuf.baskan", "Istinye2026")
    operator = _login("operator", "Operator2026")
    assert client.get("/api/v1/audit", headers={"Authorization": f"Bearer {admin}"}).status_code == 200
    assert client.get("/api/v1/audit", headers={"Authorization": f"Bearer {operator}"}).status_code == 403
    blocked = client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {operator}"},
        json={"username": "yeni.kisi", "password": "Gizli1234", "name": "Yeni Kişi", "role": "Operatör"},
    )
    assert blocked.status_code == 403
    created = client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin}"},
        json={"username": "yeni.kisi", "password": "Gizli1234", "name": "Yeni Kişi", "role": "Operatör"},
    )
    assert created.status_code in {201, 409}


def test_admin_resets_forgotten_password():
    admin = _login("yusuf.baskan", "Istinye2026")
    operator = _login("operator", "Operator2026")
    denied = client.post(
        "/api/v1/users/operator/password",
        headers={"Authorization": f"Bearer {operator}"},
        json={"password": "Gecici1234"},
    )
    assert denied.status_code == 403
    changed = client.post(
        "/api/v1/users/operator/password",
        headers={"Authorization": f"Bearer {admin}"},
        json={"password": "Gecici1234"},
    )
    assert changed.status_code == 200
    assert client.get("/api/v1/lots", headers={"Authorization": f"Bearer {operator}"}).status_code == 401
    assert client.post("/api/v1/auth/login", json={"username": "operator", "password": "Operator2026"}).status_code == 401
    _login("operator", "Gecici1234")
    restored = client.post(
        "/api/v1/users/operator/password",
        headers={"Authorization": f"Bearer {admin}"},
        json={"password": "Operator2026"},
    )
    assert restored.status_code == 200
    _login("operator", "Operator2026")


def test_failed_login_is_rejected():
    response = client.post("/api/v1/auth/login", json={"username": "yusuf.baskan", "password": "yanlis-parola"})
    assert response.status_code == 401
    admin = _login("yusuf.baskan", "Istinye2026")
    audit = client.get("/api/v1/audit", headers={"Authorization": f"Bearer {admin}"})
    assert any(row["action"] == "LOGIN_FAIL" for row in audit.json())

## gemini

import pytest
from app import create_app
from app.extensions import db

@pytest.fixture
def app():
    """Tworzy instancję aplikacji w trybie testowym."""
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "JWT_SECRET_KEY": "test-secret-key"
    })

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Tworzy klienta testowego do wykonywania zapytań."""
    return app.test_client()
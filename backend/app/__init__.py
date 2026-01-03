import os
from flask import Flask
from flask_cors import CORS
from .db import init_app as init_db

def create_app(test_config=None):
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    
    # Configuration
    app.config.from_mapping(
        SECRET_KEY='dev',
        DATABASE=os.path.join(app.root_path, '..', 'intelliwheels.db'),
        UPLOAD_FOLDER=os.path.join(app.root_path, '..', 'uploads'),
        MAX_CONTENT_LENGTH=16 * 1024 * 1024,  # 16MB max upload
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # Ensure instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    # Ensure uploads folder exists
    try:
        os.makedirs(app.config['UPLOAD_FOLDER'])
    except OSError:
        pass

    # Initialize CORS with comprehensive settings
    CORS(app, 
         resources={r"/api/*": {"origins": "*"}},
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
         methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
         expose_headers=["Content-Type", "Authorization"])
    
    init_db(app)

    # Register Blueprints
    from .routes import cars, ai, system, auth, dealers, favorites, listings
    app.register_blueprint(cars.bp)
    app.register_blueprint(ai.bp)
    app.register_blueprint(system.bp)
    app.register_blueprint(auth.bp)
    app.register_blueprint(dealers.bp)
    app.register_blueprint(favorites.bp)
    app.register_blueprint(listings.bp)

    return app

# Expose app instance for 'gunicorn app:app'
app = create_app()

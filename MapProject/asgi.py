"""
ASGI config for MapProject project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'MapProject.settings')

# Initialize Django ASGI application early to ensure AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

import core_api.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": URLRouter(
        core_api.routing.websocket_urlpatterns
    ),
})

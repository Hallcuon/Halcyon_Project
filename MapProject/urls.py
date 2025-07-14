from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Підключаємо всі URL з нашого додатку core_api за префіксом /api/
    path('api/', include('core_api.urls')),
    
    # URL для отримання та оновлення JWT токенів
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Завжди обслуговуємо медіафайли в режимі розробки.
# У продакшені за це відповідатиме веб-сервер (наприклад, Nginx).
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
from django.urls import path, include
from rest_framework_nested import routers
from . import views

# Основний роутер
router = routers.DefaultRouter()
router.register(r'placemarks', views.PlacemarkViewSet, basename='placemark')
router.register(r'public-placemarks', views.PublicPlacemarkViewSet, basename='public-placemark')
router.register(r'anonymous-messages', views.AnonymousMessageViewSet, basename='anonymous-message')
router.register(r'beacons', views.BeaconViewSet, basename='beacon')
router.register(r'beacon-content', views.BeaconContentViewSet, basename='beacon-content')
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'user-stats', views.UserStatsViewSet, basename='user-stats')
router.register(r'profile', views.ProfileViewSet, basename='profile')
router.register(r'online-users', views.OnlineUsersViewSet, basename='online-users')
router.register(r'chat/messages', views.ChatMessageViewSet, basename='chat-message')
router.register(r'community-progress', views.CommunityProgressView, basename='community-progress')
router.register(r'leaderboard', views.LeaderboardView, basename='leaderboard') # <-- ОСЬ ЦЕЙ РЯДОК ВИПРАВЛЯЄ ПОМИЛКУ

# Вкладений роутер для коментарів до міток
placemarks_router = routers.NestedSimpleRouter(router, r'placemarks', lookup='placemark')
placemarks_router.register(r'comments', views.CommentViewSet, basename='placemark-comments')


urlpatterns = [
    path('', include(router.urls)),
    path('', include(placemarks_router.urls)),
]
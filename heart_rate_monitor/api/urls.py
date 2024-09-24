from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HeartRateViewSet

router = DefaultRouter()
router.register(r'heart-rate', HeartRateViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
from django.utils import timezone
from .models import Profile

class UpdateLastSeenMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Оновлюємо час останньої активності після того, як view відпрацював.
        # Це гарантує, що ми оновлюємо статус тільки для успішних запитів,
        # і не затримуємо відповідь користувачу.
        if hasattr(request, "user") and request.user.is_authenticated:
            # Використання update() є більш ефективним, оскільки не викликає сигнали save()
            Profile.objects.filter(user=request.user).update(last_seen=timezone.now())
            
        return response
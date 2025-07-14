import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import ChatMessage
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

# Встановлюємо ліміт на кількість повідомлень в історії чату
CHAT_HISTORY_LIMIT = 20

@database_sync_to_async
def get_user_from_token(token_key):
    try:
        token = AccessToken(token_key)
        user_id = token.get('user_id')
        # Використовуємо select_related для оптимізації запиту до профілю
        return User.objects.select_related('profile').get(id=user_id)
    except (InvalidToken, TokenError, User.DoesNotExist):
        return None

@database_sync_to_async
def save_and_prune_message(user, text):
    """
    Зберігає нове повідомлення і, якщо потрібно, видаляє найстаріше,
    щоб підтримувати ліміт історії.
    """
    # 1. Створюємо нове повідомлення
    message = ChatMessage.objects.create(author=user, text=text)

    # 2. Перевіряємо, чи не перевищено ліміт
    message_count = ChatMessage.objects.count()
    if message_count > CHAT_HISTORY_LIMIT:
        # 3. Знаходимо і видаляємо найстаріше повідомлення
        # order_by('timestamp').first() - найефективніший спосіб знайти найстаріше
        oldest_message = ChatMessage.objects.order_by('timestamp').first()
        if oldest_message:
            oldest_message.delete()
    
    return message

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope['query_string'].decode()
        query_params = parse_qs(query_string)
        token_key = query_params.get('token', [None])[0]

        if not token_key:
            await self.close()
            return

        self.user = await get_user_from_token(token_key)

        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        # Зберігаємо host та scheme для побудови повних URL для аватара
        self.host = dict(self.scope['headers']).get(b'host', b'').decode()
        self.scheme = "https" if self.scope.get("scheme") == "wss" else "http"

        self.room_group_name = 'global_chat'

        # Приєднатися до групи чату
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    # Отримати повідомлення від WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_text = text_data_json['message']

        # Зберігаємо повідомлення та обрізаємо історію
        message = await save_and_prune_message(self.user, message_text)

        # Будуємо повний, абсолютний URL для аватара
        avatar_url = f"{self.scheme}://{self.host}{self.user.profile.avatar.url}"

        # Надіслати повідомлення у групу
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'id': message.id,
                'message': message_text,
                'author': self.user.username,
                'avatar_url': avatar_url,
                'author_chat_color': self.user.profile.chat_color, # Додаємо колір
                'timestamp': str(message.timestamp)
            }
        )

    # Отримати повідомлення від групи
    async def chat_message(self, event):
        # Надіслати повідомлення у WebSocket
        await self.send(text_data=json.dumps(event))

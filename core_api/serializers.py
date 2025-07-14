from rest_framework import serializers
import re
from .models import Placemark, Beacon, BeaconContent, AnonymousMessage, ActivatedBeacon, Comment, Profile, ChatMessage, FoundAnonymousMessage
from django.contrib.auth.models import User

class PlacemarkSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='owner.username')
    class Meta:
        model = Placemark
        fields = ['id', 'title', 'description', 'latitude', 'longitude', 'user']

class AnonymousMessageSerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source='owner.username')
    class Meta:
        model = AnonymousMessage
        fields = ['id', 'title', 'body', 'latitude', 'longitude', 'owner_username']
        read_only_fields = ['id', 'latitude', 'longitude', 'owner_username']

class BeaconContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BeaconContent
        fields = ['id', 'text_content', 'created_at']

class BeaconSerializer(serializers.ModelSerializer):
    content_items = BeaconContentSerializer(many=True, read_only=True)
    is_activated = serializers.SerializerMethodField()
    activated_by = serializers.SerializerMethodField()
    activation_date = serializers.SerializerMethodField()

    class Meta:
        model = Beacon
        fields = ['id', 'name', 'description', 'latitude', 'longitude', 'content_items', 'is_activated', 'activated_by', 'activation_date']

    def get_is_activated(self, obj):
        # Повертає True, якщо цей маяк був активований хоча б один раз
        return ActivatedBeacon.objects.filter(beacon=obj).exists()

    def get_first_activation(self, obj):
        # Допоміжний метод, щоб уникнути повторних запитів до БД
        if not hasattr(obj, '_first_activation'):
            obj._first_activation = ActivatedBeacon.objects.filter(beacon=obj).order_by('activated_at').first()
        return obj._first_activation

    def get_activated_by(self, obj):
        first_activation = self.get_first_activation(obj)
        return first_activation.user.username if first_activation else None

    def get_activation_date(self, obj):
        first_activation = self.get_first_activation(obj)
        return first_activation.activated_at if first_activation else None

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_username(self, value):
        """
        Додає валідацію, щоб заборонити конфліктні символи в іменах користувачів.
        Дозволено: літери, цифри, дефіси, підкреслення.
        Заборонено: крапки, коми, пробіли та інші спецсимволи.
        """
        if re.search(r'[^a-zA-Z0-9_-]', value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, hyphens (-), and underscores (_)."
            )
        return value

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class UserStatsSerializer(serializers.ModelSerializer):
    """
    Серіалізатор для ендпоінта /api/user-stats/.
    Збирає всю необхідну статистику в одному місці.
    """
    username = serializers.CharField(source='user.username', read_only=True)
    avatar_url = serializers.CharField(source='avatar.url', read_only=True)
    xp_for_next_level = serializers.SerializerMethodField()
    
    placemarks_count = serializers.SerializerMethodField()
    activated_beacons_count = serializers.SerializerMethodField()
    sent_messages_count = serializers.SerializerMethodField()
    found_messages_count = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'username', 'avatar_url', 'chat_color', 'level', 'current_xp', 'xp_for_next_level',
            'placemarks_count', 'activated_beacons_count', 'sent_messages_count', 'found_messages_count'
        ]
    
    def get_xp_for_next_level(self, profile): return profile.get_xp_for_next_level()
    def get_placemarks_count(self, profile): return Placemark.objects.filter(owner=profile.user).count()
    def get_activated_beacons_count(self, profile): return ActivatedBeacon.objects.filter(user=profile.user).count()
    def get_sent_messages_count(self, profile): return AnonymousMessage.objects.filter(owner=profile.user).count()
    def get_found_messages_count(self, profile): return FoundAnonymousMessage.objects.filter(user=profile.user).count()

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['avatar', 'chat_color']
    # Прибираємо to_representation, щоб серіалізатор повертав відносний URL (/media/...),
    # який буде оброблено Vite proxy.

class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_avatar_url = serializers.SerializerMethodField()
    author_chat_color = serializers.CharField(source='author.profile.chat_color', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'placemark', 'author', 'author_username', 'author_avatar_url', 'author_chat_color', 'text', 'created_at']
        read_only_fields = ['author', 'placemark']

    def get_author_avatar_url(self, obj):
        request = self.context.get('request')
        profile, created = Profile.objects.get_or_create(user=obj.author)
        if request:
            return request.build_absolute_uri(profile.avatar.url)
        return profile.avatar.url # Fallback to relative URL

class ChatMessageSerializer(serializers.ModelSerializer):
    author = serializers.CharField(source='author.username', read_only=True)
    avatar_url = serializers.SerializerMethodField()
    author_chat_color = serializers.CharField(source='author.profile.chat_color', read_only=True)


    class Meta:
        model = ChatMessage
        fields = ['id', 'author', 'avatar_url', 'author_chat_color', 'text', 'timestamp']

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.author.profile and obj.author.profile.avatar:
            if request:
                return request.build_absolute_uri(obj.author.profile.avatar.url)
            return obj.author.profile.avatar.url # Fallback
        return None
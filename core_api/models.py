import os
from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from PIL import Image


# Допоміжна функція для генерації шляху до аватара
def user_avatar_path(instance, filename):
    # Файл буде завантажено в MEDIA_ROOT/avatars/username.<ext>
    ext = filename.split('.')[-1]
    new_filename = f'{instance.user.username}.{ext}'
    return os.path.join('avatars', new_filename)

# Create your models here.
class MapPoint(models.Model):
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        validators=[MinValueValidator(-90.0), MaxValueValidator(90.0)]
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        validators=[MinValueValidator(-180.0), MaxValueValidator(180.0)]
    )

    class Meta:
        abstract = True

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.ImageField(default='avatars/DefaultProfile.png', upload_to=user_avatar_path)
    last_seen = models.DateTimeField(default=timezone.now)
    chat_color = models.CharField(max_length=7, default='#FFFFFF', blank=True)
    level = models.IntegerField(default=1)
    current_xp = models.IntegerField(default=0)


    def __str__(self):
        return f'{self.user.username} Profile'
    
    def get_xp_for_next_level(self):
        """
        Повертає кількість досвіду, необхідну для наступного рівня.
        Рівень 2: 100 XP, Рівень 3: 200 XP, і т.д.
        """
        return self.level * 100

    def add_xp(self, amount):
        """
        Додає досвід користувачу та перевіряє, чи не досягнуто нового рівня.
        Може обробляти кілька підвищень рівня за раз.
        """
        self.current_xp += amount
        xp_needed = self.get_xp_for_next_level()

        while self.current_xp >= xp_needed:
            self.current_xp -= xp_needed
            self.level += 1
            xp_needed = self.get_xp_for_next_level()
        
        self.save()
    def save(self, *args, **kwargs):
        old_avatar_path = None
        # Перевіряємо, чи це оновлення існуючого об'єкта
        if self.pk:
            try:
                old_profile = Profile.objects.get(pk=self.pk)
                # Якщо аватар змінився і старий аватар не є дефолтним
                if old_profile.avatar and old_profile.avatar.name != self.avatar.name and old_profile.avatar.name != 'avatars/DefaultProfile.png':
                    old_avatar_path = old_profile.avatar.path
            except Profile.DoesNotExist:
                pass # Об'єкт новий, старого файлу немає

        super().save(*args, **kwargs)

        # Видаляємо старий файл після того, як новий успішно збережено
        if old_avatar_path and os.path.isfile(old_avatar_path):
            os.remove(old_avatar_path)

        # Стискаємо та змінюємо розмір нового зображення
        if self.avatar and os.path.isfile(self.avatar.path):
            with Image.open(self.avatar.path) as img:
                if img.height > 300 or img.width > 300:
                    output_size = (300, 300)
                    img.thumbnail(output_size)
                    img.save(self.avatar.path, optimize=True, quality=85)

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    instance.profile.save()

class Placemark(MapPoint):
    title = models.CharField(max_length=200)
    description = models.TextField(blank = True)
    owner = models.ForeignKey(User, related_name='placemarks', on_delete=models.CASCADE)
    # Можливо, захочеш додати поле для типу мітки, щоб розрізняти звичайні та "пасхалки"
    # is_easter_egg = models.BooleanField(default=False)

    def __str__(self):
        return self.title or f"Placemark at ({self.latitude}, {self.longitude})"

class Beacon(MapPoint):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    # created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True) # Якщо будеш додавати користувачів

    def __str__(self):
        return self.name

class BeaconContent(models.Model):
    beacon = models.ForeignKey(Beacon, related_name='content_items', on_delete=models.CASCADE)
    text_content = models.TextField(blank=True)
    # image_url = models.URLField(blank=True, null=True) # Для посилань на зображення
    # created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True) # Якщо будеш додавати користувачів
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Content for {self.beacon.name} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class AnonymousMessage(MapPoint):
    title = models.CharField(max_length=100)
    body = models.TextField(max_length=1000)
    owner = models.ForeignKey(User, related_name='sent_anonymous_messages', on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class ActivatedBeacon(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    beacon = models.ForeignKey(Beacon, on_delete=models.CASCADE)
    activated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Кожен користувач може активувати кожен маяк лише один раз
        unique_together = ('user', 'beacon')

    def __str__(self):
        return f"{self.user.username} activated {self.beacon.name}"

class Comment(models.Model):
    placemark = models.ForeignKey(Placemark, related_name='comments', on_delete=models.CASCADE)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Comment by {self.author.username} on {self.placemark.title}'

class FoundAnonymousMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.ForeignKey(AnonymousMessage, on_delete=models.CASCADE)
    found_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'message')

    def __str__(self):
        return f"{self.user.username} found {self.message.title}"

class ChatMessage(models.Model):
    author = models.ForeignKey(User, related_name='chat_messages', on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f'Message by {self.author.username} at {self.timestamp}'

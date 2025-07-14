from django.contrib import admin

# Register your models here.
from .models import Placemark, Beacon, BeaconContent, AnonymousMessage, ActivatedBeacon

@admin.register(Placemark)
class PlacemarkAdmin(admin.ModelAdmin):
    list_display = ('title', 'latitude', 'longitude', 'description')
    search_fields = ('title', 'description')

@admin.register(Beacon)
class BeaconAdmin(admin.ModelAdmin):
    list_display = ('name', 'latitude', 'longitude', 'description')
    search_fields = ('name', 'description')

@admin.register(BeaconContent)
class BeaconContentAdmin(admin.ModelAdmin):
    list_display = ('beacon', 'text_content', 'created_at')
    list_filter = ('beacon', 'created_at') # Додамо фільтри для зручності
    search_fields = ('text_content',)

@admin.register(AnonymousMessage)
class AnonymousMessageAdmin(admin.ModelAdmin):
    list_display = ('title', 'latitude', 'longitude', 'created_at')

@admin.register(ActivatedBeacon)
class ActivatedBeaconAdmin(admin.ModelAdmin):
    list_display = ('user', 'beacon', 'activated_at')
    list_filter = ('beacon', 'user')
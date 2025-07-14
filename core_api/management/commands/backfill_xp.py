from django.core.management.base import BaseCommand
from django.db import transaction
from core_api.models import Profile, ActivatedBeacon, FoundAnonymousMessage
from collections import defaultdict

class Command(BaseCommand):
    help = 'Backfills XP for all users based on their past actions (activated beacons and found messages).'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting XP backfill process...'))

        BEACON_XP = 50
        MESSAGE_XP = 25

        # Скидаємо досвід усіх користувачів, щоб уникнути дублювання при повторному запуску
        self.stdout.write('Resetting all user profiles to Level 1, 0 XP before backfilling...')
        Profile.objects.all().update(level=1, current_xp=0)

        # Використовуємо defaultdict для зручного накопичення XP
        xp_to_add = defaultdict(int)

        # Розраховуємо XP за активовані маяки
        activated_beacons = ActivatedBeacon.objects.select_related('user').all()
        for activation in activated_beacons:
            if activation.user:
                xp_to_add[activation.user.id] += BEACON_XP
        
        self.stdout.write(f'Calculated XP for {len(activated_beacons)} beacon activations.')

        # Розраховуємо XP за знайдені повідомлення
        found_messages = FoundAnonymousMessage.objects.select_related('user', 'message').all()
        for found in found_messages:
            # Переконуємось, що користувач не знайшов власне повідомлення
            if found.user and found.user != found.message.owner:
                xp_to_add[found.user.id] += MESSAGE_XP

        self.stdout.write(f'Calculated XP for {len(found_messages)} found messages.')

        if not xp_to_add:
            self.stdout.write(self.style.WARNING('No past actions found to grant XP for. Exiting.'))
            return

        # Застосовуємо розрахований досвід до кожного користувача
        users_to_update_ids = xp_to_add.keys()
        profiles = Profile.objects.filter(user_id__in=users_to_update_ids)

        updated_count = 0
        for profile in profiles:
            total_xp = xp_to_add[profile.user_id]
            if total_xp > 0:
                self.stdout.write(f'Adding {total_xp} XP to user: {profile.user.username}')
                # Метод add_xp сам обробляє підвищення рівня та зберігає профіль
                profile.add_xp(total_xp)
                updated_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully updated XP for {updated_count} users.'))
        self.stdout.write(self.style.SUCCESS('XP backfill process complete!'))

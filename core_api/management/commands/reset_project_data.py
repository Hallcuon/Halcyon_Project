from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth.models import User
from core_api.models import (
    Placemark,
    Beacon,
    ActivatedBeacon,
    BeaconContent,
    AnonymousMessage,
    FoundAnonymousMessage,
    Comment,
    ChatMessage,
    Profile,
)

class Command(BaseCommand):
    help = 'Deletes all user-generated data to reset the project to a clean state.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-input',
            '--noinput',
            action='store_false',
            dest='interactive',
            help='Tells Django to NOT prompt the user for input of any kind.',
        )
        parser.add_argument(
            '--keep-superuser',
            type=str,
            help='Specify the username of a superuser to keep. Their profile and stats will be reset.'
        )

    def handle(self, *args, **options):
        interactive = options['interactive']
        keep_superuser_username = options['keep_superuser']
        verbosity = options['verbosity']

        if interactive:
            confirm = input("""
You have requested a database reset.
This will IRREVERSIBLY DESTROY all data from the project tables.

Are you sure you want to do this?

Type 'yes' to continue, or 'no' to cancel: """)
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.ERROR("Database reset cancelled."))
                return

        self.stdout.write("Starting database reset...")

        # Delete all data from these models
        models_to_delete = [
            Placemark, Beacon, ActivatedBeacon, BeaconContent,
            AnonymousMessage, FoundAnonymousMessage, Comment, ChatMessage
        ]
        for model in models_to_delete:
            count, _ = model.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(f'Deleted {count} {model.__name__} objects.'))

        # Delete all users and profiles except the specified superuser
        users_query = User.objects.all()
        if keep_superuser_username:
            self.stdout.write(f"Excluding superuser '{keep_superuser_username}' from deletion.")
            users_query = users_query.exclude(username=keep_superuser_username, is_superuser=True)
        else:
            self.stdout.write(self.style.WARNING("No superuser specified to keep. All users and profiles will be deleted."))

        # Profiles are deleted via cascade when users are deleted.
        user_count, _ = users_query.delete()
        self.stdout.write(self.style.SUCCESS(f'Deleted {user_count} User objects (and their profiles).'))

        # Reset the profile of the kept superuser
        if keep_superuser_username:
            try:
                superuser_profile = Profile.objects.get(user__username=keep_superuser_username)
                superuser_profile.level = 1
                superuser_profile.current_xp = 0
                superuser_profile.save()
                self.stdout.write(self.style.SUCCESS(f"Reset level and XP for superuser '{keep_superuser_username}'."))
            except Profile.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"Could not find profile for superuser '{keep_superuser_username}' to reset stats."))

        self.stdout.write(self.style.SUCCESS("Database reset complete."))
        self.stdout.write("-" * 20)
        self.stdout.write("Recreating initial beacons...")
        # Викликаємо команду create_beacons, щоб створити 100 нових маяків
        call_command('create_beacons', 100, verbosity=verbosity)
        self.stdout.write(self.style.SUCCESS("Project reset and re-initialization complete!"))
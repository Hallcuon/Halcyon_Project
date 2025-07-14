import random
from django.core.management.base import BaseCommand
from core_api.models import Beacon, ActivatedBeacon
from django.db import connection

from global_land_mask import globe

class Command(BaseCommand):
    help = 'Deletes all existing beacons and creates a specified number of new ones on any land.'

    def add_arguments(self, parser):
        parser.add_argument('count', type=int, help='The number of beacons to create', default=100, nargs='?')

    def handle(self, *args, **kwargs):
        count = kwargs['count']
        verbosity = kwargs['verbosity']

        self.stdout.write('Deleting existing beacons and activation progress...')
        Beacon.objects.all().delete()
        ActivatedBeacon.objects.all().delete()

        # Скидуємо лічильники ID для таблиць, щоб нові записи починались з 1
        self.stdout.write('Resetting database ID counters...')
        with connection.cursor() as cursor:
            db_vendor = connection.vendor
            beacon_table = Beacon._meta.db_table
            activated_beacon_table = ActivatedBeacon._meta.db_table

            if db_vendor == 'sqlite':
                cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{beacon_table}';")
                cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{activated_beacon_table}';")
            elif db_vendor == 'postgresql':
                cursor.execute(f"ALTER SEQUENCE {beacon_table}_id_seq RESTART WITH 1;")
                cursor.execute(f"ALTER SEQUENCE {activated_beacon_table}_id_seq RESTART WITH 1;")
            elif db_vendor == 'mysql':
                cursor.execute(f"ALTER TABLE {beacon_table} AUTO_INCREMENT = 1;")
                cursor.execute(f"ALTER TABLE {activated_beacon_table} AUTO_INCREMENT = 1;")

        self.stdout.write(f'Creating {count} new beacons on any land...')
        self.stdout.write('This may take a moment as it finds valid locations.')
        self.stdout.flush()

        beacons_to_create = []
        # We use a high attempt limit to avoid infinite loops in case valid locations are hard to find.
        max_attempts = count * 200
        attempts = 0

        while len(beacons_to_create) < count and attempts < max_attempts:
            attempts += 1
            lat = random.uniform(-90.0, 90.0)
            lon = random.uniform(-180.0, 180.0)

            # Check if the coordinate is on land
            if globe.is_land(lat, lon):
                beacons_to_create.append(
                    Beacon(name=f'Beacon #{len(beacons_to_create) + 1}', latitude=lat, longitude=lon)
                )
                # Provide visual feedback during the process
                if verbosity == 1:
                    self.stdout.write('.', ending='')
                    if len(beacons_to_create) % 80 == 0:
                        self.stdout.write('') # Newline after 80 dots
                    self.stdout.flush()

                if verbosity > 1:
                    self.stdout.write(self.style.SUCCESS(f"OK: Found land at ({lat:.2f}, {lon:.2f}). Adding beacon {len(beacons_to_create)}/{count}."))
            elif verbosity > 1:
                self.stdout.write(self.style.WARNING(f"SKIP: Point ({lat:.2f}, {lon:.2f}) is in water. Skipping."))

        if verbosity == 1 and len(beacons_to_create) > 0:
            self.stdout.write('') # Final newline for the progress dots

        if len(beacons_to_create) < count:
            self.stdout.write(self.style.WARNING(f'\nWarning: Only created {len(beacons_to_create)} out of {count} requested beacons after {max_attempts} attempts.'))

        if beacons_to_create:
            Beacon.objects.bulk_create(beacons_to_create)
            self.stdout.write(self.style.SUCCESS(f'\nSuccessfully created {len(beacons_to_create)} beacons.'))
        else:
            self.stdout.write(self.style.WARNING('\nNo beacons were created.'))

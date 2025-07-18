# Generated by Django 5.2.3 on 2025-07-10 23:07

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core_api', '0004_anonymousmessage'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ActivatedBeacon',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('activated_at', models.DateTimeField(auto_now_add=True)),
                ('beacon', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core_api.beacon')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('user', 'beacon')},
            },
        ),
    ]

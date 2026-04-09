import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from leads.models import Meeting

count = 0
for m in Meeting.objects.all():
    if ' ' in m.google_meet_link:
        m.google_meet_link = m.google_meet_link.replace(' ', '-')
        m.save()
        count += 1

print(f"Fixed {count} broken meeting links!")

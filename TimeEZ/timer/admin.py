from django.contrib import admin

# Register your models here.

from .models import Time,User

admin.site.register(User)
admin.site.register(Time)
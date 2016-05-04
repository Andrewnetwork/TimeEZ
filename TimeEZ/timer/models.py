# models.py
# Andrew Ribeiro
# May 3, 2016

from __future__ import unicode_literals

from django.db import models

# Create your models here.

# user(uid, username, passwordHash, email )
# time(uid, time_start, time_end )

class User(models.Model):
    username      = models.CharField(max_length=50)
    password_hash = models.CharField(max_length=32)
    email         = models.CharField(max_length=100)

class Time(models.Model):
    uid        = models.ForeignKey(User,on_delete=models.CASCADE)
    time_start = models.DateTimeField(auto_now=False)
    time_end   = models.DateTimeField(auto_now=False)

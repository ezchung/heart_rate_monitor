from django.db import models

# Create your models here.
class HeartRateReading(models.Model):
    timestamp = models.DateTimeField()
    heart_rate = models.FloatField()

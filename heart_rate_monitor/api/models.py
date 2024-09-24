from django.db import models

# Create your models here.
class HeartRateReading(models.Model):
    timestamp = models.DateTimeField()
    heart_rate = models.FloatField()

# timestamp: A DateTimeField to store the date and time of the reading.
# heart_rate: A FloatField to store the heart rate value.
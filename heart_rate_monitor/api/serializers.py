from rest_framework import serializers
from .models import HeartRateReading

class HeartRateReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeartRateReading
        fields = ['timestamp', 'heart_rate']
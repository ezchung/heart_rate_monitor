from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.utils.timezone import make_aware
from django.utils import timezone
import csv
import io
from datetime import datetime, timedelta
from .models import HeartRateReading
from .serializers import HeartRateReadingSerializer

class HeartRateViewSet(viewsets.ModelViewSet):
    queryset = HeartRateReading.objects.all()
    serializer_class = HeartRateReadingSerializer

    @action(detail=False, methods=['POST'])
    def upload_csv(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file uploaded'}, status=400)

        path = default_storage.save('tmp/heart_rate.csv', ContentFile(file.read()))
        
        try:
            with default_storage.open(path, 'r') as csv_file:
                csv_reader = csv.reader(csv_file)
                next(csv_reader)  # Skip header row
                for row in csv_reader:
                    naive_timestamp = datetime.strptime(row[0], '%Y-%m-%d %H:%M:%S')
                    aware_timestamp = make_aware(naive_timestamp)
                    heart_rate = float(row[1]) if row[1] else 0
                    HeartRateReading.objects.create(timestamp=aware_timestamp, heart_rate=heart_rate)
        except Exception as e:
            return Response({'error': f'Error processing CSV: {str(e)}'}, status=400)
        finally:
            default_storage.delete(path)

        return Response({'message': 'Data uploaded successfully'})

    @action(detail=False, methods=['GET'])
    def latest_readings(self, request):
        time_range = request.query_params.get('time_range', 'full')
        print(f"Time range: {time_range}")

        # Get the earliest and latest timestamps in the database
        earliest_reading = HeartRateReading.objects.earliest('timestamp')
        latest_reading = HeartRateReading.objects.latest('timestamp')
        print(f"Earliest reading: {earliest_reading.timestamp}")
        print(f"Latest reading: {latest_reading.timestamp}")

        if time_range == 'full':
            readings = HeartRateReading.objects.all().order_by('timestamp')
        else:
            try:
                minutes = int(time_range)
                time_threshold = latest_reading.timestamp - timedelta(minutes=minutes)
                print(f"Time threshold: {time_threshold}")
                # what is the range from 11 to 
                readings = HeartRateReading.objects.filter(timestamp__gte=time_threshold).order_by('timestamp')
                print(f"Number of readings: {readings.count()}")
                print(readings, "###################### try try ###################")
                # Print the first few filtered readings for debugging
                # for reading in readings:
                #     print(f"Reading timestamp: {reading.timestamp}, heart rate: {reading.heart_rate}")
                
            except ValueError:
                return Response({'error': 'Invalid time range'}, status=400)

        limit = int(request.query_params.get('limit', 100000))
        # readings = readings[:limit]
        
        serializer = self.get_serializer(readings, many=True)
        return Response(serializer.data)
"""
TODO Here 
need to create a function that takes the last 5 minutes of csv or last hour and breaks it up
options will be 5minutes, 15minutes, 30minutes, 1hour, or all together
Can be displayed using:
5minutes can split into each minute
30minutes to 5 minutes on grah
1hr to 10minutes
all together will be total time divided by 10
"""
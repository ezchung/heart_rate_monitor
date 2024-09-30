from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.utils.timezone import make_aware
import csv
import io
from datetime import datetime
from .models import HeartRateReading
from .serializers import HeartRateReadingSerializer

import pdb

class HeartRateViewSet(viewsets.ModelViewSet):
    queryset = HeartRateReading.objects.all()
    serializer_class = HeartRateReadingSerializer

    @action(detail=False, methods=['POST'])
    def upload_csv(self, request):
        file = request.FILES.get('file')
        print("File: ",file)
        if not file:
            return Response({'error': 'No file uploaded'}, status=400)

        # Save the file temporarily
        path = default_storage.save('tmp/heart_rate.csv', ContentFile(file.read()))
        
        try:
            with default_storage.open(path, 'r') as csv_file:
                csv_reader = csv.reader(csv_file)
                next(csv_reader)  # Skip header row
                for row in csv_reader:
                    naive_timestamp = datetime.strptime(row[0], '%Y-%m-%d %H:%M:%S')
                    aware_timestamp = make_aware(naive_timestamp);
                    # creates a naive datetime object first, then uses `make_aware` to convert it to a timezone-aware datetime object.
                    # print(timestamp, ": this is timestap", row);
                    heart_rate = float(row[1]) if row[1] else 0
                    if(not heart_rate): print("heartrate error", heart_rate)
                    HeartRateReading.objects.create(timestamp=aware_timestamp, heart_rate=heart_rate)
        except Exception as e:
            return Response({'error': f'Error processing CSV: {str(e)}'}, status=400)
        finally:
            default_storage.delete(path)

        return Response({'message': 'Data uploaded successfully'})

    @action(detail=False, methods=['GET'])
    def latest_readings(self, request):
        limit = int(request.query_params.get('limit', 100))
        readings = HeartRateReading.objects.order_by('-timestamp')[:limit]
        serializer = self.get_serializer(readings, many=True)
        return Response(serializer.data)
    
"""
TODO Here 
Fix error message 
  File "/home/ezray/personal_proj/Pine_Clothing_Tech/HR_monitor/heart_rate_monitor/venv/lib/python3.8/site-packages/rest_framework/views.py", line 480, in raise_uncaught_exception
    raise exc
  File "/home/ezray/personal_proj/Pine_Clothing_Tech/HR_monitor/heart_rate_monitor/venv/lib/python3.8/site-packages/rest_framework/views.py", line 506, in dispatch
    response = handler(request, *args, **kwargs)
  File "/home/ezray/personal_proj/Pine_Clothing_Tech/HR_monitor/heart_rate_monitor/api/views.py", line 39, in upload_csv
    heart_rate = float(row[1])
ValueError: could not convert string to float: ''
Think the error suggests that there's an empty string in the heart rate column of your CSV file
in these cases, we need to make it zero so that there is a red dot at that location in the graph

many error messages when uploading. look in terminal

need to create a function that takes the last 5 minutes of csv or last hour and breaks it up
options will be 5minutes, 15minutes, 30minutes, 1hour, or all together
Can be displayed using:
5minutes can split into each minute
30minutes to 5 minutes on grah
1hr to 10minutes
all together will be total time divided by 10
"""
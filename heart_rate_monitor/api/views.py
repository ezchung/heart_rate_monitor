from django.shortcuts import render

# Create your views here.
# views.py
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
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
                    timestamp = datetime.strptime(row[0], '%Y-%m-%d %H:%M:%S')
                    print(timestamp, ": this is timestap", row);
                    heart_rate = float(row[1])
                    HeartRateReading.objects.create(timestamp=timestamp, heart_rate=heart_rate)
        finally:
            default_storage.delete(path)

        return Response({'message': 'Data uploaded successfully'})

    @action(detail=False, methods=['GET'])
    def latest_readings(self, request):
        limit = int(request.query_params.get('limit', 100))
        readings = HeartRateReading.objects.order_by('-timestamp')[:limit]
        serializer = self.get_serializer(readings, many=True)
        return Response(serializer.data)
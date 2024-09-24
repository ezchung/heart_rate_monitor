import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import axios from 'axios';
import { Button, Container, Typography, Box } from '@mui/material';

const API_URL = 'http://localhost:8000/api/heart-rate/';

function App() {
  const [data, setData] = useState([]);
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Fetch data every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}latest_readings/`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_URL}upload_csv/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('File uploaded successfully!');
      fetchData();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    }
  };

  const detectAnomalies = (data) => {
    const threshold = 20; // BPM change threshold for anomaly
    return data.map((reading, index) => {
      if (index === 0) return { ...reading, isAnomaly: false };
      const prevReading = data[index - 1];
      const bpmChange = Math.abs(reading.heart_rate - prevReading.heart_rate);
      return { ...reading, isAnomaly: bpmChange > threshold };
    });
  };

  const processedData = detectAnomalies(data);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Real-Time Heart Rate Monitor
      </Typography>
      <Box mb={2}>
        <input type="file" onChange={handleFileChange} accept=".csv" />
        <Button variant="contained" color="primary" onClick={handleUpload}>
          Upload CSV
        </Button>
      </Box>
      <LineChart width={800} height={400} data={processedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="heart_rate" stroke="#8884d8" dot={false} />
        {processedData.map((reading, index) => 
          reading.isAnomaly && (
            <Line
              key={index}
              type="monotone"
              dataKey="heart_rate"
              data={[reading]}
              stroke="red"
              dot={{ r: 5 }}
            />
          )
        )}
      </LineChart>
    </Container>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { Button, Container, Typography, Box } from '@mui/material';

const API_URL = 'http://localhost:8080/api/heart-rate/';

function formatTimestamp(timestamp) {
  // Assuming the timestamp is in the format "YYYY-MM-DD HH:MM:SS"
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function App() {
  const [data, setData] = useState([]);
  const [file, setFile] = useState(null);
  const [chartDate, setChartDate] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}latest_readings/`);
      const processedData = detectAnomalies(response.data);
      setData(processedData);
      if (processedData.length > 0) {
        setChartDate(processedData[0].timestamp.split(' ')[0]); // Extract date part
      }
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
    const threshold = 20;
    return data.map((reading, index) => {
      if (index === 0) return { ...reading, isAnomaly: false };
      const prevReading = data[index - 1];
      const bpmChange = Math.abs(reading.heart_rate - prevReading.heart_rate);
      return { ...reading, isAnomaly: bpmChange > threshold };
    });
  };

  const CustomizedDot = (props) => {
    const { cx, cy, payload } = props;
    if (payload.isAnomaly) {
      return <circle cx={cx} cy={cy} r={4} fill="red" />;
    }
    return null;
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Real-Time Heart Rate Monitor
      </Typography>
      {/* <Typography variant="subtitle1" gutterBottom>
        Date: {chartDate}
      </Typography> */}
      <Box mb={2}>
        <input type="file" onChange={handleFileChange} accept=".csv" />
        <Button variant="contained" color="primary" onClick={handleUpload}>
          Upload CSV
        </Button>
      </Box>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            // tickFormatter={formatTimestamp} //this is where the presentation isnt good 
            interval="preserveStartEnd"
          />
          <YAxis />
          <Tooltip 
            labelFormatter={(label) => label} // Keep original timestamp format
            formatter={(value, name) => [value, name === 'heart_rate' ? 'Heart Rate' : name]} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="heart_rate" 
            stroke="#8884d8" 
            dot={<CustomizedDot />}
          />
        </LineChart>
      </ResponsiveContainer>
    </Container>
  );
}

export default App;

/**
 * TODO
 * Need to give option of seeing full timescale
 * Need to change yaxis labels
 */
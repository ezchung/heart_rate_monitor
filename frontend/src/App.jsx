import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { Button, Container, Typography, Box, Select, MenuItem, FormControl, InputLabel, Paper, List, ListItem, ListItemText } from '@mui/material';


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
  const [timeRange, setTimeRange] = useState('full');
  const [anomalies, setAnomalies] = useState([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}latest_readings/`, {
        params: { time_range: timeRange }
      });
      const processedData = detectAnomalies(response.data);
      setData(processedData);
      setAnomalies(processedData.filter(reading => reading.isAnomaly));
      if (processedData.length > 0) {
        setChartDate(processedData[0].timestamp.split(' ')[0]); // Extract date part
        // console.log(chartDate);
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

  const detectAnomalies = (data) => { //may need to fix
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

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleTimeClick = () => {
    fetchData();
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Real-Time Heart Rate Monitor
      </Typography>
      {/* <Typography variant="subtitle1" gutterBottom>
        Date: {chartDate} {//need to fix and get the exact date. Right now just showing the first date}
      </Typography> */}
      <Box mb={2}>
        <input type="file" onChange={handleFileChange} accept=".csv" />
        <Button variant="contained" color="primary" onClick={handleUpload}>
          Upload CSV
        </Button>
        <FormControl sx={{ ml: 2, minWidth: 120 }}>
          <InputLabel id="time-range-label">Time Range</InputLabel>
          <Select
            labelId="time-range-label"
            value={timeRange}
            onChange={handleTimeRangeChange}
            label="Time Range"
          >
            <MenuItem value="full">Full Data</MenuItem>
            <MenuItem value="5">Last 5 Minutes</MenuItem>
            <MenuItem value="10">Last 10 Minutes</MenuItem>
            <MenuItem value="30">Last 30 Minutes</MenuItem>
            <MenuItem value="60">Last Hour</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box display="flex">
        <Box flexGrow={1}>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTimestamp}
                interval="preserveStartEnd"
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(label) => label}
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
        </Box>
        <Box ml={2} width={300}>
          <Paper elevation={3} sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Anomalies
            </Typography>
            <List>
              {anomalies.map((anomaly, index) => (
                <ListItem key={index}>
                  <ListItemText 
                    primary={`Heart Rate: ${anomaly.heart_rate}`}
                    secondary={`Time: ${anomaly.timestamp}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}

export default App;

/**
 * TODO
 * Need to give option of seeing full timescale
 * Need to change yaxis labels
 */
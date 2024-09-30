import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { Button, Container, Typography, Box, Select, MenuItem, FormControl, InputLabel, Paper, List, ListItem, ListItemText } from '@mui/material';

const API_URL = 'http://localhost:8080/api/heart-rate/';

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

function App() {
  const [data, setData] = useState([]);
  const [file, setFile] = useState(null);
  const [chartDate, setChartDate] = useState('');
  const [timeRange, setTimeRange] = useState('full');
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}latest_readings/`, {
        params: { time_range: timeRange }
      });
      const processedData = detectAnomalies(response.data);
      setData(processedData);
      if (processedData.length > 0) {
        setChartDate(processedData[0].timestamp.split(' ')[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Reduced polling frequency
    return () => clearInterval(interval);
  }, [fetchData]);

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

  const detectAnomalies = useCallback((data) => {
    const threshold = 20;
    return data.map((reading, index) => {
      if (index === 0) return { ...reading, isAnomaly: false };
      const prevReading = data[index - 1];
      const bpmChange = Math.abs(reading.heart_rate - prevReading.heart_rate);
      return { ...reading, isAnomaly: bpmChange > threshold };
    });
  }, []);

  const anomalies = useMemo(() => data.filter(reading => reading.isAnomaly), [data]);

  const CustomizedDot = useCallback((props) => {
    const { cx, cy, payload } = props;
    if (payload.isAnomaly) {
      return <circle cx={cx} cy={cy} r={4} fill="red" />;
    }
    return null;
  }, []);

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Real-Time Heart Rate Monitor
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Date: {chartDate}
      </Typography>
      <Box mb={2} display="flex" alignItems="center">
        <input type="file" onChange={handleFileChange} accept=".csv" />
        <Button variant="contained" color="primary" onClick={handleUpload} sx={{ mx: 2 }}>
          Upload CSV
        </Button>
        <FormControl sx={{ minWidth: 120 }}>
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
        <Button variant="contained" color="primary" onClick={fetchData} sx={{ ml: 2 }} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Go'} {/**may not need because */} 
        </Button>
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
 * To make it more efficient
 * Frontend Efficiency Improvements:
Used useCallback for functions to prevent unnecessary re-creations.
- Explanation: useCallback is a React hook that memoizes functions, 
  preventing them from being recreated on every render.
- Why: This improves performance by reducing unnecessary re-renders of child 
  components that depend on these functions as props.
Implemented useMemo for expensive computations like filtering anomalies.
- Explanation: useMemo memoizes the result of a computation, only recalculating when dependencies change.
- Why: For operations like filtering anomalies, which might be computationally expensive, 
  this prevents unnecessary recalculations on every render, improving performance.
Reduced the polling frequency from 5 seconds to 30 seconds to decrease server load.
- Explanation: This increases the interval between data fetches from the server.
- Why: Less frequent polling reduces server load and network traffic, which is 
  especially beneficial if real-time updates aren't critical.
Added a loading state to prevent multiple simultaneous requests.
- Explanation: A loading state is used to track when data is being fetched.
- Why: This prevents multiple simultaneous requests to the server, reducing 
  unnecessary network traffic and potential race conditions.
Moved formatTimestamp outside the component to prevent re-creation on each render.
- Explanation: The function is defined outside the component's body.
- Why: This prevents the function from being recreated on each render,
  slightly improving memory usage and performance.
 */
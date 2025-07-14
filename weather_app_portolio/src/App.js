import { useState, useEffect } from 'react';
import './App.css';

import fiveDays from './daysWeather.json';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale);

function getBackgroundClass(weatherMain) {
  if (!weatherMain) return 'bg-default';

  const lower = weatherMain.toLowerCase();
  const known = ['clear', 'clouds', 'rain', 'drizzle', 'thunderstorm', 'snow'];

  if (!known.includes(lower)) {
    console.warn(`Unknown weather condition: ${weatherMain}`);
  }

  switch (lower) {
    case 'clear':
      return 'bg-sunny';
    case 'clouds':
      return 'bg-cloudy';
    case 'rain':
    case 'drizzle':
    case 'thunderstorm':
      return 'bg-rainy';
    case 'snow':
      return 'bg-snowy';
    default:
      return 'bg-default';
  }
}

function App() {
  const [apiData, setApiData] = useState({});
  const [getState, setGetState] = useState('Toronto');
  const [state, setState] = useState('Toronto');
  const [viewMode, setViewMode] = useState('current'); // 'current' or 'forecast'
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);

  const apiKey = process.env.REACT_APP_API_KEY;
  const useMockData = false;



  const getUserLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    
    // if geolocation is supported by the users browser
    if (navigator.geolocation) {
      // get the current users location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // save the geolocation coordinates in two variables
          const { latitude, longitude } = position.coords;
          // update the value of userlocation variable
          setUserLocation({ latitude, longitude });
          setLocationLoading(false);
          console.log('User location obtained:', { latitude, longitude });
        },
        // if there was an error getting the users location
        (error) => {
          console.error('Error getting user location:', error);
          setLocationError('Unable to get your location. Using default location.');
          setLocationLoading(false);
        },
        // Options for geolocation
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000 // 10 minutes
        }
      );
    }
    // if geolocation is not supported by the users browser
    else {
      console.error('Geolocation is not supported by this browser.');
      setLocationError('Geolocation is not supported by this browser.');
      setLocationLoading(false);
    }
  };

  // Get user location on component mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Fetch weather data when location changes or state changes
  useEffect(() => {
    const fetchWeatherData = () => {
      if (useMockData) {
        setApiData(fiveDays);
      } else {
        // Build API URL directly in the effect
        const apiUrl = userLocation && !useMockData
          ? `https://api.openweathermap.org/data/2.5/forecast?lat=${userLocation.latitude}&lon=${userLocation.longitude}&appid=${apiKey}`
          : `https://api.openweathermap.org/data/2.5/forecast?q=${state}&appid=${apiKey}`;
        
        fetch(apiUrl)
          .then((res) => res.json())
          .then((data) => {
            setApiData(data);
            // If we got data from coordinates, update the display location
            if (userLocation && data.city) {
              setGetState(data.city.name);
            }
          })
          .catch((error) => {
            console.error('Error fetching weather data:', error);
          });
      }
    };

    // Only fetch data if we're not still loading location
    if (!locationLoading) {
      fetchWeatherData();
    }
  }, [userLocation, state, locationLoading, useMockData, apiKey]);

  const inputHandler = (event) => {
    setGetState(event.target.value);
  };

  const submitHandler = () => {
    setState(getState);
    // Clear user location when manually searching to use city name instead
    setUserLocation(null);
  };

  const useCurrentLocationHandler = () => {
    getUserLocation();
  };

  const kelvinToCelsius = (k) => (k - 273.15).toFixed(1);

  // Group forecast data by day
  const groupForecastByDay = (forecastList) => {
    const grouped = {};
    forecastList.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    return grouped;
  };

  // Get daily summary (one entry per day with average/representative data)
  const getDailySummary = (forecastList) => {
    const grouped = groupForecastByDay(forecastList);
    return Object.keys(grouped).slice(0, 5).map(date => {
      const dayData = grouped[date];
      // Get midday forecast (around 12-15:00) or first available
      const representativeData = dayData.find(item => {
        const hour = new Date(item.dt * 1000).getHours();
        return hour >= 12 && hour <= 15;
      }) || dayData[0];
      
      // Calculate min/max for the day
      const temps = dayData.map(item => item.main.temp);
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);
      
      return {
        ...representativeData,
        dailyMin: minTemp,
        dailyMax: maxTemp,
        date: date
      };
    });
  };

  const currentWeather = apiData.list && apiData.list[0];
  const dailySummary = apiData.list ? getDailySummary(apiData.list) : [];

  const currentWeatherMain = currentWeather?.weather[0]?.main || '';
  const forecastWeatherMain = dailySummary[0]?.weather?.[0]?.main || '';
  const backgroundClass = getBackgroundClass(
    viewMode === 'current' ? currentWeatherMain : forecastWeatherMain
  );

  return (
    <div className={`min-h-screen p-4 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden ${backgroundClass}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-4">Weather Forecast</h1>
          
          {/* Location Status */}
          {locationLoading && (
            <div className="mb-4 text-black">
              <p>🌍 Getting your location...</p>
            </div>
          )}
          
          {locationError && (
            <div className="mb-4 text-red-600 bg-red-100 p-2 rounded-lg">
              <p>{locationError}</p>
            </div>
          )}
          
          {/* Search Bar */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <input
              type="text"
              placeholder="Enter location..."
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700"
              onChange={inputHandler}
              value={getState}
            />
            <button 
              onClick={submitHandler}
              className="px-6 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
            >
              Search
            </button>
            <button 
              onClick={useCurrentLocationHandler}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
              disabled={locationLoading}
            >
              📍 Use My Location
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setViewMode('current')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'current' 
                  ? 'bg-white text-blue-600' 
                  : 'bg-blue-500 text-black hover:bg-blue-400'
              }`}
            >
              Current Weather
            </button>
            <button
              onClick={() => setViewMode('forecast')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'forecast' 
                  ? 'bg-white text-blue-600' 
                  : 'bg-blue-500 text-black hover:bg-blue-400'
              }`}
            >
              5-Day Forecast
            </button>
          </div>
        </div>

        {apiData.city ? (
          <div>
            {/* Current Weather View */}
            {viewMode === 'current' && currentWeather && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-black shadow-xl">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <img
                      src={`http://openweathermap.org/img/w/${currentWeather.weather[0].icon}.png`}
                      alt="weather icon"
                      className="w-16 h-16"
                    />
                  </div>
                  
                  <h2 className="text-3xl font-bold mb-2">
                    {kelvinToCelsius(currentWeather.main.temp)}°C
                  </h2>
                  
                  <p className="text-xl mb-2">
                    {apiData.city.name}, {apiData.city.country}
                    {userLocation && <span className="text-sm ml-2">📍 Current Location</span>}
                  </p>
                  
                  <p className="text-lg mb-6 capitalize">
                    {currentWeather.weather[0].description}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="font-semibold">Feels like</p>
                      <p>{kelvinToCelsius(currentWeather.main.feels_like)}°C</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="font-semibold">Humidity</p>
                      <p>{currentWeather.main.humidity}%</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="font-semibold">Wind</p>
                      <p>{currentWeather.wind.speed} m/s</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="font-semibold">Pressure</p>
                      <p>{currentWeather.main.pressure} hPa</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="font-semibold">Visibility</p>
                      <p>{currentWeather.visibility / 1000} km</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="font-semibold">Clouds</p>
                      <p>{currentWeather.clouds.all}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5-Day Forecast View */}
            {viewMode === 'forecast' && (
              <div>
                <h3 className="text-2xl font-bold text-black text-center mb-6">
                  5-Day Forecast for {apiData.city.name}
                  {userLocation && <span className="text-sm ml-2">📍</span>}
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {dailySummary.map((day, index) => (
                    <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-black text-center">
                      <p className="font-semibold mb-2">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      
                      <img
                        src={`http://openweathermap.org/img/w/${day.weather[0].icon}.png`}
                        alt="weather icon"
                        className="w-12 h-12 mx-auto mb-2"
                      />
                      
                      <p className="text-lg font-bold mb-1">
                        {kelvinToCelsius(day.main.temp)}°C
                      </p>
                      
                      <p className="text-sm mb-2">
                        H: {kelvinToCelsius(day.dailyMax)}° L: {kelvinToCelsius(day.dailyMin)}°
                      </p>
                      
                      <p className="text-xs capitalize mb-2">
                        {day.weather[0].description}
                      </p>
                      
                      <div className="text-xs space-y-1">
                        <p>💧 {day.main.humidity}%</p>
                        <p>💨 {day.wind.speed} m/s</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-black">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
              <h2 className="text-2xl font-bold">
                {locationLoading ? 'Getting your location...' : 'Loading weather data...'}
              </h2>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-black/80 text-sm">
          <p>Created with React • Weather data from OpenWeatherMap</p>
          <p>Created by Neil Mannion</p>
          <a href='https://github.com/Sneakyweasel90/Weather_App'>---GitHub Repository---</a>
        </div>
      </div>
    </div>
  );
}

export default App;
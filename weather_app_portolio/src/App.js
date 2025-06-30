import { useState, useEffect } from 'react';
import './App.css';

import mockData from './exampleWeather.json';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
countries.registerLocale(enLocale);

function App() {
  const [apiData, setApiData] = useState({});
  const [getState, setGetState] = useState('Toronto');
  const [state, setState] = useState('Toronto');

  const apiKey = process.env.REACT_APP_API_KEY;
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${state}&appid=${apiKey}`;

  const useMockData = true;

useEffect(() => {
  if (useMockData) {
    setApiData(mockData);
  } else {
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => setApiData(data));
  }
}, [apiUrl, useMockData]);

  const inputHandler = (event) => {
    setGetState(event.target.value);
  };

  const submitHandler = () => {
    setState(getState);
  };

  const kelvinToCelsius = (k) => (k - 273.15).toFixed(2);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="App">
      <header className="d-flex justify-content-center align-items-center">
        <h2>My Weather App</h2>
      </header>

      <div className="container">
        <div className="col-auto">
          <label htmlFor="location-name" className="col-form-label">
            Enter Location :
          </label>
        </div>
        <div className="col-auto">
          <input
            type="text"
            id="location-name"
            className="form-control"
            onChange={inputHandler}
            value={getState}
          />
        </div>
        <button className="btn btn-primary mt-2" onClick={submitHandler}>
          Search
        </button>

        {apiData.main ? (
          <div className="card mt-3">
            <div className="card-body text-center">
              <img
                src={`http://openweathermap.org/img/w/${apiData.weather[0].icon}.png`}
                alt="weather status icon"
                className="weather-icon"
              />

              <p className="h2">
                {kelvinToCelsius(apiData.main.temp)}° C
              </p>

              <p className="h5">
                <i className="fas fa-map-marker-alt"></i>{' '}
                <strong>{apiData.name}</strong>
              </p>

              <div className="row mt-4">
                <div className="col-md-6">
                  <p><strong>Feels like:</strong> {kelvinToCelsius(apiData.main.feels_like)}° C</p>
                  <p><strong>Min:</strong> {kelvinToCelsius(apiData.main.temp_min)}° C</p>
                  <p><strong>Max:</strong> {kelvinToCelsius(apiData.main.temp_max)}° C</p>
                  <p><strong>Humidity:</strong> {apiData.main.humidity}%</p>
                  <p><strong>Pressure:</strong> {apiData.main.pressure} hPa</p>
                  <p><strong>{apiData.weather[0].main}</strong></p>
                </div>
                <div className="col-md-6">
                  <p><strong>Wind:</strong> {apiData.wind.speed} m/s</p>
                  <p><strong>Visibility:</strong> {apiData.visibility / 1000} km</p>
                  <p><strong>Clouds:</strong> {apiData.clouds.all}%</p>
                  <p><strong>Sunrise:</strong> {formatTime(apiData.sys.sunrise)}</p>
                  <p><strong>Sunset:</strong> {formatTime(apiData.sys.sunset)}</p>
                  <p><strong>{countries.getName(apiData.sys.country, 'en', {
                    select: 'official',
                  })}</strong></p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <h1 className="mt-4">Loading...</h1>
        )}
      </div>

      <footer className="footer">
        <code>
          Created by{' '}
          <a href="https://github.com/sneakyweasel90" target="_blank" rel="noreferrer">
            Neil Mannion
          </a>{' '}
          using React
        </code>
      </footer>
    </div>
  );
}

export default App;

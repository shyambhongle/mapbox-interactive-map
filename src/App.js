import { useState, useRef, useEffect } from 'react';
import './App.css';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'PLEASE ADD YOU MAPBOX ACCESS TOKEN HERE';

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-70.9); //INITAL LONGITUDE
  const [lat, setLat] = useState(42.35); //INITAL LATITUDE
  const [zoom, setZoom] = useState(9); //INITAL ZOOM
  const [siteData, setSiteData] = useState([]); //GREEN AGAIN MADAGASCAR SITE DATA

  useEffect(() => {
    getMadagascarData();
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',  //You can use other styles as well
      center: [lng, lat],
      zoom: zoom //Prefered zoom
    });
  }, []);

  useEffect(() => {
    if (siteData.length > 0 && map.current) {
      setupMap();
    }
  }, [siteData]);

  const setupMap = () => {
    if (!map.current) return; // Make sure the map is initialized
    // Fit the map to the first polygon site
    if (siteData.length > 0) {
      const firstFeature = siteData[0];
      const coordinates = firstFeature.geometry.coordinates[0][0];
      const bounds = coordinates.reduce((bounds, coord) => {  // WE use bounds to move the map to you desired points
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.current.fitBounds(bounds, {
        padding: 20
      });
    }

    //IMPORTANT: GEOJSON IS THE MOST IMPORTANT PART. PLease read about it from online resources. For this snippet we are using Feature Collection which has multipolygon features(Site data)

    map.current.on('load', () => {
      // Add the GeoJSON data as a new source
      map.current.addSource('polygons', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: siteData
        }
      });

      // Add a layer to use the GeoJSON data for polygons
      map.current.addLayer({
        id: 'polygons-layer',
        type: 'fill',
        source: 'polygons',
        layout: {},
        paint: {
          'fill-color': 'red',
          'fill-opacity': 0.5
        }
      });

      // Optionally, add popups for polygons
      map.current.on('click', 'polygons-layer', (e) => {
        const coordinates = e.lngLat;
        const description = e.features[0].properties.description;

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`<strong>${description}</strong>`)
          .addTo(map.current);
      });

      // Change the cursor to a pointer when over the polygons layer
      map.current.on('mouseenter', 'polygons-layer', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });

      // Change the cursor back when it leaves the polygons layer
      map.current.on('mouseleave', 'polygons-layer', () => {
        map.current.getCanvas().style.cursor = '';
      });
    });
  };

  const getMadagascarData = () => {
    fetch('https://app.plant-for-the-planet.org/app/projects/making-madagascar-green-again?_scope=extended&currency=INR&locale=en')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const features = data.sites.map(site => ({
          type: 'Feature',
          geometry: site.geometry,
          properties: site.properties
        }));
        setSiteData(features);
      })
      .catch((error) => {
        console.error('Fetching data failed:', error);
      });
  };

  return (
    <div className="app-container">
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default App;

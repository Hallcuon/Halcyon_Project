import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, MarkerClusterer } from '@react-google-maps/api';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import SelectedInfoWindow from './SelectedInfoWindow'; // Імпортуємо новий компонент
import CustomMarker from './CustomMarker'; // Імпортуємо оптимізований маркер

const containerStyle = {
  width: '100vw',
  height: '100vh'
};

const mapStyles = {
  light: [], // Default Google Maps style
  dark: [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#263c3f' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6b9a76' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#38414e' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212a37' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca5b3' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#746855' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#1f2835' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#f3d19c' }],
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: '#2f3948' }],
    },
    {
      featureType: 'transit.station',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#515c6d' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#17263c' }],
    },
  ],
};

const noLabelsStyle = [
  {
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

const ANONYMOUS_MESSAGE_MIN_ZOOM = 1;
const BEACON_MIN_ZOOM = 17;

function MapComponent({ placemarks, setPlacemarks, otherPlacemarks, anonymousMessages, beacons, setBeacons, theme, onFindAnonymousMessage, showLabels, mapTypeId, onOpenComments, stats }) {
  const [selected, setSelected] = useState(null);
  const [tempMarker, setTempMarker] = useState(null);
  const [placemarkTitle, setPlacemarkTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // --- Стани та посилання для збереження позиції карти ---
  const mapRef = useRef(null);
  const debounceTimeout = useRef(null);

  const [center, setCenter] = useState(() => {
    try {
      const savedCenter = localStorage.getItem('mapCenter');
      return savedCenter ? JSON.parse(savedCenter) : { lat: 50.4501, lng: 30.5234 }; // Default: Kyiv
    } catch (error) {
      console.error("Error parsing saved map center:", error);
      return { lat: 50.4501, lng: 30.5234 };
    }
  });

  const [zoom, setZoom] = useState(() => {
    try {
      const savedZoom = localStorage.getItem('mapZoom');
      return savedZoom ? JSON.parse(savedZoom) : 10; // Default zoom
    } catch (error) {
      console.error("Error parsing saved map zoom:", error);
      return 10;
    }
  });

  // --- Обробники подій карти ---

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    setZoom(map.getZoom()); // Синхронізуємо початковий зум
  }, []);

  const onUnmount = useCallback(function callback() {
    mapRef.current = null;
  }, []);

  // Зберігаємо позицію карти через 500 мс після того, як користувач перестав її рухати
  const handleMapStateChange = useCallback(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      if (mapRef.current) {
        const newCenter = mapRef.current.getCenter().toJSON();
        const newZoom = mapRef.current.getZoom();
        localStorage.setItem('mapCenter', JSON.stringify(newCenter));
        localStorage.setItem('mapZoom', JSON.stringify(newZoom));
        setZoom(newZoom); // Оновлюємо стан зуму для відображення маркерів
      }
    }, 500);
  }, []);

  // Очищуємо таймер при розмонтуванні компонента
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const handleMarkerClick = (item) => {
    if (mapRef.current) {
      mapRef.current.panTo({
        lat: parseFloat(item.latitude),
        lng: parseFloat(item.longitude),
      });
    }
    setIsEditing(false);
    setSelected(item);
  };

  const handleInfoWindowClose = () => {
    setSelected(null);
    setIsEditing(false);
  };

  const handleMapDblClick = (event) => {
    setTempMarker({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    });
    setPlacemarkTitle('');
    setSelected(null);
  };

  const handleSavePlacemark = () => {
    if (!placemarkTitle.trim()) {
      toast.error('Please enter a name for the placemark.');
      return;
    }

    const newPlacemarkData = {
      title: placemarkTitle,
      latitude: parseFloat(tempMarker.lat.toFixed(6)),
      longitude: parseFloat(tempMarker.lng.toFixed(6)),
    };

    axiosInstance.post('/placemarks/', newPlacemarkData)
      .then(response => {
        setPlacemarks(currentPlacemarks => [...currentPlacemarks, response.data]);
        setTempMarker(null);
        setPlacemarkTitle('');
      })
      .catch(error => {
        console.error("Error creating placemark:", error.response?.data || error.message);
        toast.error("Could not save the placemark.");
      });
  };

  const handleUpdatePlacemark = () => {
    if (!placemarkTitle.trim() || !selected) {
      toast.error('Title cannot be empty.');
      return;
    }

    axiosInstance.patch(`/placemarks/${selected.id}/`, { title: placemarkTitle })
      .then(response => {
        setPlacemarks(currentPlacemarks =>
          currentPlacemarks.map(p => (p.id === selected.id ? response.data : p))
        );
        setIsEditing(false);
        setSelected(response.data);
      })
      .catch(error => {
        console.error("Error updating placemark:", error.response?.data || error.message);
        toast.error("Could not update the placemark.");
      });
  };

  const handleDeletePlacemark = (placemarkId) => {
    if (window.confirm("Are you sure you want to delete this placemark?")) {
      axiosInstance.delete(`/placemarks/${placemarkId}/`)
        .then(() => {
          setPlacemarks(currentPlacemarks =>
            currentPlacemarks.filter(p => p.id !== placemarkId)
          );
          setSelected(null);
        })
        .catch(error => {
          console.error("Error deleting placemark:", error);
          toast.error("Could not delete the placemark.");
        });
    }
  };

  const handleActivateBeacon = (beaconId) => {
    // Send the activation request. Geolocation data is not required.
    axiosInstance.post(`/beacons/${beaconId}/activate/`, {})
      .then(response => {
        const updatedBeacon = response.data;
        setBeacons(currentBeacons =>
          currentBeacons.map(b => (b.id === beaconId ? updatedBeacon : b))
        );
        setSelected(null); // Закриваємо InfoWindow
      })
      .catch(error => {
        toast.error(error.response?.data?.detail || "Activation failed.");
      });
  };

  const mapOptions = useMemo(() => ({
    styles: showLabels ? mapStyles[theme] : [...mapStyles[theme], ...noLabelsStyle],
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
  }), [theme, showLabels]);

  // Determine if the selected placemark belongs to the current user
  // to decide whether to show Edit/Delete buttons.
  const isMyPlacemark = useMemo(() => {
    return selected && selected.title && placemarks.some(p => p.id === selected.id);
  }, [selected, placemarks]);

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={zoom}
      onLoad={onMapLoad}
      onUnmount={onUnmount}
      onDblClick={handleMapDblClick}
      onDragEnd={handleMapStateChange}
      onZoomChanged={handleMapStateChange}
      mapTypeId={mapTypeId}
      options={mapOptions}
    >
      <MarkerClusterer>
        {(clusterer) => (
          <>
            {placemarks.map(item => (
              <CustomMarker
                key={`placemark-${item.id}`}
                type="placemark"
                item={item}
                onClick={handleMarkerClick}
                clusterer={clusterer}
              />
            ))}
            {otherPlacemarks.map(item => (
              <CustomMarker
                key={`other-placemark-${item.id}`}
                type="otherPlacemark"
                item={item}
                onClick={handleMarkerClick}
                clusterer={clusterer}
              />
            ))}
            {zoom > ANONYMOUS_MESSAGE_MIN_ZOOM &&
              anonymousMessages.map(item => (
                <CustomMarker
                  key={`message-${item.id}`}
                  type="anonymousMessage"
                  item={item}
                  onClick={handleMarkerClick}
                  clusterer={clusterer}
                />
              ))}
            {zoom > BEACON_MIN_ZOOM &&
              beacons.map(item => (
                <CustomMarker
                  key={`beacon-${item.id}`}
                  type="beacon"
                  item={item}
                  onClick={handleMarkerClick}
                  clusterer={clusterer}
                />
              ))}
          </>
        )}
      </MarkerClusterer>

      {selected && (
        <InfoWindow
          position={{ lat: parseFloat(selected.latitude), lng: parseFloat(selected.longitude) }}
          onCloseClick={handleInfoWindowClose}
        >
          <SelectedInfoWindow
            selected={selected}
            isMyPlacemark={isMyPlacemark}
            isEditing={isEditing}
            placemarkTitle={placemarkTitle}
            stats={stats}
            setIsEditing={setIsEditing}
            setPlacemarkTitle={setPlacemarkTitle}
            handleUpdatePlacemark={handleUpdatePlacemark}
            handleDeletePlacemark={handleDeletePlacemark}
            onOpenComments={onOpenComments}
            onFindAnonymousMessage={onFindAnonymousMessage}
            handleActivateBeacon={handleActivateBeacon}
            setSelected={setSelected}
          />
        </InfoWindow>
      )}

      {tempMarker && (
        <InfoWindow
          position={tempMarker}
          onCloseClick={() => {
            setTempMarker(null);
            setPlacemarkTitle('');
          }}
        >
          <div className="info-window-content">
            <h3>Add New Placemark</h3>
            <input
              type="text"
              className="placemark-input"
              placeholder="Enter name"
              value={placemarkTitle}
              onChange={(e) => setPlacemarkTitle(e.target.value)}
            />
            <button className="iw-button" title="Save" onClick={handleSavePlacemark}>
              <img src="/SavePlacemark.png" alt="Save" />
            </button>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

export default React.memo(MapComponent);
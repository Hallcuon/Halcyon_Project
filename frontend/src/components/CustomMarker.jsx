import React from 'react';
import { Marker } from '@react-google-maps/api';

const ICONS = {
  placemark: '/OwnPoint.png',
  otherPlacemark: '/SomeonePoint.png',
  anonymousMessage: '/FallenPlane.png',
};

const getIconUrl = (type, item) => {
  if (type === 'beacon') {
    return item.is_activated ? '/ONbeacon.png' : '/OFFbeacon.png';
  }
  return ICONS[type];
};

const CustomMarker = ({ type, item, onClick, clusterer }) => {
  // The onClick handler passed from MapComponent is already memoized with useCallback.
  // This means it won't be a new function on every render unless its dependencies change.
  const handleClick = () => {
    onClick(item);
  };

  return (
    <Marker
      position={{ lat: parseFloat(item.latitude), lng: parseFloat(item.longitude) }}
      title={item.title || item.name}
      onClick={handleClick}
      icon={{
        url: getIconUrl(type, item),
        scaledSize: new window.google.maps.Size(30, 30),
      }}
      clusterer={clusterer}
    />
  );
};

// Memoize the component to prevent re-renders if props haven't changed.
export default React.memo(CustomMarker);
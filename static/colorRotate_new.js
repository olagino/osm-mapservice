var leafmapMarker = L.divIcon({
    className: 'svg-marker',
    html: '<div class="foo" onmouseout="markerUnfreeze()" onmouseover="markerFreeze()"></div>',
    iconSize: null,
    iconAnchor: null,
    popupAnchor: [0, -20]
});

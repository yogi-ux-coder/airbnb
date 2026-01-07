maptilersdk.config.apiKey = mapToken;

const map = new maptilersdk.Map({
  container: "map",
  style: maptilersdk.MapStyle.STREETS,
  center: coordinates,
  zoom: 9
});

const popup = new maptilersdk.Popup({ offset: 25 }).setHTML(
  `<p>Exact location will be provided after booking</p>`
);

new maptilersdk.Marker({ color: "#FF385C" })
  .setLngLat(coordinates)
  .setPopup(popup)
  .addTo(map);

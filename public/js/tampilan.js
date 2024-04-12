fetch('https://api.ipify.org?format=json')
  .then(response => response.json())
  .then(data => {
    document.getElementById('ip-address').textContent = data.ip;
  })
  .catch(error => console.error('Error fetching IP:', error));

fetch('/visitor')
.then(response => response.json())
.then(data => {
  const visitorCount = data;
  document.getElementById('visitor-count').innerText = visitorCount;
})
.catch(error => {
  console.error('Error fetching data:', error);
});

fetch('/getRequests')
.then(response => response.json())
.then(data => {
  const reqtotal = data.req_total;
  document.getElementById('req-total').innerText = reqtotal;
})
.catch(error => {
  console.error('Error fetching data:', error);
});

fetch('/getRequests')
.then(response => response.json())
.then(data => {
  const reqtoday = data.req_perhari;
  document.getElementById('req-today').innerText = reqtoday;
})
.catch(error => {
  console.error('Error fetching data:', error);
});

navigator.getBattery().then(function(battery) {
  updateBatteryStatus(battery);

  battery.addEventListener('levelchange', function() {
    updateBatteryStatus(battery);
  });

  battery.addEventListener('chargingchange', function() {
    updateBatteryStatus(battery);
  });
});

function updateBatteryStatus(battery) {
  const batteryLevel = Math.floor(battery.level * 100);
  const chargingStatus = battery.charging ? 'Charging' : 'Not Charging';

  document.getElementById('battery-level').textContent = batteryLevel;
  document.getElementById('charging-status').textContent = chargingStatus;
}

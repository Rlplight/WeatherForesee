const API="e06508c56b9ff69221a9f43ea24bbfc1";

let map,weatherLayer,cityLayer=L.layerGroup();
let chart=null;
let forecastData=null;
let cityOffset=null;

/* ELEMENTS */

const cityInput=document.getElementById("cityInput");
const landing=document.getElementById("landing");
const mainContent=document.getElementById("mainContent");

const cityLabel=document.getElementById("cityLabel");
const localTime=document.getElementById("localTime");

const info=document.getElementById("info");
const skyStatus=document.getElementById("skyStatus");

const humidity=document.getElementById("humidity");
const wind=document.getElementById("wind");
const pressure=document.getElementById("pressure");

const forecastGrid=document.getElementById("forecastGrid");

const layerSelect=document.getElementById("layerSelect");

const chartSection=document.getElementById("chartSection");
const chartCanvas=document.getElementById("chartCanvas");
const chartTitle=document.getElementById("chartTitle");

/* CLOCK */

setInterval(()=>{
if(cityOffset===null)return;

const utc=Date.now()+new Date().getTimezoneOffset()*60000;
const local=new Date(utc+cityOffset*1000);

localTime.textContent=local.toLocaleTimeString([],{
hour:"2-digit",minute:"2-digit",hour12:true
});
},1000);

/* MAP */

function initMap(lat,lon){

if(!map){

map=L.map("weatherMap").setView([lat,lon],6);

/* DEFAULT LEAFLET TILE */
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
attribution:"© OpenStreetMap"
}).addTo(map);

/* WEATHER LAYER */
weatherLayer=L.tileLayer(
`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API}`
).addTo(map);

cityLayer.addTo(map);

map.on("moveend",loadCityTemps);

}else{
map.setView([lat,lon],6);
}

}

/* CITY TEMPS */

async function loadCityTemps(){

if(map.getZoom()<6)return;

const b=map.getBounds();

const bbox=[b.getWest(),b.getSouth(),b.getEast(),b.getNorth(),10].join(",");

const r=await fetch(
`https://api.openweathermap.org/data/2.5/box/city?bbox=${bbox}&units=metric&appid=${API}`
);

const d=await r.json();

cityLayer.clearLayers();

d.list.forEach(c=>{
L.marker([c.coord.Lat,c.coord.Lon])
.bindTooltip(`${c.name} ${Math.round(c.main.temp)}°C`,{permanent:true})
.addTo(cityLayer);
});

}

/* LAYER SWITCH */

layerSelect.addEventListener("change",()=>{
map.removeLayer(weatherLayer);

weatherLayer=L.tileLayer(
`https://tile.openweathermap.org/map/${layerSelect.value}/{z}/{x}/{y}.png?appid=${API}`
).addTo(map);
});

/* FETCH */

async function fetchWeather(){

const city=cityInput.value.trim();
if(!city)return;

const r=await fetch(
`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API}`
);

const d=await r.json();

forecastData=d;

const cur=d.list[0];

landing.style.display="none";
mainContent.style.display="block";

cityLabel.textContent=d.city.name;
cityOffset=d.city.timezone;

info.innerHTML=`${Math.round(cur.main.temp)}°`;
skyStatus.textContent=cur.weather[0].main;

humidity.textContent=cur.main.humidity+"%";
wind.textContent=cur.wind.speed+" km/h";
pressure.textContent=cur.main.pressure+" hPa";

initMap(d.city.coord.lat,d.city.coord.lon);

buildForecast(d.list);

}

/* FORECAST */

function buildForecast(list){

const days={};

list.forEach(i=>{
const d=new Date(i.dt*1000).toDateString();
(days[d]=days[d]||[]).push(i);
});

forecastGrid.innerHTML="";

Object.keys(days).slice(0,7).forEach(d=>{

const arr=days[d];
const avg=(arr.reduce((s,x)=>s+x.main.temp,0)/arr.length).toFixed(1);

forecastGrid.innerHTML+=`
<div class="day-card">
<div>${new Date(d).toLocaleDateString("en-US",{weekday:"short"})}</div>
<div>${avg}°C</div>
</div>
`;

});

}

/* GRAPH */

function openChart(type){

if(chart){
chart.destroy();
}

const ctx=chartCanvas.getContext("2d");

const data=forecastData.list.map(i=>
type==="humidity"?i.main.humidity:
type==="wind"?i.wind.speed:
i.main.pressure
);

const labels=forecastData.list.map(i=>
new Date(i.dt*1000).getHours()+":00"
);

chart=new Chart(ctx,{
type:"line",
data:{
labels,
datasets:[{
data,
borderColor:"#60a5fa",
tension:.4
}]
}
});

chartTitle.textContent=type.toUpperCase();
chartSection.style.display="block";
}
setInterval(() => {
  document.getElementById("pairs").innerHTML = `
    SOM/USD: ${(Math.random()*0.0004+0.0002).toFixed(5)}<br>
    SOM/PAC: ${(Math.random()*2+1).toFixed(2)}<br>
    PAC/USD: ${(Math.random()*0.002+0.001).toFixed(4)}
  `;
}, 2000);

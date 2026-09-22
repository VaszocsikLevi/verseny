function oraFrissit() {
  const most = new Date();
  document.getElementById("ora").textContent = most.toLocaleTimeString("hu-HU");
}

oraFrissit();
setInterval(oraFrissit, 1000);
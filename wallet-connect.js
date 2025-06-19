// Connect Wallet Button
document.getElementById("connectWallet").addEventListener("click", async () => {
    if (window.tronWeb && window.tronWeb.ready) {
      tronWeb = window.tronWeb;
      alert("Wallet Connected: " + tronWeb.defaultAddress.base58);
    } else {
      alert("Please install or unlock TronLink wallet!");
    }
  });
  
  document.getElementById("connectWallet").addEventListener("click", async () => {
    if (window.tronWeb && window.tronWeb.ready) {
      const address = window.tronWeb.defaultAddress.base58;
      document.getElementById("walletStatus").innerText = "Connected: " + address;
    } else {
      alert("Please install or open TronLink or compatible wallet");
    }
  });
  
  window.addEventListener("load", () => {
    if (window.tronWeb && window.tronWeb.ready) {
      document.getElementById("walletStatus").innerText = "Wallet detected";
    }
  });
  
  